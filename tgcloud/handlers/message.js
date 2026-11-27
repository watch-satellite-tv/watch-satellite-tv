import { api } from 'sdk';
import { ensureUser, getUserLanguage } from '../lib/users.js';
import { t, languagePickerKeyboard, welcomeKeyboard, MINI_APP_URL } from '../lib/i18n.js';
import {
  SUPPORT_BUTTONS,
  LANGUAGE_BUTTONS,
  CANCEL_BUTTONS,
  mainKeyboard,
  cancelKeyboard,
  setAwaiting,
  isAwaiting,
  clearAwaiting,
  lookupUser,
  parseUserId,
  forwardToOwner,
} from '../lib/support.js';
import {
  isAdmin, fa, adminPanelMessage, getStats, formatStats,
  getRecentReports, formatReports, broadcast,
  getAdminState, setAdminState, clearAdminState, clearBroadcastFlow,
  broadcastConfirmKeyboard,
} from '../lib/admin.js';

export default async function (message) {
  if (message.chat?.type && message.chat.type !== 'private') return;
  const chatId = message.chat.id;
  const from = message.from;
  if (!from?.id) return;

  const row = await ensureUser(from);
  const lang = row?.language || 'fa';

  const text = message.text || '';

  // /start — new users (no saved language) pick a language first;
  // returning users get the welcome in their language, with a button
  // to change it.
  if (text.startsWith('/start')) {
    if (!row?.language) {
      await api.sendMessage({
        chat_id: chatId,
        text: t('pickPrompt', 'fa'),
        reply_markup: languagePickerKeyboard(),
      });
      return;
    }
    await api.sendMessage({
      chat_id: chatId,
      text: t('welcome', lang),
      reply_markup: welcomeKeyboard(lang),
    });
    // Users (not the owner) also get the persistent support + language
    // buttons — a reply keyboard, so they stay under the chat input.
    if (!isAdmin(from)) {
      await api.sendMessage({
        chat_id: chatId,
        text: t('supportHint', lang),
        reply_markup: mainKeyboard(lang),
      });
    }
    return;
  }

  // /language — show the picker again, anytime.
  if (text === '/language') {
    await api.sendMessage({
      chat_id: chatId,
      text: t('pickPrompt', lang),
      reply_markup: languagePickerKeyboard(),
    });
    return;
  }

  // --- Admin commands (owner only) ---
  if (isAdmin(from)) {
    // Owner answering a support message: reply to the owner's copy of
    // it in this chat and the text goes back to that user, with the
    // prefix in the USER's language. Checked before the broadcast
    // draft capture, so the reply is never swallowed as a draft.
    const replied = message.reply_to_message;
    if (replied) {
      const targetId = (await lookupUser(replied.message_id)) || parseUserId(replied.text);
      if (targetId) {
        if (!text) {
          await api.sendMessage({ chat_id: chatId, text: 'پاسخ به کاربر باید متن باشه.' });
          return;
        }
        const targetLang = (await getUserLanguage(targetId)) || 'fa';
        await api.sendMessage({ chat_id: targetId, text: t('supportReplyPrefix', targetLang) + text });
        await api.sendMessage({ chat_id: chatId, text: '✅ پاسخ به کاربر ارسال شد.' });
        return;
      }
    }
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

  // --- Support inbox + language button (users only) ---
  if (!isAdmin(from)) {
    // The language button re-opens the picker. Any half-written
    // support message is dropped.
    if (LANGUAGE_BUTTONS.includes(text)) {
      await clearAwaiting(from.id);
      await api.sendMessage({
        chat_id: chatId,
        text: t('pickPrompt', lang),
        reply_markup: languagePickerKeyboard(),
      });
      return;
    }
    if (SUPPORT_BUTTONS.includes(text)) {
      await setAwaiting(from.id);
      await api.sendMessage({
        chat_id: chatId,
        text: t('supportPrompt', lang),
        reply_markup: cancelKeyboard(lang),
      });
      return;
    }
    if (CANCEL_BUTTONS.includes(text)) {
      await clearAwaiting(from.id);
      await api.sendMessage({
        chat_id: chatId,
        text: t('supportCancelled', lang),
        reply_markup: mainKeyboard(lang),
      });
      return;
    }
    if (await isAwaiting(from.id)) {
      if (!text) {
        await api.sendMessage({ chat_id: chatId, text: t('supportTextOnly', lang) });
        return;
      }
      await forwardToOwner(from, text);
      await clearAwaiting(from.id);
      await api.sendMessage({
        chat_id: chatId,
        text: t('supportSent', lang),
        reply_markup: mainKeyboard(lang),
      });
      return;
    }
  }

  // Any other text: point back to the Mini App, in the user's language.
  await api.sendMessage({
    chat_id: chatId,
    text: t('pointer', lang),
    reply_markup: welcomeKeyboard(lang),
  });
}
