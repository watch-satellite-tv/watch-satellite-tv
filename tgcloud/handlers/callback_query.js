import { api } from 'sdk';
import { isAdmin, getStats, formatStats, getRecentReports, formatReports, adminPanelMessage, backKeyboard } from '../lib/admin.js';

// Inline-button taps from the admin panel (/admin). Owner only.
export default async function (query) {
  const from = query.from;
  if (!isAdmin(from)) {
    try { await api.answerCallbackQuery({ callback_query_id: query.id }); } catch {}
    return;
  }
  const data = query.data || '';
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (!chatId || !messageId) return;
  try {
    if (data === 'admin:stats') {
      const stats = await getStats();
      await api.editMessageText({
        chat_id: chatId, message_id: messageId,
        text: formatStats(stats), reply_markup: backKeyboard(),
      });
    } else if (data === 'admin:reports') {
      const list = await getRecentReports(10);
      await api.editMessageText({
        chat_id: chatId, message_id: messageId,
        text: formatReports(list), reply_markup: backKeyboard(),
      });
    } else if (data === 'admin:panel') {
      const panel = adminPanelMessage();
      await api.editMessageText({
        chat_id: chatId, message_id: messageId,
        text: panel.text, reply_markup: panel.reply_markup,
      });
    } else if (data === 'admin:exit') {
      await api.deleteMessage({ chat_id: chatId, message_id: messageId });
    }
  } catch (e) {
    // Editing an unchanged message (or a deleted one) throws; not fatal.
    console.error('admin callback failed', data, e);
  }
  try { await api.answerCallbackQuery({ callback_query_id: query.id }); } catch {}
}
