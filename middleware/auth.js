const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

/**
 * JWT 认证中间件
 * 1. 从 Authorization: Bearer <token> 中提取并验证 token
 * 2. 验证 token 对应的 session 是否仍然有效（未被登出/挤下线）
 */
async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, jti }

    // 验证 session 是否仍然有效（是否被登出或挤下线）
    if (decoded.jti) {
      const [sessions] = await pool.execute(
        'SELECT id FROM user_sessions WHERE jti = ?',
        [decoded.jti]
      );
      if (sessions.length === 0) {
        return res.status(401).json({ error: '会话已失效，请在原设备重新登录' });
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

/**
 * 管理员权限中间件
 * 必须在 auth 中间件之后使用
 */
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无管理员权限' });
  }
  next();
}

module.exports = { auth, adminOnly };
