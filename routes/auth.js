const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const MAX_DEVICES = 2;

// 辅助：清理过期会话
async function cleanExpiredSessions(userId) {
  await pool.execute(
    'DELETE FROM user_sessions WHERE user_id = ? AND expires_at < NOW()',
    [userId]
  );
}

/**
 * POST /api/auth/login
 * 登录接口，限制每用户最多 MAX_DEVICES 台设备
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, password, role, school FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // —— 设备限制 ——
    await cleanExpiredSessions(user.id);

    const [activeSessions] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM user_sessions WHERE user_id = ?',
      [user.id]
    );

    if (activeSessions[0].cnt >= MAX_DEVICES) {
      // 挤掉最老的设备
      const [oldest] = await pool.execute(
        'SELECT id FROM user_sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1',
        [user.id]
      );
      if (oldest.length > 0) {
        await pool.execute('DELETE FROM user_sessions WHERE id = ?', [oldest[0].id]);
      }
    }

    // —— 签发 JWT ——
    const jti = crypto.randomUUID();
    const expiresInSeconds = 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, jti },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const deviceInfo = (req.headers['user-agent'] || '未知设备').substring(0, 255);
    const ipAddress = (req.ip || req.connection.remoteAddress || '').substring(0, 45);

    await pool.execute(
      'INSERT INTO user_sessions (user_id, jti, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, jti, deviceInfo, ipAddress, expiresAt]
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, school: user.school },
      device_count: Math.min(activeSessions[0].cnt + 1, MAX_DEVICES),
      max_devices: MAX_DEVICES
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/auth/logout
 * 登出接口，清除服务端会话
 */
router.delete('/logout', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM user_sessions WHERE jti = ?', [req.user.jti]);
    res.json({ message: '已退出登录' });
  } catch (err) {
    console.error('登出失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息（含设备数）
 */
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, role, school FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    await cleanExpiredSessions(req.user.id);
    const [sessions] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM user_sessions WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ ...rows[0], device_count: sessions[0].cnt, max_devices: MAX_DEVICES });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
