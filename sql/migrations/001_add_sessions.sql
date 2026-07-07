-- =============================================
-- 迁移: 添加用户会话表（设备登录限制）
-- 功能: 限制每个用户最多同时登录 2 个设备
-- =============================================

USE exchange_db;

CREATE TABLE IF NOT EXISTS user_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  jti         VARCHAR(64) NOT NULL UNIQUE COMMENT 'JWT Token 的唯一标识',
  device_info VARCHAR(255) DEFAULT '' COMMENT '设备信息（User-Agent）',
  ip_address  VARCHAR(45) DEFAULT '' COMMENT '登录 IP',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL COMMENT 'Token 过期时间',

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 定期清理过期会话的事件（可选，手动执行亦可）
-- DELETE FROM user_sessions WHERE expires_at < NOW();
