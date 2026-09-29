// Telegram Bot Webhook Handler
// 处理来自 Telegram 的更新（管理员命令）

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

function isAdmin(env, fromId) {
  const adminId = env.TELEGRAM_ADMIN_ID;
  return adminId && String(fromId) === String(adminId);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const update = await request.json().catch(() => null);
  if (!update || !update.message) {
    return new Response('OK', { status: 200 });
  }

  const msg = update.message;
  const chatId = msg.chat.id;
  const chatType = msg.chat.type; // 'private', 'group', 'supergroup'
  const chatTitle = msg.chat.title || (msg.chat.first_name || '私聊');
  const fromId = msg.from?.id;
  const text = msg.text || '';

  // Security: only admin can use commands
  if (!isAdmin(env, fromId)) {
    return new Response('OK', { status: 200 });
  }

  // Parse command
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  try {
    // ─── /bind <username> ─── 在群组里绑定用户名
    if (cmd === '/bind' || cmd === '/bind@dolphin_notify_bot') {
      if (chatType === 'private') {
        await sendTelegramMessage(env, chatId, '❌ 请在群组中使用此命令');
        return new Response('OK', { status: 200 });
      }
      const username = args[0];
      if (!username) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法: /bind <平台用户名>');
        return new Response('OK', { status: 200 });
      }
      const now = new Date().toISOString();
      await env.DB.prepare(
        'INSERT INTO telegram_bindings (username, chat_id, chat_title, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(username) DO UPDATE SET chat_id = excluded.chat_id, chat_title = excluded.chat_title'
      ).bind(username, String(chatId), chatTitle, now).run();
      await sendTelegramMessage(env, chatId, `✅ 已将本群绑定到平台用户 <b>${username}</b>`);
      return new Response('OK', { status: 200 });
    }

    // ─── /unbind ─── 解绑当前群组
    if (cmd === '/unbind' || cmd === '/unbind@dolphin_notify_bot') {
      if (chatType === 'private') {
        await sendTelegramMessage(env, chatId, '❌ 请在群组中使用此命令');
        return new Response('OK', { status: 200 });
      }
      await env.DB.prepare('DELETE FROM telegram_bindings WHERE chat_id = ?').bind(String(chatId)).run();
      await sendTelegramMessage(env, chatId, '✅ 已解绑本群');
      return new Response('OK', { status: 200 });
    }

    // ─── /list ─── 列出所有绑定
    if (cmd === '/list' || cmd === '/list@dolphin_notify_bot') {
      const { results } = await env.DB.prepare('SELECT username, chat_title FROM telegram_bindings ORDER BY id DESC').all();
      if (results.length === 0) {
        await sendTelegramMessage(env, chatId, '📋 当前没有任何绑定');
      } else {
        const list = results.map(r => `• <b>${r.username}</b> → ${r.chat_title}`).join('\n');
        await sendTelegramMessage(env, chatId, `📋 绑定列表:\n${list}`);
      }
      return new Response('OK', { status: 200 });
    }

    // ─── /recharge <金额> ─── 在已绑定群组里发充值成功消息
    if (cmd === '/recharge' || cmd === '/recharge@dolphin_notify_bot') {
      const amount = args[0];
      if (!amount) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法: /recharge <金额>');
        return new Response('OK', { status: 200 });
      }
      // 查找当前群绑定的用户名
      const binding = await env.DB.prepare('SELECT username FROM telegram_bindings WHERE chat_id = ?').bind(String(chatId)).first();
      if (!binding) {
        await sendTelegramMessage(env, chatId, '❌ 本群尚未绑定，请先使用 /bind <用户名>');
        return new Response('OK', { status: 200 });
      }
      const msgText = `尊敬的 <b>${binding.username}</b> 用户，您已成功充值 <b>${amount}</b> USDT，正在为您匹配投手，请短暂稍等三分钟。`;
      await sendTelegramMessage(env, chatId, msgText);
      return new Response('OK', { status: 200 });
    }

    // ─── /assign <@投手用户名> ─── 在已绑定群组里发配投手消息
    if (cmd === '/assign' || cmd === '/assign@dolphin_notify_bot') {
      const specialist = args[0];
      if (!specialist) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法: /assign <@投手用户名>');
        return new Response('OK', { status: 200 });
      }
      const binding = await env.DB.prepare('SELECT username FROM telegram_bindings WHERE chat_id = ?').bind(String(chatId)).first();
      if (!binding) {
        await sendTelegramMessage(env, chatId, '❌ 本群尚未绑定，请先使用 /bind <用户名>');
        return new Response('OK', { status: 200 });
      }
      const msgText = `尊敬的 <b>${binding.username}</b> 用户，已为您匹配好一位专业投手，${specialist}。`;
      await sendTelegramMessage(env, chatId, msgText);
      return new Response('OK', { status: 200 });
    }

    // ─── /recharge_user <用户名> <金额> ─── 私聊里给指定用户发充值消息
    if (cmd === '/recharge_user' || cmd === '/recharge_user@dolphin_notify_bot') {
      const username = args[0];
      const amount = args[1];
      if (!username || !amount) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法: /recharge_user <用户名> <金额>');
        return new Response('OK', { status: 200 });
      }
      const binding = await env.DB.prepare('SELECT chat_id FROM telegram_bindings WHERE username = ?').bind(username).first();
      if (!binding) {
        await sendTelegramMessage(env, chatId, `❌ 用户 <b>${username}</b> 尚未绑定群组`);
        return new Response('OK', { status: 200 });
      }
      const msgText = `尊敬的 <b>${username}</b> 用户，您已成功充值 <b>${amount}</b> USDT，正在为您匹配投手，请短暂稍等三分钟。`;
      await sendTelegramMessage(env, binding.chat_id, msgText);
      await sendTelegramMessage(env, chatId, `✅ 已向用户 <b>${username}</b> 发送充值消息`);
      return new Response('OK', { status: 200 });
    }

    // ─── /assign_user <用户名> <@投手> ─── 私聊里给指定用户发配投手消息
    if (cmd === '/assign_user' || cmd === '/assign_user@dolphin_notify_bot') {
      const username = args[0];
      const specialist = args[1];
      if (!username || !specialist) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法: /assign_user <用户名> <@投手用户名>');
        return new Response('OK', { status: 200 });
      }
      const binding = await env.DB.prepare('SELECT chat_id FROM telegram_bindings WHERE username = ?').bind(username).first();
      if (!binding) {
        await sendTelegramMessage(env, chatId, `❌ 用户 <b>${username}</b> 尚未绑定群组`);
        return new Response('OK', { status: 200 });
      }
      const msgText = `尊敬的 <b>${username}</b> 用户，已为您匹配好一位专业投手，${specialist}。`;
      await sendTelegramMessage(env, binding.chat_id, msgText);
      await sendTelegramMessage(env, chatId, `✅ 已向用户 <b>${username}</b> 发送投手匹配消息`);
      return new Response('OK', { status: 200 });
    }

    // ─── /broadcast <消息> ─── 给所有绑定群组群发消息
    if (cmd === '/broadcast' || cmd === '/broadcast@dolphin_notify_bot') {
      const message = args.join(' ');
      if (!message) {
        await sendTelegramMessage(env, chatId, '⚠️ 用法: /broadcast <消息内容>');
        return new Response('OK', { status: 200 });
      }
      const { results } = await env.DB.prepare('SELECT chat_id, chat_title FROM telegram_bindings').all();
      let sent = 0;
      for (const r of results) {
        const r2 = await sendTelegramMessage(env, r.chat_id, message);
        if (r2 && r2.ok) sent++;
      }
      await sendTelegramMessage(env, chatId, `📢 已向 ${sent}/${results.length} 个群组发送广播`);
      return new Response('OK', { status: 200 });
    }

    // ─── /help ─── 帮助
    if (cmd === '/help' || cmd === '/help@dolphin_notify_bot') {
      const help = `
<b>海豚平台 Bot 命令帮助</b>

<b>📍 群组内命令（先把 Bot 加入群）：</b>
/bind <用户名>  — 绑定当前群到平台用户
/unbind         — 解绑当前群
/recharge <金额> — 发充值成功通知
/assign <@投手>  — 发配投手通知

<b>💬 私聊命令（跟 Bot 私聊）：</b>
/recharge_user <用户名> <金额>  — 给指定用户发充值消息
/assign_user <用户名> <@投手>   — 给指定用户发配投手消息
/broadcast <消息>               — 向所有群广播
/list                           — 列出所有绑定
`;
      await sendTelegramMessage(env, chatId, help);
      return new Response('OK', { status: 200 });
    }
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }

  return new Response('OK', { status: 200 });
}

export async function onRequestGet() {
  return new Response('Telegram Bot Webhook', { status: 200 });
}