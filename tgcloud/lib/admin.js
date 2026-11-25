import { api, db } from 'sdk';
import { sql, eq, inArray, desc } from 'sdk/db';
import { OWNER_ID } from './owner.js';
import { users, favorites, reports, channels } from '../schema.js';

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
  'از اینجا آمار کاربرا و گزارش‌های خرابی رو ببین.\n\n' +
  'برای پیام همگانی به همه‌ی کاربرا، این دستور رو بفرست:\n' +
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
  const [usersTotal, usersToday, users7d, activeToday, favTotal, repTotal, rep7d, chTotal, topReported] =
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
    ]);
  // Resolve the most-reported channel ids to names.
  const ids = (topReported || []).map((r) => r.channel_id);
  let names = {};
  if (ids.length) {
    const rows = await db.select().from(channels).where(inArray(channels.id, ids)).all();
    names = Object.fromEntries(rows.map((r) => [r.id, r.name]));
  }
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
    `🚩 گزارش خرابی: ${fa(s.repTotal)} کل | ${fa(s.rep7d)} این هفته\n\n` +
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
