import { api, db } from 'sdk';
import { sql, eq, inArray, desc } from 'sdk/db';
import { OWNER_ID } from './owner.js';
import { users, favorites, reports, channels, adminState, playbackFeedback } from '../schema.js';

// Admin panel — owner-only. OWNER_ID lives in tgcloud/lib/owner.js
// (get it from @userinfobot).

export function isAdmin(from) {
  return from?.id === OWNER_ID;
}

export const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

const ADMIN_KEYBOARD = {
  inline_keyboard: [
    [{ text: '📊 آمار', callback_data: 'admin:stats' }],
    [{ text: '🚩 گزارش‌های خرابی', callback_data: 'admin:reports' }],
    [{ text: '📣 پیام همگانی', callback_data: 'admin:broadcast' }],
    [{ text: '🚪 خروج از پنل', callback_data: 'admin:exit' }],
  ],
};

const BACK_KEYBOARD = {
  inline_keyboard: [
    [{ text: '↩ بازگشت به پنل', callback_data: 'admin:panel' }],
    [{ text: '🚪 خروج از پنل', callback_data: 'admin:exit' }],
  ],
};

export const PANEL_TEXT =
  '🛠 پنل مدیریت ماهواره زنده\n\n' +
  'از اینجا آمار کاربرا و گزارش‌های خرابی رو ببین و به همه‌ی کاربرا پیام بده.\n\n' +
  'پیام همگانی با دکمه‌ی «📣 پیام همگانی» هم فرستاده می‌شه، یا مستقیم با دستور:\n' +
  '/broadcast متن پیام';

export function adminPanelMessage() {
  return { text: PANEL_TEXT, reply_markup: ADMIN_KEYBOARD };
}

export function backKeyboard() {
  return BACK_KEYBOARD;
}

// --- Stats ---

// Start of the current day in Tehran (UTC+3:30), as a unix timestamp.
function tehranDayStartUnix(nowMs = Date.now()) {
  const offsetMs = 3.5 * 3600 * 1000;
  const d = new Date(nowMs + offsetMs);
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - offsetMs) / 1000);
}

export async function getStats() {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = tehranDayStartUnix();
  const weekStart = now - 7 * 86400;
  const [usersTotal, usersToday, users7d, activeToday, favTotal, repTotal, rep7d, chTotal, topReported, fb7d] =
    await Promise.all([
      db.get(sql`SELECT count(*) AS c FROM users`),
      db.get(sql`SELECT count(*) AS c FROM users WHERE created_at >= ${todayStart}`),
      db.get(sql`SELECT count(*) AS c FROM users WHERE created_at >= ${weekStart}`),
      db.get(sql`SELECT count(*) AS c FROM users WHERE last_seen_at >= ${todayStart}`),
      db.get(sql`SELECT count(*) AS c FROM favorites`),
      db.get(sql`SELECT count(*) AS c FROM reports`),
      db.get(sql`SELECT count(*) AS c FROM reports WHERE created_at >= ${weekStart}`),
      db.get(sql`SELECT count(*) AS c FROM channels`),
      db.all(sql`SELECT channel_id, count(*) AS n FROM reports GROUP BY channel_id ORDER BY n DESC LIMIT 5`),
      // Playback feedback, last 7 days: how many votes said played /
      // failed (silent, from the app itself — nobody is asked).
      db.all(sql`SELECT outcome, count(*) AS n FROM playback_feedback WHERE created_at >= ${weekStart} GROUP BY outcome`),
    ]);
  // Resolve the most-reported channel ids to names.
  const ids = (topReported || []).map((r) => r.channel_id);
  let names = {};
  if (ids.length) {
    const rows = await db.select().from(channels).where(inArray(channels.id, ids)).all();
    names = Object.fromEntries(rows.map((r) => [r.id, r.name]));
  }
  const fb = { played: 0, failed: 0 };
  for (const r of fb7d || []) if (fb[r.outcome] !== undefined) fb[r.outcome] = r.n;
  return {
    usersTotal: usersTotal?.c ?? 0,
    usersToday: usersToday?.c ?? 0,
    users7d: users7d?.c ?? 0,
    activeToday: activeToday?.c ?? 0,
    favTotal: favTotal?.c ?? 0,
    repTotal: repTotal?.c ?? 0,
    rep7d: rep7d?.c ?? 0,
    chTotal: chTotal?.c ?? 0,
    topReported: (topReported || []).map((r) => ({ name: names[r.channel_id] || ('#' + r.channel_id), n: r.n })),
    fbPlayed7d: fb.played,
    fbFailed7d: fb.failed,
  };
}

