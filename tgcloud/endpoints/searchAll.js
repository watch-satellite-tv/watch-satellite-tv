import { db, EndpointError } from 'sdk';
import { asc, sql } from 'sdk/db';
import { channels } from '../schema.js';
import { ensureUser, getUserLanguage } from '../lib/users.js';
import { feedLabel, effectiveLang } from '../lib/i18n.js';

// Search ALL feeds by channel name — the "Search All" mode.
// Input: { q: string }. Returns up to 200 https streams whose name
// matches (min 2 chars), deduped by URL: the same stream listed in
// several countries comes back once. Each row carries the feed it
// was found in (labelled in the user's language) as its group, so
// the user can tell the country/source apart and try the variants
// when one source doesn't play.
export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  await ensureUser(user);
  const q = String(input?.q || '').trim();
  if (q.length < 2) return { ok: true, channels: [], total: 0 };
  const lang = effectiveLang(await getUserLanguage(user.id), user.language_code);
  const pattern = '%' + q.replace(/[\\%_]/g, (m) => '\\' + m) + '%';
  const rows = await db
    .select()
    .from(channels)
    .where(sql`${channels.tier} = 'https' AND ${channels.name} LIKE ${pattern} ESCAPE '\\' AND ${channels.url} NOT LIKE '%.mpd%' AND ${channels.url} NOT LIKE '%onetv.app%'`)
    .orderBy(asc(channels.name))
    .limit(500)
    .all();
  const seen = new Set();
  const list = [];
  for (const r of rows) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    list.push({
      id: r.id,
      tvg_id: r.tvgId,
      name: r.name,
      logo: r.logo,
      group: feedLabel(r.feed, lang),
      feed: r.feed,
      url: r.url,
      tier: r.tier,
      reports: r.reports,
    });
    if (list.length >= 200) break;
  }
  return { ok: true, channels: list, total: list.length };
}
