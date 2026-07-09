require('dotenv').config();
 
const express = require('express');
const path = require('path');
const os = require('os');

const authRoutes = require('./routes/auth');
const goodsRoutes = require('./routes/goods'); 
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------
// 中间件
// --------------------
app.use(express.json());                         // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码请求体
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件（前端页面）

// --------------------
// API 路由
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/goods', goodsRoutes);
app.use('/api/admin', adminRoutes);

// --------------------
// 健康检查
// --------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --------------------
// 所有其他请求返回 index.html（SPA fallback）
// --------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --------------------
// 全局错误处理
// --------------------
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// --------------------
// 启动服务
// --------------------
app.listen(PORT, '0.0.0.0', () => {
  // 获取本机所有 IPv4 地址，方便局域网访问
  const nets = os.networkInterfaces();
  const localIPs = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIPs.push(net.address);
      }
    }
  }
  console.log(`========================================`);
  console.log(`  北信科旧物交换平台后端已启动`);
  console.log(`  本机访问:   http://localhost:${PORT}`);
  localIPs.forEach(ip => {
    console.log(`  局域网访问: http://${ip}:${PORT}  (同WiFi的同学用这个)`);
  });
  console.log(`========================================`);
});
