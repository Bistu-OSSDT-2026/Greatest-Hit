# 北信科旧物交换平台 - 后端

基于 **Node.js + Express + MySQL + JWT** 的二手物品交易平台后端。

## 📁 项目结构

```
exchange-backend/
├── package.json              # 依赖配置
├── .env                      # 环境变量
├── server.js                 # 入口
├── config/
│   └── db.js                 # MySQL 连接池
├── middleware/
│   └── auth.js               # JWT 认证 + 管理员权限中间件
├── routes/
│   ├── auth.js               # 登录 / 当前用户
│   ├── goods.js              # 商品浏览 / 发布 / 我的商品
│   └── admin.js              # 管理员：全部商品 / 下架 / 恢复
├── utils/
│   └── sanitize.js           # XSS 防护
├── sql/
│   └── init.sql              # 建表 + 初始数据
└── public/
    └── index.html            # 前端页面
```

## 🚀 启动步骤

### 1. 安装依赖
```bash
cd exchange-backend
npm install
```

### 2. 配置数据库
编辑 `.env`，填入你的 MySQL 账号密码：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=exchange_db
```

### 3. 初始化数据库
在 MySQL 中执行 `sql/init.sql`：
```bash
mysql -u root -p < sql/init.sql
```
或用 Navicat / MySQL Workbench 打开 `sql/init.sql` 执行。

### 4. 启动服务
```bash
npm start
```
看到以下提示即成功：
```
=================================
  北信科旧物交换平台后端已启动
  地址: http://localhost:3000
=================================
```

### 5. 访问
浏览器打开 http://localhost:3000 即可使用。

## 👤 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123 | 管理员 |
| 张三 / 李四 / 王五 ... | 123 | 普通用户 |

## 📡 API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录，返回 JWT |
| GET | /api/auth/me | 获取当前用户（需 token） |

### 商品
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/goods?keyword=&maxPrice=&condition= | 浏览在售商品 |
| GET | /api/goods/:id | 商品详情 |
| POST | /api/goods | 发布商品（需 token） |
| GET | /api/goods/my | 我发布的商品（需 token） |
| GET | /api/goods/my/offline-notifications | 下架通知（需 token） |

### 管理员（需 admin token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/goods?keyword= | 全部商品 |
| PUT | /api/admin/goods/:id/offline | 下架 |
| PUT | /api/admin/goods/:id/restore | 恢复 |

## 🔐 安全特性

- ✅ 密码使用 **bcrypt** 哈希存储
- ✅ **JWT** 令牌认证，有效期 24 小时
- ✅ 角色由**服务器决定**，前端无法篡改
- ✅ 管理员接口有**权限中间件**保护
- ✅ 所有用户输入经**服务端 XSS 转义**
- ✅ SQL 使用**参数化查询**，防 SQL 注入