export function formatStats(s) {
  const top = s.topReported.length
    ? '🚩 پرگزارش‌ترین شبکه‌ها:\n' +
      s.topReported.map((x, i) => `${fa(i + 1)}. ${x.name} — ${fa(x.n)} گزارش`).join('\n')
    : '🚩 پرگزارش‌ترین شبکه‌ها:\n— هنوز گزارشی نیست';
  return (
    '📊 آمار ماهواره زنده\n\n' +
    `👥 کاربرا: ${fa(s.usersTotal)} کل | ${fa(s.usersToday)} امروز | ${fa(s.users7d)} این هفته\n` +
    `🟢 فعال امروز: ${fa(s.activeToday)}\n` +
    `📺 شبکه‌های فعال: ${fa(s.chTotal)}\n` +
    `⭐ علاقه‌مندی‌ها: ${fa(s.favTotal)}\n` +
    `🚩 گزارش خرابی: ${fa(s.repTotal)} کل | ${fa(s.rep7d)} این هفته\n` +
    `▶️ بازخورد پخش (این هفته): ${fa(s.fbPlayed7d)} پخش شد | ${fa(s.fbFailed7d)} خراب\n\n` +
    top
  );
}

// --- Reports ---

// Most recent breakage reports, newest first, with channel names.
export async function getRecentReports(limit = 10) {
  const rows = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(limit)
    .all();
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.channelId))];
  const chRows = await db.select().from(channels).where(inArray(channels.id, ids)).all();
  const names = Object.fromEntries(chRows.map((r) => [r.id, r.name]));
  return rows.map((r) => ({
    channel: names[r.channelId] || ('#' + r.channelId),
    userId: r.userId,
    reason: r.reason,
    createdAt: r.createdAt,
  }));
}

export function formatReports(list) {
  if (!list.length) return '🚩 گزارش خرابی\n\n— هنوز گزارشی نیست.';
  const lines = list.map((r) => {
    const d = new Date((r.createdAt || 0) * 1000);
    const when = d.toLocaleString('fa-IR', { timeZone: 'Asia/Tehran', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `• ${r.channel} — کاربر ${r.userId} — ${when}`;
  });
  return '🚩 گزارش‌های خرابی (آخرین‌ها):\n\n' + lines.join('\n');
}

// --- Broadcast flow state ---
// Keys in admin_state: 'broadcast_awaiting' ('1' while the panel waits
// for the admin's text), 'broadcast_pending' (the draft text),
// 'broadcast_prompt_msg' (the prompt message id, to restore it to the
// panel once the draft arrives).

export async function getAdminState(key) {
  const row = await db.select().from(adminState).where(eq(adminState.key, key)).get();
  return row?.value ?? null;
}

export async function setAdminState(key, value) {
  const now = Math.floor(Date.now() / 1000);
  await db
    .insert(adminState)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: adminState.key, set: { value, updatedAt: now } })
    .run();
}

export async function clearAdminState(key) {
  await db.delete(adminState).where(eq(adminState.key, key)).run();
}

export async function clearBroadcastFlow() {
  await Promise.all([
    clearAdminState('broadcast_awaiting'),
    clearAdminState('broadcast_pending'),
    clearAdminState('broadcast_prompt_msg'),
  ]);
}

export const BROADCAST_PROMPT_TEXT =
  '📣 پیام همگانی\n\n' +
  'متن پیامی که می‌خوای به همه‌ی کاربرا برسه رو بفرست.\n' +
  'قبل از ارسال، پیش‌نمایش رو می‌بینی و تأیید می‌کنی — تا تأیید نکنی چیزی فرستاده نمی‌شه.';

export function broadcastConfirmKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '✅ تأیید و ارسال به همه', callback_data: 'admin:broadcast_confirm' }],
      [{ text: '↩ برگشت (ارسال نمی‌شه)', callback_data: 'admin:broadcast_cancel' }],
    ],
  };
}

// --- Broadcast ---

// Send `text` to every registered user, one by one. Returns the counts.
// Users who blocked the bot (or deleted their account) count as failed.
export async function broadcast(text) {
  const clean = (text || '').trim();
  if (!clean) throw new Error('EMPTY');
  if (clean.length > 4096) throw new Error('TOO_LONG');
  const rows = await db.all(sql`SELECT tg_id FROM users`);
  let sent = 0;
  let failed = 0;
  for (const row of rows || []) {
    try {
      await api.sendMessage({ chat_id: row.tg_id, text: clean });
      sent++;
    } catch {
      failed++;
    }
    // Stay well under Telegram's ~30 msg/sec broadcast limit.
    await new Promise((r) => setTimeout(r, 40));
  }
  return { total: (rows || []).length, sent, failed };
}
