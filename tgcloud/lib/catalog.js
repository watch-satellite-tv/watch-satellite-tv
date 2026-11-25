import { db, fetch } from 'sdk';
import { eq, asc } from 'sdk/db';
import { channels, cacheMeta } from '../schema.js';
import { PLAYABLE_FAS, PERSIANA_DEAD } from './probe.js';

// Channel catalog — iptv-org playlists, fetched lazily and cached in
// SQLite. There is no cron in tgcloud, so a feed refreshes on demand:
// when a feed is opened and its cache is older than REFRESH_AFTER_S
// (or empty), the endpoint re-fetches that one playlist file only —
// never the whole index. A playlist file is small (fas.m3u: 201
// channels), well under the 30 MB sdk.fetch cap.
//
// Only https streams are returned by default: an http stream cannot
// play inside the https Mini App (mixed content). http rows are kept
// in the DB with tier 'http' so a future proxy can unlock them.

export const FEEDS = {
  // 'fas' merges two playlists into ONE Persian feed: iptv-org's
  // fas.m3u (verified playable only) + Persiana TV's final.m3u
  // (Telewebion/IRIB channels etc., minus radio and dead links).
  // Rows are deduped by URL, persiana source FIRST so the Persian
  // display names win (شبکه ۱ instead of IRIB 1); fas rows backfill
  // anything persiana filtered out.
  fas: {
    label: 'فارسی',
    sources: [
      { key: 'persiana', url: 'https://raw.githubusercontent.com/Samhouston010/persiana-tv-epg/main/final.m3u' },
      { key: 'fas', url: 'https://iptv-org.github.io/iptv/languages/fas.m3u' },
    ],
  },
  news: { label: 'خبری', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  movies: { label: 'فیلم', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
  sports: { label: 'ورزشی', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  music: { label: 'موسیقی', url: 'https://iptv-org.github.io/iptv/categories/music.m3u' },
  entertainment: { label: 'سرگرمی', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u' },
};

export const REFRESH_AFTER_S = 12 * 3600; // 12 hours

function parseAttr(line, name) {
  const m = line.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

// Parse an m3u playlist into { tvgId, name, logo, group, url } rows.
export function parseM3u(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;
    const name = (line.split(',').slice(1).join(',') || '').trim();
    const url = (lines[i + 1] || '').trim();
    if (!url || url.startsWith('#')) continue;
    // Some upstream lines are malformed and carry attributes AFTER the
    // comma, e.g. `,Afra Film group-title="فیلم و موسیقی"` — strip any
    // trailing attr="..." fragments out of the display name.
    const cleanName = name
      .replace(/\s+(tvg-id|tvg-name|tvg-logo|tvg-chno|group-title|catchup|catchup-source)="[^"]*"/g, '')
      .trim();
    out.push({
      tvgId: parseAttr(line, 'tvg-id'),
      name: cleanName || 'بدون نام',
      logo: parseAttr(line, 'tvg-logo'),
      group: parseAttr(line, 'group-title'),
      url,
    });
  }
  return out;
}

async function refreshFeed(feed) {
  const def = FEEDS[feed];
  if (!def) return 0;
  const sources = def.sources || [{ key: feed, url: def.url }];
  const now = Math.floor(Date.now() / 1000);
  // Fetch every source playlist, parse, filter per source, dedupe by
  // URL (first source wins), then replace the feed wholesale.
  const seen = new Set();
  const values = [];
  for (const src of sources) {
    const res = await fetch(src.url);
    if (!res.ok) throw new Error('playlist fetch failed: ' + res.status);
    const rows = parseM3u(await res.text());
    for (const r of rows) {
      if (seen.has(r.url)) continue;
      // Per-source probe filters, applied at insert time:
      // - 'fas': only the 142 streams a live probe (2026-11-25,
      //   re-checked twice) verified as https + HTTP 200 + CORS *.
      // - 'persiana': drop radio stations (audio-only) and the dead
      //   links in PERSIANA_DEAD. Telewebion 403s are deliberately
      //   KEPT — Telewebion geo-blocks non-Iran IPs, so a 403 from
      //   the probe VM says nothing about playback on a phone in Iran.
      // - other sources: no probe data, keep everything.
      if (src.key === 'fas' && !PLAYABLE_FAS.has(r.url)) continue;
      if (src.key === 'persiana' && (r.name.startsWith('رادیو') || PERSIANA_DEAD.has(r.url))) continue;
      seen.add(r.url);
      values.push({
        feed,
        source: src.key,
        tvgId: r.tvgId,
        name: r.name,
        logo: r.logo,
        groupName: r.group,
        url: r.url,
        tier: r.url.toLowerCase().startsWith('https://') ? 'https' : 'http',
        checkedAt: now,
      });
    }
  }
  // Replace the feed wholesale: delete old rows, insert fresh ones.
  // (A feed file is a few hundred rows at most; a delete+insert keeps
  // the cache exactly in sync with upstream, including removals.)
  await db.delete(channels).where(eq(channels.feed, feed)).run();
  // Insert in chunks so one call never gets too large.
  for (let i = 0; i < values.length; i += 100) {
    await db.insert(channels).values(values.slice(i, i + 100)).run();
  }
  await db
    .insert(cacheMeta)
    .values({ key: 'feed:' + feed, value: String(values.length), updatedAt: now })
    .onConflictDoUpdate({
      target: cacheMeta.key,
      set: { value: String(values.length), updatedAt: now },
    })
    .run();
  return values.length;
}

// Return cached channels for a feed, refreshing first when the cache
// is empty or older than REFRESH_AFTER_S. `force` re-fetches regardless.
export async function getFeedChannels(feed, { force = false, includeHttp = false } = {}) {
  const def = FEEDS[feed];
  if (!def) return { feed, channels: [], total: 0, updatedAt: null, refreshed: false };
  const meta = await db.select().from(cacheMeta).where(eq(cacheMeta.key, 'feed:' + feed)).get();
  const now = Math.floor(Date.now() / 1000);
  const age = meta ? now - (meta.updatedAt || 0) : Infinity;
  const count = await db.$count(channels, eq(channels.feed, feed));
  let refreshed = false;
  if (force || count === 0 || age > REFRESH_AFTER_S) {
    try {
      await refreshFeed(feed);
      refreshed = true;
    } catch (e) {
      console.error('refreshFeed failed for ' + feed, e);
      // Fall through to whatever is cached, even if stale.
      if (count === 0) throw e;
    }
  }
  const rows = await db
    .select()
    .from(channels)
    .where(eq(channels.feed, feed))
    .orderBy(asc(channels.name))
    .all();
  const freshMeta = await db.select().from(cacheMeta).where(eq(cacheMeta.key, 'feed:' + feed)).get();
  const list = rows
    .filter((r) => includeHttp || r.tier === 'https')
    .map((r) => ({
      id: r.id,
      tvg_id: r.tvgId,
      name: r.name,
      logo: r.logo,
      group: r.groupName,
      url: r.url,
      tier: r.tier,
      reports: r.reports,
    }));
  return {
    feed,
    label: def.label,
    channels: list,
    total: list.length,
    stored: rows.length,
    updatedAt: freshMeta ? freshMeta.updatedAt : null,
    refreshed,
  };
}
