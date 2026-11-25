import { api } from 'sdk';
import { ensureUser } from '../lib/users.js';
import {
  isAdmin, fa, adminPanelMessage, getStats, formatStats,
  getRecentReports, formatReports, broadcast,
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
