const express = require('express');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const { sanitizeObject } = require('../utils/sanitize');

const router = express.Router();

// 所有管理员路由都需要认证 + 管理员权限
router.use(auth, adminOnly);

/**
 * GET /api/admin/goods
 * 获取所有商品（含下架），支持搜索
 */
router.get('/goods', async (req, res) => {
  try {
    const { keyword = '' } = req.query;

    let sql = `
      SELECT g.*, u.username AS seller,
             IFNULL(buyer.username, '未售出') AS buyer
      FROM goods g
      JOIN users u ON g.seller_id = u.id
      LEFT JOIN users buyer ON g.buyer_id = buyer.id
    `;
    const params = [];

    if (keyword) {
      sql += ' WHERE g.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    sql += ' ORDER BY g.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(sanitizeObject(rows));
  } catch (err) {
    console.error('获取管理商品列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/admin/goods/:id/offline
 * 下架商品
 */
router.put('/goods/:id/offline', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: '请填写下架原因' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, status FROM goods WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '商品不存在' });
    }

    if (rows[0].status !== 'onsale') {
      return res.status(400).json({ error: '商品不在售，无法下架' });
    }

    await pool.execute(
      'UPDATE goods SET status = ?, offline_reason = ?, notified = 0 WHERE id = ?',
      ['offline', reason, req.params.id]
    );

    res.json({ message: `商品"${rows[0].name}"已下架` });
  } catch (err) {
    console.error('下架商品失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/admin/goods/:id/restore
 * 恢复上架
 */
router.put('/goods/:id/restore', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, status FROM goods WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '商品不存在' });
    }

    if (rows[0].status !== 'offline') {
      return res.status(400).json({ error: '商品未下架，无需恢复' });
    }

    await pool.execute(
      'UPDATE goods SET status = ?, offline_reason = NULL WHERE id = ?',
      ['onsale', req.params.id]
    );

    res.json({ message: `商品"${rows[0].name}"已恢复上架` });
  } catch (err) {
    console.error('恢复上架失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
