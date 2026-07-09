# 北信科旧物交换平台 - 后端

基于 **Node.js + Express + MySQL + JWT** 的二手物品交易平台后端。

## 🌐 在线访问

| 方式 | 地址 |
|------|------|
| 本机 | http://localhost:3000 |
| 公网（ngrok 隧道） | https://lizard-strut-commodity.ngrok-free.dev |

## 📁 项目结构

```
exchange-backend/
├── package.json              # 依赖配置
├── .env                      # 环境变量（不上传 Git）
├── .env.example              # 环境变量示例
├── server.js                 # 入口
├── config/
│   └── db.js                 # MySQL 连接池
├── middleware/
│   └── auth.js               # JWT 认证 + session 验证 + 管理员权限
├── routes/
│   ├── auth.js               # 登录 / 登出 / 设备限制 / 当前用户
│   ├── goods.js              # 商品浏览 / 发布 / 我的商品
│   └── admin.js              # 管理员：全部商品 / 下架 / 恢复
├── utils/
│   └── sanitize.js           # XSS 防护
├── sql/
│   ├── init.sql              # 建表 + 初始数据
│   └── migrations/
│       └── 001_add_sessions.sql  # 设备限制会话表
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
复制 `.env.example` 为 `.env`，填入 MySQL 账号密码：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=exchange_db
```

### 3. 初始化数据库
```bash
mysql -u root -p --default-character-set=utf8mb4 < sql/init.sql
mysql -u root -p --default-character-set=utf8mb4 < sql/migrations/001_add_sessions.sql
```

### 4. 启动服务
```bash
npm start
```
看到以下提示即成功：
```
=================================
  北信科旧物交换平台后端已启动
  本机访问: http://localhost:3000
=================================
```

### 5. 公网访问（可选）
```bash
# 方式A：ngrok（稳定，需注册免费账号 https://ngrok.com）
./ngrok http 3000

# 方式B：localtunnel（无需注册）
npx lt --port 3000
```

## 👤 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123 | 管理员 |
| 张三 / 李四 / 王五 / 赵六 / 孙七 / 周八 / 吴九 | 123 | 普通用户 |

## 🔐 设备登录限制

每用户最多同时 **2 台设备**在线。超出后自动踢除最早登录的设备。

| 行为 | 结果 |
|------|------|
| 第 1 次登录 | ✅ 正常（1/2） |
| 第 2 次登录 | ✅ 正常（2/2） |
| 第 3 次登录 | ⚠️ 自动挤掉最早设备 |
| 登出 | JWT 立即失效 |

## 📡 API 接口

### 认证
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录，返回 JWT + 设备数 | 否 |
| DELETE | /api/auth/logout | 登出，清除服务端会话 | JWT |
| GET | /api/auth/me | 获取当前用户 + 设备数 | JWT |

### 商品
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/goods?keyword=&maxPrice=&condition= | 浏览在售商品 | 否 |
| GET | /api/goods/:id | 商品详情 | 否 |
| POST | /api/goods | 发布商品 | JWT |
| GET | /api/goods/my | 我发布的商品 | JWT |
| GET | /api/goods/my/offline-notifications | 下架通知 | JWT |

### 管理员
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/admin/goods?keyword= | 全部商品 | Admin |
| PUT | /api/admin/goods/:id/offline | 下架（需 reason） | Admin |
| PUT | /api/admin/goods/:id/restore | 恢复上架 | Admin |

## 🔐 安全特性

- ✅ 密码使用 **bcrypt** 哈希存储（cost=10）
- ✅ **JWT** 令牌认证 + jti 追踪，有效期 24 小时
- ✅ 角色由**服务器决定**，前端无法篡改
- ✅ **设备限制**：每用户最多 2 台设备，超限自动踢除
- ✅ **登出即失效**：服务端清除 session，旧 token 无法复用
- ✅ 管理员接口有**双重中间件**保护（auth + adminOnly）
- ✅ 所有用户输入经**服务端 XSS 转义**
- ✅ SQL 使用**参数化查询**，防 SQL 注入

## 🤝 贡献指南

欢迎参与本项目开发，本文档说明项目的协作规则与开发规范，所有贡献请遵循以下流程。

## 1. 参与开发流程
1. 在仓库 Issues 板块查看现有任务，或新建 Issue 描述需求/问题
2. 认领任务后，从 `main` 分支新建独立功能分支进行开发
3. 本地开发完成并完成接口自测后，提交 Pull Request
4. PR 必须关联对应 Issue，经至少 1 名项目成员 Review 通过后，方可合并入主分支

## 2. 分支命名规范
- 新功能开发：`feature/功能名称`，例如 `feature/goods-publish`
- 问题修复：`fix/问题描述`，例如 `fix/price-validate`
- 文档更新：`docs/更新内容`，例如 `docs/update-readme`

## 3. 代码提交规范
提交信息统一采用前缀 + 描述的格式，示例：
- `feat: 新增商品搜索接口`
- `fix: 修复登录接口参数校验问题`
- `docs: 更新接口文档`
- `style: 调整代码格式`

## 4. Pull Request 要求
1. PR 标题清晰说明本次变更内容
2. PR 描述中关联对应 Issue 编号
3. 新增接口需同步更新 README 中的接口文档
4. 涉及数据库表结构变更，需同步更新 `sql/` 目录下的脚本

## 5. 本地开发环境要求
- Node.js 版本 >= 16
- MySQL 版本 >= 5.7
- 开发前配置 `.env` 环境变量，导入 `sql/init.sql` 初始化数据库
- 提交前本地启动服务，自测相关接口功能正常

## 6. 问题反馈
发现 Bug 或有功能建议，请在 Issues 中新建工单，详细描述复现步骤、预期结果与实际结果。
