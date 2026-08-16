const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('开始填充种子数据...');

// Clear all tables
db.exec('DELETE FROM consumption_data');
db.exec('DELETE FROM fund_flows');
db.exec('DELETE FROM recharge_orders');
db.exec('DELETE FROM rental_orders');
db.exec('DELETE FROM ad_accounts');
db.exec('DELETE FROM users');

console.log('已清空所有表');

// Insert test user
const now = new Date().toISOString();
const hashedPassword = bcrypt.hashSync('admin123', 10);

db.prepare(
  'INSERT INTO users (username, email, password, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
).run('admin', 'admin@dolphin.com', hashedPassword, 'BatraShashi', now, now);

console.log('已创建测试用户: admin@dolphin.com / admin123');

// Insert mock ad accounts
const accountTypes = ['电商', '游戏', '金融', '教育', '工具', '社交', '娱乐', '医疗', '旅游', '房产'];
const accountAttrs = ['企业', '个人', '代理'];
const statuses = ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'banned', 'cleared', 'recycling'];
const timezones = ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

const insertAccount = db.prepare(`
  INSERT INTO ad_accounts (account_id, account_name, account_type, account_attr, bm_id, timezone, total_spend, status, delivery_time, rental_notes, account_notes, account_tags, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAccounts = db.transaction(() => {
  for (let i = 1; i <= 20; i++) {
    const accountId = `act_${String(i).padStart(8, '0')}`;
    const accountName = `广告账户${i}`;
    const accountType = accountTypes[i % accountTypes.length];
    const accountAttr = accountAttrs[i % accountAttrs.length];
    const bmId = i % 3 === 0 ? `bm_${String(Math.floor(i / 3)).padStart(6, '0')}` : null;
    const timezone = timezones[i % timezones.length];
    const totalSpend = parseFloat((Math.random() * 5000).toFixed(2));
    const status = statuses[i % statuses.length];
    const deliveryTime = i % 2 === 0 ? `${30 + i}天` : null;
    const rentalNotes = i % 4 === 0 ? '已出租' : null;
    const accountNotes = i % 5 === 0 ? '优质账户' : null;
    const accountTags = i % 3 === 0 ? '高消费,稳定' : (i % 3 === 1 ? '新账户' : null);
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();
    const updatedAt = createdAt;

    insertAccount.run(accountId, accountName, accountType, accountAttr, bmId, timezone, totalSpend, status, deliveryTime, rentalNotes, accountNotes, accountTags, createdAt, updatedAt);
  }
});

insertAccounts();
console.log('已创建20个模拟广告账户');

// Insert mock rental orders
const platforms = ['Facebook', 'Google', 'TikTok'];
const orderStatuses = ['delivering', 'pending', 'delivered', 'delivering', 'delivered', 'pending', 'delivered', 'delivering', 'delivered', 'pending'];

const insertRentalOrder = db.prepare(`
  INSERT INTO rental_orders (order_no, platform, account_type, account_attr, timezone, bm_id, status, created_at, completed_at, account_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRentalOrders = db.transaction(() => {
  for (let i = 1; i <= 10; i++) {
    const orderNo = `RO${now.substring(0, 10).replace(/-/g, '')}${String(i).padStart(4, '0')}`;
    const platform = platforms[i % platforms.length];
    const accountType = accountTypes[i % accountTypes.length];
    const accountAttr = accountAttrs[i % accountAttrs.length];
    const timezone = timezones[i % timezones.length];
    const bmId = `bm_${String(i).padStart(6, '0')}`;
    const status = orderStatuses[i % orderStatuses.length];
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();
    const completedAt = status === 'delivered' ? new Date(Date.now() - (i - 1) * 86400000).toISOString() : null;
    const accountId = `act_${String(i).padStart(8, '0')}`;

    insertRentalOrder.run(orderNo, platform, accountType, accountAttr, timezone, bmId, status, createdAt, completedAt, accountId);
  }
});

insertRentalOrders();
console.log('已创建10个模拟租赁订单');

// Insert mock recharge orders
const paymentStatuses = ['paid', 'unpaid', 'paid', 'paid', 'unpaid', 'paid', 'paid', 'paid', 'unpaid', 'paid'];
const rechargeStatuses = ['completed', 'pending', 'completed', 'completed', 'pending', 'completed', 'completed', 'failed', 'pending', 'completed'];

const insertRechargeOrder = db.prepare(`
  INSERT INTO recharge_orders (order_no, platform, payment_status, recharge_status, order_amount, service_fee, recharge_amount, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRechargeOrders = db.transaction(() => {
  for (let i = 1; i <= 10; i++) {
    const orderNo = `RE${now.substring(0, 10).replace(/-/g, '')}${String(i).padStart(4, '0')}`;
    const platform = platforms[i % platforms.length];
    const paymentStatus = paymentStatuses[i % paymentStatuses.length];
    const rechargeStatus = rechargeStatuses[i % rechargeStatuses.length];
    const orderAmount = parseFloat((Math.random() * 10000 + 100).toFixed(2));
    const serviceFee = parseFloat((orderAmount * 0.05).toFixed(2));
    const rechargeAmount = parseFloat((orderAmount - serviceFee).toFixed(2));
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();
    const completedAt = rechargeStatus === 'completed' ? new Date(Date.now() - (i - 1) * 86400000).toISOString() : null;

    insertRechargeOrder.run(orderNo, platform, paymentStatus, rechargeStatus, orderAmount, serviceFee, rechargeAmount, createdAt, completedAt);
  }
});

insertRechargeOrders();
console.log('已创建10个模拟充值订单');

// Insert mock consumption data for last 7 days
const insertConsumption = db.prepare(`
  INSERT INTO consumption_data (date, total_impressions, total_clicks, total_spend, ctr, account_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertConsumptionData = db.transaction(() => {
  for (let d = 6; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000).toISOString().substring(0, 10);
    for (let i = 1; i <= 5; i++) {
      const impressions = Math.floor(Math.random() * 50000 + 10000);
      const clicks = Math.floor(Math.random() * impressions * 0.1);
      const spend = parseFloat((Math.random() * 1000 + 50).toFixed(2));
      const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
      const accountId = `act_${String(i).padStart(8, '0')}`;

      insertConsumption.run(date, impressions, clicks, spend, ctr, accountId);
    }
  }
});

insertConsumptionData();
console.log('已创建最近7天的消费数据');

// Insert mock fund flows
const flowTypes = ['recharge', 'withdraw', 'frozen', 'recharge', 'recharge', 'withdraw', 'frozen', 'recharge', 'withdraw', 'frozen'];
const flowStatuses = ['completed', 'completed', 'frozen', 'completed', 'completed', 'completed', 'frozen', 'completed', 'completed', 'frozen'];
const flowDescriptions = [
  '平台充值',
  '账户提现',
  '保证金冻结',
  '广告费充值',
  '账户充值',
  '余额提现',
  '风险冻结',
  '批量充值',
  '服务费提现',
  '活动冻结'
];

const insertFundFlow = db.prepare(`
  INSERT INTO fund_flows (type, amount, status, description, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertFundFlows = db.transaction(() => {
  for (let i = 1; i <= 10; i++) {
    const type = flowTypes[i % flowTypes.length];
    const amount = parseFloat((Math.random() * 50000 + 1000).toFixed(2));
    const status = flowStatuses[i % flowStatuses.length];
    const description = flowDescriptions[i % flowDescriptions.length];
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();

    insertFundFlow.run(type, amount, status, description, createdAt);
  }
});

insertFundFlows();
console.log('已创建10个模拟资金流水');

console.log('\n种子数据填充完成！');
console.log('测试账号: admin@dolphin.com / admin123');