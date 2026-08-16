import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode('dolphin-secret-key-2024');
const ADMIN_EMAIL = 'admin@dolphin.com';

// Helper: JSON response
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper: extract JWT from request
async function getUser(env, request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Helper: require admin
function requireAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

// ─── ROUTE HANDLER ───
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '');
  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? null : await request.json().catch(() => ({}));

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const user = await getUser(env, request);
  const isAdmin = requireAdmin(user);

  try {
    // ─── AUTH ROUTES ───
    if (path === 'auth/register' && method === 'POST') {
      const { email, password, username } = body;
      if (!email || !password) {
        return json({ code: 400, data: null, message: '邮箱和密码不能为空' }, 400);
      }
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) {
        return json({ code: 400, data: null, message: '该邮箱已注册' }, 400);
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const displayName = username || email.split('@')[0];
      const result = await env.DB.prepare(
        'INSERT INTO users (username, email, password, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(displayName, email, hashedPassword, displayName, now, now).run();

      const token = await new SignJWT({ id: result.meta.last_row_id, email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      return json({
        code: 200,
        data: {
          token,
          user: { id: result.meta.last_row_id, email, username: displayName, display_name: displayName },
        },
        message: '注册成功',
      });
    }

    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = body;
      if (!email || !password) {
        return json({ code: 400, data: null, message: '邮箱和密码不能为空' }, 400);
      }
      const userRow = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (!userRow) {
        return json({ code: 400, data: null, message: '用户不存在' }, 400);
      }
      const validPassword = await bcrypt.compare(password, userRow.password);
      if (!validPassword) {
        return json({ code: 400, data: null, message: '密码错误' }, 400);
      }
      const token = await new SignJWT({ id: userRow.id, email: userRow.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      return json({
        code: 200,
        data: {
          token,
          user: {
            id: userRow.id,
            email: userRow.email,
            username: userRow.username,
            display_name: userRow.display_name,
            avatar: userRow.avatar,
          },
        },
        message: '登录成功',
      });
    }

    if (path === 'auth/me' && method === 'GET') {
      if (!user) return json({ code: 401, data: null, message: '未登录' }, 401);
      const userRow = await env.DB.prepare(
        'SELECT id, username, email, display_name, avatar, created_at FROM users WHERE id = ?'
      ).bind(user.id).first();
      if (!userRow) return json({ code: 404, data: null, message: '用户不存在' }, 404);
      return json({ code: 200, data: userRow, message: 'success' });
    }

    // ─── Protected routes: require auth ───
    if (!user) {
      return json({ code: 401, data: null, message: '未登录或token已过期' }, 401);
    }

    // ─── DASHBOARD ROUTES ───
    if (path === 'dashboard/overview' && method === 'GET') {
      if (!isAdmin) {
        return json({ code: 200, data: { balance: 0, spend: 0, impressions: 0, clicks: 0, ctr: 0 }, message: 'success' });
      }
      const totalRecharge = (await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'recharge' AND status = 'completed'").first()).total;
      const totalWithdraw = (await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'withdraw' AND status = 'completed'").first()).total;
      const consumptionData = await env.DB.prepare("SELECT COALESCE(SUM(total_spend), 0) as total, COALESCE(SUM(total_impressions), 0) as impressions, COALESCE(SUM(total_clicks), 0) as clicks FROM consumption_data").first();
      const ctr = consumptionData.impressions > 0 ? ((consumptionData.clicks / consumptionData.impressions) * 100).toFixed(2) : 0;
      return json({
        code: 200,
        data: {
          balance: totalRecharge - totalWithdraw,
          spend: consumptionData.total,
          impressions: consumptionData.impressions,
          clicks: consumptionData.clicks,
          ctr: parseFloat(ctr),
        },
        message: 'success',
      });
    }

    if (path === 'dashboard/consumption' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: [], message: 'success' });
      const { startDate, endDate } = Object.fromEntries(url.searchParams);
      let query = 'SELECT date, total_spend, total_impressions, total_clicks, ctr FROM consumption_data';
      let params = [];
      if (startDate && endDate) {
        query += ' WHERE date >= ? AND date <= ?';
        params = [startDate, endDate];
      }
      query += ' ORDER BY date ASC';
      const { results } = await env.DB.prepare(query).bind(...params).all();
      return json({ code: 200, data: results, message: 'success' });
    }

    if (path === 'dashboard/account-data' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { total: 0, normal: 0, banned: 0, active: 0 }, message: 'success' });
      const total = (await env.DB.prepare('SELECT COUNT(*) as count FROM ad_accounts').first()).count;
      const normal = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE status = 'normal'").first()).count;
      const banned = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE status = 'banned'").first()).count;
      const active = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE status = 'normal' AND total_spend > 0").first()).count;
      return json({ code: 200, data: { total, normal, banned, active }, message: 'success' });
    }

    if (path === 'dashboard/bi-analysis' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { trend: [], pieData: [], accountList: [] }, message: 'success' });
      const { results: trend } = await env.DB.prepare('SELECT date, total_spend FROM consumption_data ORDER BY date ASC LIMIT 7').all();
      const { results: pieRows } = await env.DB.prepare(
        'SELECT a.account_type as name, COALESCE(SUM(c.total_spend), 0) as value FROM ad_accounts a LEFT JOIN consumption_data c ON a.account_id = c.account_id GROUP BY a.account_type'
      ).all();
      const { results: accountList } = await env.DB.prepare(
        'SELECT a.id, a.account_id, a.account_name, a.account_type, a.status, a.total_spend FROM ad_accounts a ORDER BY a.total_spend DESC LIMIT 10'
      ).all();
      return json({ code: 200, data: { trend, pieData: pieRows, accountList }, message: 'success' });
    }

    if (path === 'dashboard/customer-service' && method === 'GET') {
      return json({
        code: 200,
        data: { name: '美啦啦', telegram: '@meilala32' },
        message: 'success',
      });
    }

    // ─── ACCOUNTS ROUTES ───
    if (path === 'accounts' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      let where = [];
      let bindings = [];
      if (params.status) { where.push('status = ?'); bindings.push(params.status); }
      if (params.type) { where.push('account_type = ?'); bindings.push(params.type); }
      if (params.attr) { where.push('account_attr = ?'); bindings.push(params.attr); }
      if (params.search) { where.push('(account_id LIKE ? OR account_name LIKE ?)'); bindings.push(`%${params.search}%`, `%${params.search}%`); }
      const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
      const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM ad_accounts ${whereSQL}`).bind(...bindings).first();
      const { results: accounts } = await env.DB.prepare(`SELECT * FROM ad_accounts ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...bindings, pageSize, offset).all();
      return json({ code: 200, data: { list: accounts, total: countRow.total, page, pageSize }, message: 'success' });
    }

    if (path === 'accounts/stats' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { '0-10': 0, '10-100': 0, '100-500': 0, '500-1000': 0, '1000-2000': 0, '2000+': 0 }, message: 'success' });
      const s1 = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend >= 0 AND total_spend <= 10").first()).count;
      const s2 = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 10 AND total_spend <= 100").first()).count;
      const s3 = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 100 AND total_spend <= 500").first()).count;
      const s4 = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 500 AND total_spend <= 1000").first()).count;
      const s5 = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 1000 AND total_spend <= 2000").first()).count;
      const s6 = (await env.DB.prepare("SELECT COUNT(*) as count FROM ad_accounts WHERE total_spend > 2000").first()).count;
      return json({ code: 200, data: { '0-10': s1, '10-100': s2, '100-500': s3, '500-1000': s4, '1000-2000': s5, '2000+': s6 }, message: 'success' });
    }

    if (path === 'accounts/batch-status' && method === 'PUT') {
      const { ids, status } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) return json({ code: 400, data: null, message: '参数错误' }, 400);
      const validStatuses = ['normal', 'banned', 'cleared', 'recycling'];
      if (!validStatuses.includes(status)) return json({ code: 400, data: null, message: '无效的状态值' }, 400);
      const now = new Date().toISOString();
      for (const id of ids) {
        await env.DB.prepare('UPDATE ad_accounts SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, id).run();
      }
      return json({ code: 200, data: { updated: ids.length }, message: '批量更新状态成功' });
    }

    if (path === 'accounts/batch-recharge' && method === 'POST') {
      const { ids, amount } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !amount) return json({ code: 400, data: null, message: '参数错误' }, 400);
      const now = new Date().toISOString();
      for (const id of ids) {
        await env.DB.prepare('UPDATE ad_accounts SET total_spend = total_spend + ?, updated_at = ? WHERE id = ?').bind(amount, now, id).run();
      }
      return json({ code: 200, data: { updated: ids.length }, message: '批量充值成功' });
    }

    if (path === 'accounts/batch-adjust' && method === 'POST') {
      const { ids, bmId } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !bmId) return json({ code: 400, data: null, message: '参数错误' }, 400);
      const now = new Date().toISOString();
      for (const id of ids) {
        await env.DB.prepare('UPDATE ad_accounts SET bm_id = ?, updated_at = ? WHERE id = ?').bind(bmId, now, id).run();
      }
      return json({ code: 200, data: { updated: ids.length }, message: '批量调整商务号成功' });
    }

    if (path === 'accounts/export' && method === 'GET') {
      const headers = ['ID', '账户ID', '账户名称', '账户类型', '账户属性', '商务号', '时区', '总消耗', '状态', '投放时间', '租赁备注', '账户备注', '账户标签', '创建时间'];
      let csvRows = [headers.join(',')];
      if (isAdmin) {
        const { results: accounts } = await env.DB.prepare('SELECT * FROM ad_accounts ORDER BY id DESC').all();
        for (const acc of accounts) {
          csvRows.push([
            acc.id, acc.account_id, `"${(acc.account_name || '').replace(/"/g, '""')}"`,
            acc.account_type || '', acc.account_attr || '', acc.bm_id || '',
            acc.timezone || '', acc.total_spend || 0, acc.status || '',
            acc.delivery_time || '', `"${(acc.rental_notes || '').replace(/"/g, '""')}"`,
            `"${(acc.account_notes || '').replace(/"/g, '""')}"`,
            `"${(acc.account_tags || '').replace(/"/g, '""')}"`,
            acc.created_at || ''
          ].join(','));
        }
      }
      return new Response('\uFEFF' + csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=accounts.csv',
        },
      });
    }

    // ─── ORDERS ROUTES ───
    if (path === 'orders/rental' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      let where = [];
      let bindings = [];
      if (params.status) { where.push('status = ?'); bindings.push(params.status); }
      if (params.platform) { where.push('platform = ?'); bindings.push(params.platform); }
      if (params.search) { where.push('(order_no LIKE ? OR account_id LIKE ?)'); bindings.push(`%${params.search}%`, `%${params.search}%`); }
      const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
      const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM rental_orders ${whereSQL}`).bind(...bindings).first();
      const { results: orders } = await env.DB.prepare(`SELECT * FROM rental_orders ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...bindings, pageSize, offset).all();
      return json({ code: 200, data: { list: orders, total: countRow.total, page, pageSize }, message: 'success' });
    }

    if (path === 'orders/rental/stats' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { total: 0, delivering: 0, pending: 0, delivered: 0 }, message: 'success' });
      const total = (await env.DB.prepare('SELECT COUNT(*) as count FROM rental_orders').first()).count;
      const delivering = (await env.DB.prepare("SELECT COUNT(*) as count FROM rental_orders WHERE status = 'delivering'").first()).count;
      const pending = (await env.DB.prepare("SELECT COUNT(*) as count FROM rental_orders WHERE status = 'pending'").first()).count;
      const delivered = (await env.DB.prepare("SELECT COUNT(*) as count FROM rental_orders WHERE status = 'delivered'").first()).count;
      return json({ code: 200, data: { total, delivering, pending, delivered }, message: 'success' });
    }

    // POST /api/orders/rental/:id/extract
    const extractMatch = path.match(/^orders\/rental\/(\d+)\/extract$/);
    if (extractMatch && method === 'POST') {
      const id = extractMatch[1];
      const order = await env.DB.prepare('SELECT * FROM rental_orders WHERE id = ?').bind(id).first();
      if (!order) return json({ code: 404, data: null, message: '订单不存在' }, 404);
      if (order.status !== 'delivered') return json({ code: 400, data: null, message: '只有已交付的订单才能提取账户' }, 400);
      if (order.account_id) {
        await env.DB.prepare('UPDATE ad_accounts SET rental_notes = ?, updated_at = ? WHERE account_id = ?').bind('已提取', new Date().toISOString(), order.account_id).run();
      }
      return json({ code: 200, data: order, message: '提取账户成功' });
    }

    if (path === 'orders/recharge' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      let where = [];
      let bindings = [];
      if (params.payment_status) { where.push('payment_status = ?'); bindings.push(params.payment_status); }
      if (params.recharge_status) { where.push('recharge_status = ?'); bindings.push(params.recharge_status); }
      const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
      const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM recharge_orders ${whereSQL}`).bind(...bindings).first();
      const { results: orders } = await env.DB.prepare(`SELECT * FROM recharge_orders ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...bindings, pageSize, offset).all();
      return json({ code: 200, data: { list: orders, total: countRow.total, page, pageSize }, message: 'success' });
    }

    if (path === 'orders/recharge/stats' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { total: 0, pending: 0, completed: 0, failed: 0 }, message: 'success' });
      const total = (await env.DB.prepare('SELECT COUNT(*) as count FROM recharge_orders').first()).count;
      const pending = (await env.DB.prepare("SELECT COUNT(*) as count FROM recharge_orders WHERE recharge_status = 'pending'").first()).count;
      const completed = (await env.DB.prepare("SELECT COUNT(*) as count FROM recharge_orders WHERE recharge_status = 'completed'").first()).count;
      const failed = (await env.DB.prepare("SELECT COUNT(*) as count FROM recharge_orders WHERE recharge_status = 'failed'").first()).count;
      return json({ code: 200, data: { total, pending, completed, failed }, message: 'success' });
    }

    // ─── FINANCES ROUTES ───
    if (path === 'finances/balance' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { balance: 0, frozen: 0, totalRecharge: 0, totalWithdraw: 0 }, message: 'success' });
      const totalRecharge = (await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'recharge' AND status = 'completed'").first()).total;
      const totalWithdraw = (await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'withdraw' AND status = 'completed'").first()).total;
      const frozenFunds = (await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fund_flows WHERE type = 'frozen' AND status = 'frozen'").first()).total;
      return json({ code: 200, data: { balance: totalRecharge - totalWithdraw, frozen: frozenFunds, totalRecharge, totalWithdraw }, message: 'success' });
    }

    if (path === 'finances/flows' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      let where = [];
      let bindings = [];
      if (params.type && params.type !== 'all') { where.push('type = ?'); bindings.push(params.type); }
      if (params.status) { where.push('status = ?'); bindings.push(params.status); }
      if (params.startDate) { where.push('created_at >= ?'); bindings.push(params.startDate); }
      if (params.endDate) { where.push('created_at <= ?'); bindings.push(params.endDate + 'T23:59:59.999Z'); }
      const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
      const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM fund_flows ${whereSQL}`).bind(...bindings).first();
      const { results: flows } = await env.DB.prepare(`SELECT * FROM fund_flows ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...bindings, pageSize, offset).all();
      return json({ code: 200, data: { list: flows, total: countRow.total, page, pageSize }, message: 'success' });
    }

    if (path === 'finances/recharge-records' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      const countRow = await env.DB.prepare("SELECT COUNT(*) as total FROM fund_flows WHERE type = 'recharge'").first();
      const { results: records } = await env.DB.prepare("SELECT * FROM fund_flows WHERE type = 'recharge' ORDER BY id DESC LIMIT ? OFFSET ?").bind(pageSize, offset).all();
      return json({ code: 200, data: { list: records, total: countRow.total, page, pageSize }, message: 'success' });
    }

    if (path === 'finances/withdraw-records' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      const countRow = await env.DB.prepare("SELECT COUNT(*) as total FROM fund_flows WHERE type = 'withdraw'").first();
      const { results: records } = await env.DB.prepare("SELECT * FROM fund_flows WHERE type = 'withdraw' ORDER BY id DESC LIMIT ? OFFSET ?").bind(pageSize, offset).all();
      return json({ code: 200, data: { list: records, total: countRow.total, page, pageSize }, message: 'success' });
    }

    if (path === 'finances/frozen-records' && method === 'GET') {
      if (!isAdmin) return json({ code: 200, data: { list: [], total: 0, page: 1, pageSize: 20 }, message: 'success' });
      const params = Object.fromEntries(url.searchParams);
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      const countRow = await env.DB.prepare("SELECT COUNT(*) as total FROM fund_flows WHERE type = 'frozen'").first();
      const { results: records } = await env.DB.prepare("SELECT * FROM fund_flows WHERE type = 'frozen' ORDER BY id DESC LIMIT ? OFFSET ?").bind(pageSize, offset).all();
      return json({ code: 200, data: { list: records, total: countRow.total, page, pageSize }, message: 'success' });
    }

    // 404
    return json({ code: 404, data: null, message: '接口不存在' }, 404);
  } catch (err) {
    console.error('API Error:', err);
    return json({ code: 500, data: null, message: '服务器内部错误' }, 500);
  }
}