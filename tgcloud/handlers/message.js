import { api } from 'sdk';
import { ensureUser } from '../lib/users.js';
import {
  isAdmin, fa, adminPanelMessage, getStats, formatStats,
  getRecentReports, formatReports, broadcast,
  getAdminState, setAdminState, clearAdminState, clearBroadcastFlow,
  broadcastConfirmKeyboard,
} from '../lib/admin.js';

// Mini App URL — live since the first deploy (2026-11-25).
const MINI_APP_URL = 'https://app9110256990.tgcloud.ai/';

export default async function (message) {
  if (message.chat?.type && message.chat.type !== 'private') return;
  const chatId = message.chat.id;
  const from = message.from;
  if (!from?.id) return;

  await ensureUser(from);

  const text = message.text || '';

  // /start (with or without args) — the only command regular users need.
  if (text.startsWith('/start')) {
    await api.sendMessage({
      chat_id: chatId,
      text:
        '📡 به «ماهواره زنده» خوش اومدی!\n\n' +
        'پخش زنده‌ی شبکه‌های ماهواره‌ای، بدون دیش، با اینترنت — شبکه‌های فارسی و جهانی رو انتخاب کن و تماشا کن.',
      reply_markup: {
        inline_keyboard: [[{ text: '📺 باز کردن ماهواره زنده', web_app: { url: MINI_APP_URL } }]],
      },
    });
    return;
  }

  // --- Admin commands (owner only) ---
  if (isAdmin(from)) {
    // Broadcast draft capture: while the panel waits for the text, any
    // non-command message from the admin is the draft. It is only shown
    // as a preview — nothing is sent until he taps confirm.
    if (!text.startsWith('/')) {
      const awaiting = await getAdminState('broadcast_awaiting');
      if (awaiting === '1') {
        if (!text.trim()) {
          await api.sendMessage({ chat_id: chatId, text: 'متن پیام همگانی رو بفرست 🙂' });
          return;
        }
        if (text.trim().length > 4096) {
          await api.sendMessage({
            chat_id: chatId,
            text: 'پیام همگانی نمی‌تونه بیشتر از ۴۰۹۶ کاراکتر باشه. یه متن کوتاه‌تر بفرست.',
          });
          return;
        }
        await setAdminState('broadcast_pending', text);
        await clearAdminState('broadcast_awaiting');
        // Restore the prompt message back to the panel.
        const promptId = await getAdminState('broadcast_prompt_msg');
        if (promptId) {
          try {
            const panel = adminPanelMessage();
            await api.editMessageText({
              chat_id: chatId, message_id: Number(promptId),
              text: panel.text, reply_markup: panel.reply_markup,
            });
          } catch {}
          await clearAdminState('broadcast_prompt_msg');
        }
        await api.sendMessage({
          chat_id: chatId,
          text: '📣 پیش‌نمایش پیام همگانی:\n\n' + text,
          reply_markup: broadcastConfirmKeyboard(),
        });
        return;
      }
    }
    // Any admin command cancels an in-progress broadcast flow.
    if (text.startsWith('/')) await clearBroadcastFlow();

    if (text === '/admin') {
      const panel = adminPanelMessage();
      await api.sendMessage({ chat_id: chatId, text: panel.text, reply_markup: panel.reply_markup });
      return;
    }
    if (text === '/stats') {
      const stats = await getStats();
      await api.sendMessage({ chat_id: chatId, text: formatStats(stats) });
      return;
    }
    if (text === '/reports') {
      const list = await getRecentReports(10);
      await api.sendMessage({ chat_id: chatId, text: formatReports(list) });
      return;
    }
    if (text.startsWith('/broadcast')) {
      const body = text.slice('/broadcast'.length).trim();
      if (!body) {
        await api.sendMessage({
          chat_id: chatId,
          text: 'برای پیام همگانی، متن رو بعد از دستور بنویس:\n/broadcast سلام به همه 👋',
        });
        return;
      }
      if (body.length > 4096) {
        await api.sendMessage({
          chat_id: chatId,
          text: 'پیام همگانی نمی‌تونه بیشتر از ۴۰۹۶ کاراکتر باشه.',
        });
        return;
      }
      await api.sendMessage({ chat_id: chatId, text: '📣 دارم پیام رو می‌فرستم…' });
      const result = await broadcast(body);
      await api.sendMessage({
        chat_id: chatId,
        text:
          '📣 پیام همگانی تموم شد.\n\n' +
          `کل کاربرا: ${fa(result.total)}\n` +
          `رسید: ${fa(result.sent)}\n` +
          `نرسید (بلاک/حذف): ${fa(result.failed)}`,
      });
      return;
    }
  }

  // Any other text: point back to the Mini App.
  await api.sendMessage({
    chat_id: chatId,
    text: 'برای تماشای شبکه‌ها، مینی‌اپ رو باز کن 👇',
    reply_markup: {
      inline_keyboard: [[{ text: '📺 باز کردن ماهواره زنده', web_app: { url: MINI_APP_URL } }]],
    },
  });
}
