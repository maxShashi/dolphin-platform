const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/dashboard/overview - Get dashboard overview data
router.get('/overview', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { balance: 0, spend: 0, impressions: 0, clicks: 0, ctr: 0 }, message: 'success' });
    }
    const totalRecharge = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'recharge' AND status = 'completed'").get().total;
    const totalWithdraw = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'withdraw' AND status = 'completed'").get().total;

    const consumptionData = db.prepare("SELECT COALESCE(SUM(total_spend), 0) as total, COALESCE(SUM(total_impressions), 0) as impressions, COALESCE(SUM(total_clicks), 0) as clicks FROM consumption_data").get();

    const balance = totalRecharge - totalWithdraw;
    const ctr = consumptionData.impressions > 0 ? ((consumptionData.clicks / consumptionData.impressions) * 100).toFixed(2) : 0;

    res.json({
      code: 200,
      data: {
        balance,
        spend: consumptionData.total,
        impressions: consumptionData.impressions,
        clicks: consumptionData.clicks,
        ctr: parseFloat(ctr)
      },
      message: 'success'
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取仪表盘概览失败' });
  }
});

// GET /api/dashboard/consumption - Get consumption chart data
router.get('/consumption', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: [], message: 'success' });
    }
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE date >= ? AND date <= ?';
      params = [startDate, endDate];
    }

    const data = db.prepare(`SELECT date, total_spend, total_impressions, total_clicks, ctr FROM consumption_data ${dateFilter} ORDER BY date ASC`).all(...params);

    res.json({ code: 200, data, message: 'success' });
  } catch (err) {
    console.error('Consumption data error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取消费数据失败' });
  }
});

// GET /api/dashboard/account-data - Get account data stats
router.get('/account-data', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { total: 0, normal: 0, banned: 0, active: 0 }, message: 'success' });
    }
    const total = db.prepare('SELECT COUNT(*) as count FROM ad_accounts').get().count;
    const normal = db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE status = 'normal'").get().count;
    const banned = db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE status = 'banned'").get().count;
    const active = db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE status = 'normal' AND total_spend > 0").get().count;

    res.json({
      code: 200,
      data: { total, normal, banned, active },
      message: 'success'
    });
  } catch (err) {
    console.error('Account data error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取账户数据失败' });
  }
});

// GET /api/dashboard/bi-analysis - Get BI analysis data
router.get('/bi-analysis', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { trend: [], pieData: [], accountList: [] }, message: 'success' });
    }
    // Consumption trend (last 7 days)
    const trend = db.prepare('SELECT date, total_spend FROM consumption_data ORDER BY date ASC LIMIT 7').all();

    // Pie chart data - consumption by account type
    const pieData = db.prepare(`
      SELECT a.account_type as name, COALESCE(SUM(c.total_spend), 0) as value
      FROM ad_accounts a
      LEFT JOIN consumption_data c ON a.account_id = c.account_id
      GROUP BY a.account_type
    `).all();

    // Account list - top spending accounts
    const accountList = db.prepare(`
      SELECT a.id, a.account_id, a.account_name, a.account_type, a.status, a.total_spend
      FROM ad_accounts a
      ORDER BY a.total_spend DESC
      LIMIT 10
    `).all();

    res.json({
      code: 200,
      data: {
        trend,
        pieData,
        accountList
      },
      message: 'success'
    });
  } catch (err) {
    console.error('BI analysis error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取BI分析数据失败' });
  }
});

// GET /api/dashboard/customer-service - Get customer service info
router.get('/customer-service', (req, res) => {
  try {
    // Return mock customer service info
    res.json({
      code: 200,
      data: {
        name: '美啦啦',
        telegram: '@meilala32'
      },
      message: 'success'
    });
  } catch (err) {
    console.error('Customer service error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取客服信息失败' });
  }
});

module.exports = router;