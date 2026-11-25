import { api } from 'sdk';
import {
  isAdmin, fa, adminPanelMessage, getStats, formatStats,
  getRecentReports, formatReports, backKeyboard, broadcast,
  getAdminState, setAdminState, clearAdminState, clearBroadcastFlow,
  BROADCAST_PROMPT_TEXT, broadcastConfirmKeyboard,
} from '../lib/admin.js';

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
  const edit = async (text, replyMarkup) => {
    await api.editMessageText({
      chat_id: chatId, message_id: messageId,
      text, reply_markup: replyMarkup,
    });
  };
  try {
    if (data === 'admin:stats') {
      const stats = await getStats();
      await edit(formatStats(stats), backKeyboard());
    } else if (data === 'admin:reports') {
      const list = await getRecentReports(10);
      await edit(formatReports(list), backKeyboard());
    } else if (data === 'admin:broadcast') {
      // Start the broadcast flow: wait for the admin's text. The
      // prompt message id is kept so the draft step can restore it
      // to the panel once the text arrives.
      await setAdminState('broadcast_awaiting', '1');
      await setAdminState('broadcast_prompt_msg', String(messageId));
      await edit(BROADCAST_PROMPT_TEXT, backKeyboard());
    } else if (data === 'admin:broadcast_confirm') {
      const pending = await getAdminState('broadcast_pending');
      if (!pending) {
        // Stale tap (flow already finished) — just show the panel.
        await clearBroadcastFlow();
        const panel = adminPanelMessage();
        await edit(panel.text, panel.reply_markup);
      } else {
        await edit('📣 دارم پیام رو می‌فرستم…', backKeyboard());
        const result = await broadcast(pending);
        await clearBroadcastFlow();
        await edit(
          '📣 پیام همگانی تموم شد.\n\n' +
            `کل کاربرا: ${fa(result.total)}\n` +
            `رسید: ${fa(result.sent)}\n` +
            `نرسید (بلاک/حذف): ${fa(result.failed)}`,
          backKeyboard(),
        );
      }
    } else if (data === 'admin:broadcast_cancel') {
      // Changed his mind — nothing is sent, back to the panel.
      await clearBroadcastFlow();
      const panel = adminPanelMessage();
      await edit(panel.text, panel.reply_markup);
    } else if (data === 'admin:panel') {
      await clearBroadcastFlow();
      const panel = adminPanelMessage();
      await edit(panel.text, panel.reply_markup);
    } else if (data === 'admin:exit') {
      await clearBroadcastFlow();
      await api.deleteMessage({ chat_id: chatId, message_id: messageId });
    }
  } catch (e) {
    // Editing an unchanged message (or a deleted one) throws; not fatal.
    console.error('admin callback failed', data, e);
  }
  try { await api.answerCallbackQuery({ callback_query_id: query.id }); } catch {}
}
