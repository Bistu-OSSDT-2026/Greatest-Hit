-- =============================================
-- 北信科旧物交换平台 - 数据库初始化脚本
-- =============================================

-- 创建数据库（如不存在）
CREATE DATABASE IF NOT EXISTS exchange_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE exchange_db;

-- --------------------
-- 1. 用户表
-- --------------------
DROP TABLE IF EXISTS goods;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL COMMENT 'bcrypt 哈希',
  role        ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  school      VARCHAR(100) DEFAULT '',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------
-- 2. 商品表
-- --------------------
CREATE TABLE goods (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0,
  `condition`     VARCHAR(20) NOT NULL DEFAULT '九成新' COMMENT '成色',
  location        VARCHAR(50)  NOT NULL,
  description     TEXT,
  image_url       VARCHAR(500) DEFAULT '',
  seller_id       INT NOT NULL,
  buyer_id        INT DEFAULT NULL,
  status          ENUM('onsale', 'offline', 'sold') NOT NULL DEFAULT 'onsale',
  offline_reason  TEXT DEFAULT NULL,
  notified        TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (buyer_id)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------
-- 3. 初始用户数据
-- --------------------
-- 密码统一为 123 的 bcryptjs 哈希（cost=10）
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'admin'),
('张三',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user'),
('李四',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user'),
('王五',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user'),
('赵六',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user'),
('孙七',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user'),
('周八',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user'),
('吴九',  '$2a$10$Z1478//uA75d4qDLAzA5TOEERyMoFQ4KAhGvi2Zm3u4NLyqLVkFJ2', 'user');

-- --------------------
-- 4. 初始商品数据
-- --------------------
INSERT INTO goods (name, price, `condition`, location, description, image_url, seller_id, buyer_id, status) VALUES
('高等数学第七版（同济）',      20.00, '九成新', '工学A',     '九成新，无笔记',         'https://picsum.photos/seed/1/600/400', (SELECT id FROM users WHERE username='张三'), NULL,                             'onsale'),
('全新英语四级词汇书',          15.00, '全新',   '文理B',     '几乎全新',               'https://picsum.photos/seed/2/600/400', (SELECT id FROM users WHERE username='李四'), (SELECT id FROM users WHERE username='王五'), 'onsale'),
('电路分析基础（第5版）',      25.00, '七成新', '信息C',     '有少量划线',             'https://picsum.photos/seed/3/600/400', (SELECT id FROM users WHERE username='赵六'), NULL,                             'onsale'),
('数据结构与算法（Python版）', 30.00, '八成新', '图书馆广场', '正版无破损',             'https://picsum.photos/seed/4/600/400', (SELECT id FROM users WHERE username='孙七'), (SELECT id FROM users WHERE username='周八'), 'onsale'),
('北信科校园卡套（全新）',      5.00, '全新',   '物美超市',  '买多了出两个',           'https://picsum.photos/seed/5/600/400', (SELECT id FROM users WHERE username='吴九'), NULL,                             'onsale'),
('考研数学复习全书',          40.00, '九成新', '学三公寓',  '2024版',                 'https://picsum.photos/seed/6/600/400', (SELECT id FROM users WHERE username='张三'), NULL,                             'onsale');
