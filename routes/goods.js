const express = require('express');
const pool = require('../config/db');
const { auth } = require('../middleware/auth');
const { sanitizeObject } = require('../utils/sanitize');

const router = express.Router();

/**
 * GET /api/goods
 * 浏览在售商品，支持筛选
 * 查询参数: keyword, maxPrice, condition
 */
router.get('/', async (req, res) => {
  try {
    const { keyword = '', maxPrice = 999999, condition = '' } = req.query;

    let sql = `
      SELECT g.*, u.username AS seller
      FROM goods g
      JOIN users u ON g.seller_id = u.id
      WHERE g.status = 'onsale'
    `;
    const params = [];

    if (keyword) {
      sql += ' AND g.name LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (maxPrice && parseFloat(maxPrice) < 999999) {
      sql += ' AND g.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    if (condition) {
      sql += ' AND g.condition = ?';
      params.push(condition);
    }

    sql += ' ORDER BY g.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(sanitizeObject(rows));
  } catch (err) {
    console.error('获取商品列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/goods/my
 * 获取当前用户发布的商品
 */
router.get('/my', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT g.*, u.username AS seller
       FROM goods g
       JOIN users u ON g.seller_id = u.id
       WHERE g.seller_id = ?
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(sanitizeObject(rows));
  } catch (err) {
    console.error('获取我的商品失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/goods/:id
 * 获取商品详情
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT g.*, u.username AS seller
       FROM goods g
       JOIN users u ON g.seller_id = u.id
       WHERE g.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json(sanitizeObject(rows[0]));
  } catch (err) {
    console.error('获取商品详情失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/goods
 * 发布新商品
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, condition, location, description, image_url } = req.body;

    if (!name || price === undefined || price === null || price < 0) {
      return res.status(400).json({ error: '请正确填写商品名称和价格' });
    }

    const imageUrl = image_url || `https://picsum.photos/seed/${Date.now()}/600/400`;

    const [result] = await pool.execute(
      `INSERT INTO goods (name, price, \`condition\`, location, description, image_url, seller_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'onsale')`,
      [name, parseFloat(price), condition || '九成新', location || '学一公寓', description || '', imageUrl, req.user.id]
    );

    // 返回新创建的商品
    const [newRows] = await pool.execute(
      `SELECT g.*, u.username AS seller
       FROM goods g
       JOIN users u ON g.seller_id = u.id
       WHERE g.id = ?`,
      [result.insertId]
    );

    res.status(201).json(sanitizeObject(newRows[0]));
  } catch (err) {
    console.error('发布商品失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/goods/my/offline-notifications
 * 获取当前用户的下架通知
 */
router.get('/my/offline-notifications', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, offline_reason
       FROM goods
       WHERE seller_id = ? AND status = 'offline' AND notified = 0`,
      [req.user.id]
    );

    // 标记为已通知
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      await pool.execute(
        `UPDATE goods SET notified = 1 WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
    }

    res.json(sanitizeObject(rows));
  } catch (err) {
    console.error('获取下架通知失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
