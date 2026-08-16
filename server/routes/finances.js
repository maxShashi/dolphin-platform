const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/finances/balance - Get platform balance and frozen funds
router.get('/balance', (req, res) => {
  try {
    // Non-admin users see empty balance
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { balance: 0, frozen: 0, totalRecharge: 0, totalWithdraw: 0 }, message: 'success' });
    }
    const totalRecharge = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'recharge' AND status = 'completed'").get().total;
    const totalWithdraw = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'withdraw' AND status = 'completed'").get().total;
    const frozenFunds = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'frozen' AND status = 'frozen'").get().total;

    res.json({
      code: 200,
      data: {
        balance: totalRecharge - totalWithdraw,
        frozen: frozenFunds,
        totalRecharge,
        totalWithdraw
      },
      message: 'success'
    });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取余额失败' });
  }
});

// GET /api/finances/flows - List fund flows
router.get('/flows', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20, type, status, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    if (type && type !== 'all') {
      whereClauses.push('type = ?');
      params.push(type);
    }
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate + 'T23:59:59.999Z');
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM fund_flows ${whereSQL}`).get(...params);
    const total = countRow.total;

    const flows = db.prepare(`SELECT * FROM fund_flows ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      code: 200,
      data: {
        list: flows,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('List fund flows error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取资金流水失败' });
  }
});

// GET /api/finances/recharge-records - Recharge records
router.get('/recharge-records', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const countRow = db.prepare("SELECT COUNT(*) as total FROM fund_flows WHERE type = 'recharge'").get();
    const total = countRow.total;

    const records = db.prepare("SELECT * FROM fund_flows WHERE type = 'recharge' ORDER BY id DESC LIMIT ? OFFSET ?").all(limit, offset);

    res.json({
      code: 200,
      data: {
        list: records,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('Recharge records error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取充值记录失败' });
  }
});

// GET /api/finances/withdraw-records - Withdraw records
router.get('/withdraw-records', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const countRow = db.prepare("SELECT COUNT(*) as total FROM fund_flows WHERE type = 'withdraw'").get();
    const total = countRow.total;

    const records = db.prepare("SELECT * FROM fund_flows WHERE type = 'withdraw' ORDER BY id DESC LIMIT ? OFFSET ?").all(limit, offset);

    res.json({
      code: 200,
      data: {
        list: records,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('Withdraw records error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取提现记录失败' });
  }
});

// GET /api/finances/frozen-records - Frozen fund records
router.get('/frozen-records', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const countRow = db.prepare("SELECT COUNT(*) as total FROM fund_flows WHERE type = 'frozen'").get();
    const total = countRow.total;

    const records = db.prepare("SELECT * FROM fund_flows WHERE type = 'frozen' ORDER BY id DESC LIMIT ? OFFSET ?").all(limit, offset);

    res.json({
      code: 200,
      data: {
        list: records,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('Frozen records error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取冻结记录失败' });
  }
});

module.exports = router;