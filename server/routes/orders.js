const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/orders/rental - List rental orders
router.get('/rental', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20, status, platform, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (platform) {
      whereClauses.push('platform = ?');
      params.push(platform);
    }
    if (search) {
      whereClauses.push('(order_no LIKE ? OR account_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM rental_orders ${whereSQL}`).get(...params);
    const total = countRow.total;

    const orders = db.prepare(`SELECT * FROM rental_orders ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      code: 200,
      data: {
        list: orders,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('List rental orders error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取租赁订单列表失败' });
  }
});

// GET /api/orders/rental/stats - Get rental order stats
router.get('/rental/stats', (req, res) => {
  try {
    // Non-admin users see empty stats
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { total: 0, delivering: 0, pending: 0, delivered: 0 }, message: 'success' });
    }
    const total = db.prepare('SELECT COUNT(*) as count FROM rental_orders').get().count;
    const delivering = db.prepare("SELECT COUNT(*) as count FROM rental_orders WHERE status = 'delivering'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM rental_orders WHERE status = 'pending'").get().count;
    const delivered = db.prepare("SELECT COUNT(*) as count FROM rental_orders WHERE status = 'delivered'").get().count;

    res.json({
      code: 200,
      data: { total, delivering, pending, delivered },
      message: 'success'
    });
  } catch (err) {
    console.error('Rental order stats error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取租赁订单统计失败' });
  }
});

// POST /api/orders/rental/:id/extract - Extract account from rental order
router.post('/rental/:id/extract', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM rental_orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ code: 404, data: null, message: '订单不存在' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ code: 400, data: null, message: '只有已交付的订单才能提取账户' });
    }

    // Mark the account as extracted by updating rental_notes
    if (order.account_id) {
      const now = new Date().toISOString();
      db.prepare('UPDATE ad_accounts SET rental_notes = ?, updated_at = ? WHERE account_id = ?').run('已提取', now, order.account_id);
    }

    res.json({ code: 200, data: order, message: '提取账户成功' });
  } catch (err) {
    console.error('Extract account error:', err);
    res.status(500).json({ code: 500, data: null, message: '提取账户失败' });
  }
});

// GET /api/orders/recharge - List recharge orders
router.get('/recharge', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20, payment_status, recharge_status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    if (payment_status) {
      whereClauses.push('payment_status = ?');
      params.push(payment_status);
    }
    if (recharge_status) {
      whereClauses.push('recharge_status = ?');
      params.push(recharge_status);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM recharge_orders ${whereSQL}`).get(...params);
    const total = countRow.total;

    const orders = db.prepare(`SELECT * FROM recharge_orders ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      code: 200,
      data: {
        list: orders,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('List recharge orders error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取充值订单列表失败' });
  }
});

// GET /api/orders/recharge/stats - Get recharge order stats
router.get('/recharge/stats', (req, res) => {
  try {
    // Non-admin users see empty stats
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { total: 0, pending: 0, completed: 0, failed: 0 }, message: 'success' });
    }
    const total = db.prepare('SELECT COUNT(*) as count FROM recharge_orders').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM recharge_orders WHERE recharge_status = 'pending'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM recharge_orders WHERE recharge_status = 'completed'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM recharge_orders WHERE recharge_status = 'failed'").get().count;

    res.json({
      code: 200,
      data: { total, pending, completed, failed },
      message: 'success'
    });
  } catch (err) {
    console.error('Recharge order stats error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取充值订单统计失败' });
  }
});

module.exports = router;