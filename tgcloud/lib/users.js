import { db } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';
import { isLang } from './i18n.js';

// Save the user's chosen UI language. Returns false for an unknown code.
export async function setUserLanguage(tgId, lang) {
  if (!tgId || !isLang(lang)) return false;
  await db
    .update(users)
    .set({ language: lang })
    .where(eq(users.tgId, tgId))
    .run();
  return true;
}

// The user's saved language choice, or null when they haven't picked
// one yet (independent of their Telegram language_code).
export async function getUserLanguage(tgId) {
  if (!tgId) return null;
  const row = await db.select().from(users).where(eq(users.tgId, tgId)).get();
  return row?.language || null;
}

// Upsert a Telegram user on first sight, refreshing last_seen and any
// changed profile fields on every sight. `from` is a Telegram User
// object (message.from or ctx.initData.user): { id, username,
// first_name, language_code }. Returns the row, or null without an id.
export async function ensureUser(from) {
  if (!from?.id) return null;
  const now = Math.floor(Date.now() / 1000);
  const values = {
    tgId: from.id,
    username: from.username || null,
    firstName: from.first_name || null,
    languageCode: from.language_code || null,
    lastSeenAt: now,
  };
  const [row] = await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.tgId,
      set: {
        username: values.username,
        firstName: values.firstName,
        languageCode: values.languageCode,
        lastSeenAt: now,
      },
    })
    .returning()
    .run();
  if (row) return row;
  // Fallback if the platform returns no RETURNING row: re-read it.
  return await db.select().from(users).where(eq(users.tgId, from.id)).get();
}
