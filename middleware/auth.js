const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// 认证中间件：解析 JWT 并验证 session 仍然有效
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录或 token 无效' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, jti }

    // 验证 session 未被登出或挤下线
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
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

// 管理员权限中间件（必须放在 auth 之后）
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: '需要管理员权限' });
  }
};

module.exports = { auth, adminOnly };
