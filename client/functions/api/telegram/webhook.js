// Telegram Bot Webhook Handler
// 所有管理操作在 Bot 私聊窗口完成，通过群链接指定目标群组

async function sendTelegramMessage(env, chatId, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return await res.json();
  } catch (err) {
    console.error('Telegram send error:', err);
    return null;
  }
}

async function telegramApi(env, method, params = {}) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err) {
    console.error('Telegram API error:', err);
    return null;
  }
}

function isAdmin(env, fromId) {
  const adminId = env.TELEGRAM_ADMIN_ID;
  return adminId && String(fromId) === String(adminId);
}

// 从文本中提取群链接
function extractGroupLink(text) {
  const match = text.match(/https?:\/\/t\.me\/[^\s]+/);
  return match ? match[0] : null;
}

// 从群链接解析 chat_id（仅对 t.me/c/123456789 格式有效）
function chatIdFromLink(link) {
  const m = link.match(/t\.me\/c\/(\d+)/);
  if (m) return '-' + m[1]; // 普通群
  return null;
}

// 根据群链接/编号/chat_id 查找群组
async function resolveGroup(env, identifier) {
  // 1. 直接是 chat_id（-100 开头）
  if (/^-?\d+$/.test(identifier)) {
    const g = await env.DB.prepare('SELECT * FROM telegram_groups WHERE chat_id = ?').bind(identifier).first();
    if (g) return g;
  }
  // 2. 是群链接
  const link = extractGroupLink(identifier);
  if (link) {
    // 先查存储的 invite_link
    const g = await env.DB.prepare('SELECT * FROM telegram_groups WHERE invite_link = ?').bind(link).first();
    if (g) return g;
    // 尝试从 t.me/c/xxx 解析
    const cid = chatIdFromLink(link);
    if (cid) {
      const g2 = await env.DB.prepare('SELECT * FROM telegram_groups WHERE chat_id = ?').bind(cid).first();
      if (g2) return g2;
    }
  }
  // 3. 是 /groups 列表中的编号
  if (/^\d+$/.test(identifier)) {
    const { results } = await env.DB.prepare('SELECT * FROM telegram_groups ORDER BY chat_id').all();
    const idx = parseInt(identifier) - 1;
    if (idx >= 0 && idx < results.length) return results[idx];
  }
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const update = await request.json().catch(() => null);
  if (!update || !update.message) {
    return new Response('OK', { status: 200 });
  }

  const msg = update.message;
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const chatTitle = msg.chat.title || (msg.chat.first_name || '私聊');
  const fromId = msg.from?.id;
  const text = msg.text || '';
  const token = env.TELEGRAM_BOT_TOKEN;

  // ─── Bot 被加入群组 → 自动记录群组信息 ───
  if (msg.new_chat_members && msg.new_chat_members.length > 0) {
    const botAdded = msg.new_chat_members.some(m => m.is_bot);
    if (botAdded && chatType !== 'private') {
      // 尝试获取群组 invite link
      let inviteLink = null;
      const chatRes = await telegramApi(env, 'getChat', { chat_id: chatId });
      if (chatRes && chatRes.ok && chatRes.result.invite_link) {
        inviteLink = chatRes.result.invite_link;
      } else {
        const expRes = await telegramApi(env, 'exportChatInviteLink', { chat_id: chatId });
        if (expRes && expRes.ok) inviteLink = expRes.result;
      }
      const now = new Date().toISOString();
      await env.DB.prepare(
        'INSERT OR REPLACE INTO telegram_groups (chat_id, chat_title, invite_link, created_at) VALUES (?, ?, ?, ?)'
      ).bind(String(chatId), chatTitle, inviteLink, now).run();

      // 通知 admin
      const adminId = env.TELEGRAM_ADMIN_ID;
      if (adminId) {
        await sendTelegramMessage(env, adminId,
          `🤖 Bot 已加入新群组\n\n` +
          `<b>群名：</b>${chatTitle}\n` +
          `<b>Chat ID：</b><code>${chatId}</code>\n` +
          `<b>群链接：</b>${inviteLink || '（无法获取，请使用 /groups 查看编号）'}\n\n` +
          `如需绑定用户，请在私聊发送：\n` +
          `<code>/bind 平台用户名 群链接 用户Telegram用户名</code>`
        );
      }
    }
    return new Response('OK', { status: 200 });
  }

  // ─── 以下命令仅 admin 在私聊中可用 ───
  if (!isAdmin(env, fromId) || chatType !== 'private') {
    return new Response('OK', { status: 200 });
  }

  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase().replace(/@.+$/, '');
  const args = parts.slice(1);

  try {
    // ─── /groups ─── 列出所有 Bot 所在的群组 ───
    if (cmd === '/groups') {
      const { results } = await env.DB.prepare('SELECT * FROM telegram_groups ORDER BY chat_id').all();
      if (results.length === 0) {
        await sendTelegramMessage(env, chatId, '📋 Bot 当前不在任何群组中。请先把 Bot 加入目标群组。');
      } else {
        const list = results.map((g, i) =>
          `${i + 1}. <b>${g.chat_title || '未命名'}</b>\n   ID: <code>${g.chat_id}</code>\n   链接: ${g.invite_link || '（无）'}`
        ).join('\n\n');
        await sendTelegramMessage(env, chatId,
          `📋 Bot 所在群组列表（可使用编号或群链接指定目标群）：\n\n${list}`
        );
      }
      return new Response('OK', { status: 200 });
    }

    // ─── /bind <平台用户名> <群链接/编号> <用户Telegram用户名> ───
    if (cmd === '/bind') {
      const username = args[0];
      const groupId = args[1];
      const tgUsername = args[2];
      if (!username || !groupId || !tgUsername) {
        await sendTelegramMessage(env, chatId,
          '⚠️ 用法：\n<code>/bind 平台用户名 群链接或编号 用户Telegram用户名</code>\n\n' +
          '示例：\n<code>/bind 测试用户 https://t.me/+abc123 @testuser</code>'
        );
        return new Response('OK', { status: 200 });
      }
      const group = await resolveGroup(env, groupId);
      if (!group) {
        await sendTelegramMessage(env, chatId,
          `❌ 未找到群组：<code>${groupId}</code>\n请先将 Bot 加入该群，或使用 /groups 查看可用群组。`
        );
        return new Response('OK', { status: 200 });
      }
      const now = new Date().toISOString();
      await env.DB.prepare(
        'INSERT INTO telegram_bindings (username, chat_id, telegram_username, group_link, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(username) DO UPDATE SET chat_id = excluded.chat_id, telegram_username = excluded.telegram_username, group_link = excluded.group_link'
      ).bind(username, group.chat_id, tgUsername, group.invite_link || '', now).run();

      // 在群里发送绑定成功 + 欢迎消息
      const groupMsg = `✅ 已将本群绑定到平台用户：<b>${username}</b>\n\n尊敬的 <b>${username}</b> 用户，欢迎注册海豚平台。助力个人与企业海外引流获客，高效一站式营销引流方案，只认准海豚。`;
      await sendTelegramMessage(env, group.chat_id, groupMsg);

      await sendTelegramMessage(env, chatId,
        `✅ 绑定成功！\n\n平台用户：<b>${username}</b>\nTelegram：${tgUsername}\n群组：<b>${group.chat_title}</b>`
      );
      return new Response('OK', { status: 200 });
    }

    // ─── /recharge <群链接/编号> <金额> ───
    if (cmd === '/recharge') {
      const groupId = args[0];
      const amount = args[1];
      if (!groupId || !amount) {
        await sendTelegramMessage(env, chatId,
          '⚠️ 用法：\n<code>/recharge 群链接或编号 金额</code>\n\n示例：\n<code>/recharge https://t.me/+abc123 500</code>'
        );
        return new Response('OK', { status: 200 });
      }
      const group = await resolveGroup(env, groupId);
      if (!group) {
        await sendTelegramMessage(env, chatId, `❌ 未找到群组：<code>${groupId}</code>`);
        return new Response('OK', { status: 200 });
      }
      const binding = await env.DB.prepare('SELECT username FROM telegram_bindings WHERE chat_id = ?').bind(group.chat_id).first();
      if (!binding) {
        await sendTelegramMessage(env, chatId, `❌ 该群组尚未绑定用户，请先使用 /bind 绑定。`);
        return new Response('OK', { status: 200 });
      }
      const msgText = `尊敬的 <b>${binding.username}</b> 用户，您已成功充值 <b>${amount}</b> USDT，正在为您匹配投手，请短暂稍等三分钟。`;
      await sendTelegramMessage(env, group.chat_id, msgText);
      await sendTelegramMessage(env, chatId, `✅ 已在群 <b>${group.chat_title}</b> 发送充值消息（${amount} USDT）`);
      return new Response('OK', { status: 200 });
    }

    // ─── /assign <群链接/编号> <投手Telegram用户名> ───
    if (cmd === '/assign') {
      const groupId = args[0];
      const specialist = args[1];
      if (!groupId || !specialist) {
        await sendTelegramMessage(env, chatId,
          '⚠️ 用法：\n<code>/assign 群链接或编号 投手Telegram用户名</code>\n\n示例：\n<code>/assign https://t.me/+abc123 @toushousama</code>'
        );
        return new Response('OK', { status: 200 });
      }
      const group = await resolveGroup(env, groupId);
      if (!group) {
        await sendTelegramMessage(env, chatId, `❌ 未找到群组：<code>${groupId}</code>`);
        return new Response('OK', { status: 200 });
      }
      const binding = await env.DB.prepare('SELECT username FROM telegram_bindings WHERE chat_id = ?').bind(group.chat_id).first();
      if (!binding) {
        await sendTelegramMessage(env, chatId, `❌ 该群组尚未绑定用户，请先使用 /bind 绑定。`);
        return new Response('OK', { status: 200 });
      }
      const displaySpec = specialist.startsWith('@') ? specialist : '@' + specialist;
      const msgText = `尊敬的 <b>${binding.username}</b> 用户，已为您匹配好一位专业投手，${displaySpec}。`;
      await sendTelegramMessage(env, group.chat_id, msgText);
      await sendTelegramMessage(env, chatId, `✅ 已在群 <b>${group.chat_title}</b> 发配投手消息（${displaySpec}）`);
      return new Response('OK', { status: 200 });
    }

    // ─── /list ─── 列出所有绑定 ───
    if (cmd === '/list') {
      const { results } = await env.DB.prepare(
        'SELECT b.username, b.telegram_username, g.chat_title FROM telegram_bindings b LEFT JOIN telegram_groups g ON b.chat_id = g.chat_id ORDER BY b.id DESC'
      ).all();
      if (results.length === 0) {
        await sendTelegramMessage(env, chatId, '📋 当前没有任何绑定');
      } else {
        const list = results.map(r =>
          `• <b>${r.username}</b>（${r.telegram_username || '无TG'}）→ ${r.chat_title || '未知群'}`
        ).join('\n');
        await sendTelegramMessage(env, chatId, `📋 绑定列表：\n${list}`);
      }
      return new Response('OK', { status: 200 });
    }

    // ─── /unbind <平台用户名> ─── 解绑 ───
    if (cmd === '/unbind') {
      const username = args[0];
      if (!username) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法：<code>/unbind 平台用户名</code>');
        return new Response('OK', { status: 200 });
      }
      await env.DB.prepare('DELETE FROM telegram_bindings WHERE username = ?').bind(username).run();
      await sendTelegramMessage(env, chatId, `✅ 已解绑用户 <b>${username}</b>`);
      return new Response('OK', { status: 200 });
    }

    // ─── /broadcast <消息> ─── 给所有绑定群发消息 ───
    if (cmd === '/broadcast') {
      const message = args.join(' ');
      if (!message) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法：<code>/broadcast 消息内容</code>');
        return new Response('OK', { status: 200 });
      }
      const { results } = await env.DB.prepare('SELECT chat_id FROM telegram_bindings WHERE chat_id IS NOT NULL').all();
      let sent = 0;
      for (const r of results) {
        const r2 = await sendTelegramMessage(env, r.chat_id, message);
        if (r2 && r2.ok) sent++;
      }
      await sendTelegramMessage(env, chatId, `📢 已向 ${sent}/${results.length} 个群组发送广播`);
      return new Response('OK', { status: 200 });
    }

    // ─── /help ─── 帮助 ───
    if (cmd === '/help' || cmd === '/start') {
      const help = `<b>海豚平台 Bot 使用说明</b>

<b>📍 准备工作：</b>
1. 把 Bot 加入目标私人群组，给管理员权限
2. Bot 加入后会自动通知你群组信息

<b>💬 私聊命令（所有操作在此窗口完成）：</b>
<b>/groups</b> — 列出所有群组（含编号和链接）

<b>/bind 平台用户名 群链接或编号 用户Telegram用户名</b>
绑定群组到平台用户，群里自动发欢迎消息
示例：<code>/bind 测试用户 https://t.me/+abc @testuser</code>

<b>/recharge 群链接或编号 金额</b>
往指定群发充值成功消息
示例：<code>/recharge https://t.me/+abc 500</code>

<b>/assign 群链接或编号 投手Telegram用户名</b>
往指定群发投手匹配消息
示例：<code>/assign https://t.me/+abc @toushou</code>

<b>/list</b> — 列出所有用户绑定
<b>/unbind 平台用户名</b> — 解绑用户
<b>/broadcast 消息</b> — 向所有绑定群发消息`;
      await sendTelegramMessage(env, chatId, help);
      return new Response('OK', { status: 200 });
    }

    // 未知命令 → 提示帮助
    await sendTelegramMessage(env, chatId, '❓ 未知命令，发送 <b>/help</b> 查看所有可用命令。');
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }

  return new Response('OK', { status: 200 });
}

export async function onRequestGet() {
  return new Response('Telegram Bot Webhook', { status: 200 });
}
