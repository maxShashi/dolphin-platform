const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/accounts - List accounts with pagination and filtering
router.get('/', (req, res) => {
  try {
    // Non-admin users see empty data
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
    }
    const { page = 1, pageSize = 20, status, type, attr, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (type) {
      whereClauses.push('account_type = ?');
      params.push(type);
    }
    if (attr) {
      whereClauses.push('account_attr = ?');
      params.push(attr);
    }
    if (search) {
      whereClauses.push('(account_id LIKE ? OR account_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM ad_accounts ${whereSQL}`).get(...params);
    const total = countRow.total;

    const accounts = db.prepare(`SELECT * FROM ad_accounts ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      code: 200,
      data: {
        list: accounts,
        total,
        page: parseInt(page),
        pageSize: limit
      },
      message: 'success'
    });
  } catch (err) {
    console.error('List accounts error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取账户列表失败' });
  }
});

// GET /api/accounts/stats - Get account stats by amount range
router.get('/stats', (req, res) => {
  try {
    // Non-admin users see empty stats
    if (req.user.email !== 'admin@dolphin.com') {
      return res.json({ code: 200, data: { '0-10': 0, '10-100': 0, '100-500': 0, '500-1000': 0, '1000-2000': 0, '2000+': 0 }, message: 'success' });
    }
    const stats = {
      '0-10': db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend >= 0 AND total_spend <= 10").get().count,
      '10-100': db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 10 AND total_spend <= 100").get().count,
      '100-500': db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 100 AND total_spend <= 500").get().count,
      '500-1000': db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 500 AND total_spend <= 1000").get().count,
      '1000-2000': db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 1000 AND total_spend <= 2000").get().count,
      '2000+': db.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 2000").get().count
    };

    res.json({ code: 200, data: stats, message: 'success' });
  } catch (err) {
    console.error('Account stats error:', err);
    res.status(500).json({ code: 500, data: null, message: '获取账户统计失败' });
  }
});

// PUT /api/accounts/batch-status - Batch update account status
router.put('/batch-status', (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ code: 400, data: null, message: '参数错误' });
    }

    const validStatuses = ['normal', 'banned', 'cleared', 'recycling'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ code: 400, data: null, message: '无效的状态值' });
    }

    const now = new Date().toISOString();
    const updateStmt = db.prepare('UPDATE ad_accounts SET status = ?, updated_at = ? WHERE id = ?');

    const updateMany = db.transaction((ids) => {
      for (const id of ids) {
        updateStmt.run(status, now, id);
      }
    });

    updateMany(ids);

    res.json({ code: 200, data: { updated: ids.length }, message: '批量更新状态成功' });
  } catch (err) {
    console.error('Batch status error:', err);
    res.status(500).json({ code: 500, data: null, message: '批量更新状态失败' });
  }
});

// POST /api/accounts/batch-recharge - Batch recharge
router.post('/batch-recharge', (req, res) => {
  try {
    const { ids, amount } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !amount) {
      return res.status(400).json({ code: 400, data: null, message: '参数错误' });
    }

    const now = new Date().toISOString();
    const updateStmt = db.prepare('UPDATE ad_accounts SET total_spend = total_spend + ?, updated_at = ? WHERE id = ?');

    const rechargeMany = db.transaction((ids) => {
      for (const id of ids) {
        updateStmt.run(amount, now, id);
      }
    });

    rechargeMany(ids);

    res.json({ code: 200, data: { updated: ids.length }, message: '批量充值成功' });
  } catch (err) {
    console.error('Batch recharge error:', err);
    res.status(500).json({ code: 500, data: null, message: '批量充值失败' });
  }
});

// POST /api/accounts/batch-adjust - Batch adjust business number
router.post('/batch-adjust', (req, res) => {
  try {
    const { ids, bmId } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !bmId) {
      return res.status(400).json({ code: 400, data: null, message: '参数错误' });
    }

    const now = new Date().toISOString();
    const updateStmt = db.prepare('UPDATE ad_accounts SET bm_id = ?, updated_at = ? WHERE id = ?');

    const adjustMany = db.transaction((ids) => {
      for (const id of ids) {
        updateStmt.run(bmId, now, id);
      }
    });

    adjustMany(ids);

    res.json({ code: 200, data: { updated: ids.length }, message: '批量调整商务号成功' });
  } catch (err) {
    console.error('Batch adjust error:', err);
    res.status(500).json({ code: 500, data: null, message: '批量调整商务号失败' });
  }
});

// GET /api/accounts/export - Export accounts CSV
router.get('/export', (req, res) => {
  try {
    // Non-admin users get empty CSV
    if (req.user.email !== 'admin@dolphin.com') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=accounts.csv');
      return res.send('\uFEFFID,账户ID,账户名称,账户类型,账户属性,商务号,时区,总消耗,状态,投放时间,租赁备注,账户备注,账户标签,创建时间');
    }
    const { status, type, attr, search } = req.query;

    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (type) {
      whereClauses.push('account_type = ?');
      params.push(type);
    }
    if (attr) {
      whereClauses.push('account_attr = ?');
      params.push(attr);
    }
    if (search) {
      whereClauses.push('(account_id LIKE ? OR account_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const accounts = db.prepare(`SELECT * FROM ad_accounts ${whereSQL} ORDER BY id DESC`).all(...params);

    const headers = ['ID', '账户ID', '账户名称', '账户类型', '账户属性', '商务号', '时区', '总消耗', '状态', '投放时间', '租赁备注', '账户备注', '账户标签', '创建时间'];
    const csvRows = [headers.join(',')];

    for (const acc of accounts) {
      const row = [
        acc.id,
        acc.account_id,
        `"${(acc.account_name || '').replace(/"/g, '""')}"`,
        acc.account_type || '',
        acc.account_attr || '',
        acc.bm_id || '',
        acc.timezone || '',
        acc.total_spend || 0,
        acc.status || '',
        acc.delivery_time || '',
        `"${(acc.rental_notes || '').replace(/"/g, '""')}"`,
        `"${(acc.account_notes || '').replace(/"/g, '""')}"`,
        `"${(acc.account_tags || '').replace(/"/g, '""')}"`,
        acc.created_at || ''
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.csv');
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    console.error('Export accounts error:', err);
    res.status(500).json({ code: 500, data: null, message: '导出账户失败' });
  }
});

module.exports = router;