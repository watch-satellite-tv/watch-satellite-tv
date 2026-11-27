import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { supportPending, supportMap } from '../schema.js';
import { OWNER_ID } from './owner.js';
import { t, LANGS } from './i18n.js';

// Support inbox — same design as FontStory: users message the owner
// (support) through a non-inline reply-keyboard button, and the owner
// answers by replying to the forwarded message in the bot chat.
//
// Flow:
//   1. User taps the support button (persistent reply keyboard, set
//      on /start and after a language is picked, in their language)
//      -> they are marked "awaiting" and get a prompt with a cancel
//      button.
//   2. Their next text message is sent to the owner as one composed
//      message (name, handle, numeric id, text) and the owner's copy
//      is mapped back to them in support_map.
//   3. The owner replies to that message in the bot chat; the reply
//      text is delivered to the user. The numeric id is also in the
//      message text, so the reply still works if the map row is gone.
//
// All button labels depend on the user's language, so matching an
// incoming tap checks every language's variant (a user can tap the
// button in any language's wording only if their keyboard shows it —
// but the lists below make the match robust to a stale keyboard
// after a language change).

export const SUPPORT_BUTTONS = LANGS.map((l) => t('supportButton', l));
export const LANGUAGE_BUTTONS = LANGS.map((l) => t('langButton', l));
export const CANCEL_BUTTONS = LANGS.map((l) => t('cancelButton', l));

export function supportButton(lang) {
  return t('supportButton', lang);
}
export function cancelButton(lang) {
  return t('cancelButton', lang);
}

// Persistent reply keyboard shown to users (not the owner): support
// and language side by side, in the user's language.
export function mainKeyboard(lang = 'fa') {
  return {
    keyboard: [[{ text: supportButton(lang) }, { text: t('langButton', lang) }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function cancelKeyboard(lang = 'fa') {
  return {
    keyboard: [[{ text: cancelButton(lang) }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export async function setAwaiting(tgId) {
  if (await isAwaiting(tgId)) return;
  await db.insert(supportPending).values({ tgId }).run();
}

export async function isAwaiting(tgId) {
  const row = await db.select().from(supportPending).where(eq(supportPending.tgId, tgId)).get();
  return !!row;
}

export async function clearAwaiting(tgId) {
  await db.delete(supportPending).where(eq(supportPending.tgId, tgId)).run();
}

export async function mapOwnerMessage(ownerMsgId, userId) {
  await db.insert(supportMap).values({ ownerMsgId, userId }).run();
}

export async function lookupUser(ownerMsgId) {
  const row = await db.select().from(supportMap).where(eq(supportMap.ownerMsgId, ownerMsgId)).get();
  return row?.userId ?? null;
}

// Fallback when the map row is missing: the owner's copy carries the
// sender's numeric id in its «👤 … — <id>» line.
export function parseUserId(text) {
  const m = /— (\d+)\n/.exec(text || '');
  return m ? Number(m[1]) : null;
}

export function formatSupportMessage(from, text) {
  const name = from.first_name || 'کاربر';
  const handle = from.username ? ` (@${from.username})` : '';
  const body = (text || '').slice(0, 3800);
  return (
    '📩 پیام پشتیبانی\n\n' +
    `👤 ${name}${handle} — ${from.id}\n\n` +
    body +
    '\n\n— برای پاسخ، روی همین پیام Reply بزن.'
  );
}

// Send the user's message to the owner and remember which owner-side
// message belongs to them, so the owner's reply finds its way back.
export async function forwardToOwner(from, text) {
  const sent = await api.sendMessage({
    chat_id: OWNER_ID,
    text: formatSupportMessage(from, text),
  });
  const ownerMsgId = sent?.message_id ?? sent?.result?.message_id;
  if (ownerMsgId) await mapOwnerMessage(ownerMsgId, from.id);
  return sent;
}
