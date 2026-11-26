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
  // (Telewebion/IRIB channels etc., minus radio and dead links),
  // plus the hand-picked iFilm extras (EXTRA_FAS). It is the Iran
  // feed: first chip, labelled 🇮🇷 ایران in every language.
  // Rows are deduped by URL, persiana source FIRST so the Persian
  // display names win (شبکه ۱ instead of IRIB 1); fas rows backfill
  // anything persiana filtered out.
  fas: {
    label: '🇮🇷 ایران',
    sources: [
      { key: 'persiana', url: 'https://raw.githubusercontent.com/Samhouston010/persiana-tv-epg/main/final.m3u' },
      { key: 'fas', url: 'https://iptv-org.github.io/iptv/languages/fas.m3u' },
    ],
  },
  // Country feeds — one iptv-org playlist each, Iran first. No probe
  // data for these (same as the category feeds below: everything
  // https is kept). gb.m3u does not exist upstream (404), so the UK
  // is not here until iptv-org publishes it.
  us: { label: '🇺🇸 آمریکا', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  tr: { label: '🇹🇷 ترکیه', url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
  sa: { label: '🇸🇦 عربستان', url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' },
  ae: { label: '🇦🇪 امارات', url: 'https://iptv-org.github.io/iptv/countries/ae.m3u' },
  de: { label: '🇩🇪 آلمان', url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
  fr: { label: '🇫🇷 فرانسه', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  ru: { label: '🇷🇺 روسیه', url: 'https://iptv-org.github.io/iptv/countries/ru.m3u' },
  cn: { label: '🇨🇳 چین', url: 'https://iptv-org.github.io/iptv/countries/cn.m3u' },
  in: { label: '🇮🇳 هند', url: 'https://iptv-org.github.io/iptv/countries/in.m3u' },
  af: { label: '🇦🇫 افغانستان', url: 'https://iptv-org.github.io/iptv/countries/af.m3u' },
  iq: { label: '🇮🇶 عراق', url: 'https://iptv-org.github.io/iptv/countries/iq.m3u' },
  news: { label: 'خبری', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  movies: { label: 'فیلم', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
  sports: { label: 'ورزشی', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  music: { label: 'موسیقی', url: 'https://iptv-org.github.io/iptv/categories/music.m3u' },
  entertainment: { label: 'سرگرمی', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u' },
};

// Hand-picked extras for the Persian feed: the iFilm channels from
// Free-TV/IPTV's iran.md — neither upstream playlist carries them.
// Verified live 2026-11-26 (https + HTTP 200 + CORS *). Logos are the
// ones Free-TV/IPTV uses for these channels (imgur).
const EXTRA_FAS = [
  { name: 'آی‌فیلم', logo: 'https://i.imgur.com/4Z9L1AW.png', group: 'فیلم و سریال', url: 'https://live.presstv.co.uk/hls/ifilmfa.m3u8' },
  { name: 'آی‌فیلم ۲', logo: 'https://i.imgur.com/WZrGsFb.png', group: 'فیلم و سریال', url: 'https://live.presstv.co.uk/hls/ifilm2.m3u8' },
  { name: 'آی‌فیلم عربی', logo: 'https://i.imgur.com/D3cXTpJ.png', group: 'فیلم و سریال', url: 'https://live.presstv.co.uk/hls/ifilmar.m3u8' },
  { name: 'آی‌فیلم انگلیسی', logo: 'https://i.imgur.com/RdC0DQk.png', group: 'فیلم و سریال', url: 'https://live.presstv.co.uk/hls/ifilmen.m3u8' },
  // GEM Sport — the only GEM stream that plays directly (verified
  // 2026-11-26: https + HTTP 200 + CORS *). The other GEM channels
  // are all 403 on onetv.app from here; see issue #13846. Logo from
  // livefarsi.com (the page that lists this stream).
  { name: 'جم اسپورت', logo: 'https://www.livefarsi.com/uploads/tv_image/gem-tv-sport.jpg', group: 'ورزشی', url: 'https://cp11.adabmedia.com/hls2/sport.m3u8' },
];

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
  // Hand-picked extras for the Persian feed (EXTRA_FAS): appended
  // after the playlist sources, deduped by URL like everything else.
  if (feed === 'fas') {
    for (const r of EXTRA_FAS) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      values.push({
        feed,
        source: 'extra',
        tvgId: null,
        name: r.name,
        logo: r.logo,
        groupName: r.group,
        url: r.url,
        tier: 'https',
        checkedAt: now,
      });
    }
  }
  // Sync the cache WITHOUT changing row ids: favourites and reports
  // point at channels.id, so a wholesale delete+insert would orphan
  // them on every refresh. Instead upsert by (feed, url): update
  // rows whose content changed, insert new URLs, delete URLs that
  // vanished. Rows whose content is unchanged are left untouched.
  const existing = await db.select().from(channels).where(eq(channels.feed, feed)).all();
  const byUrl = new Map(existing.map((r) => [r.url, r]));
  const freshUrls = new Set(values.map((v) => v.url));
  for (const v of values) {
    const old = byUrl.get(v.url);
    if (!old) continue; // new URLs are inserted below, in chunks
    if (
      old.source !== v.source || old.tvgId !== v.tvgId || old.name !== v.name ||
      old.logo !== v.logo || old.groupName !== v.groupName || old.tier !== v.tier
    ) {
      await db
        .update(channels)
        .set({ source: v.source, tvgId: v.tvgId, name: v.name, logo: v.logo, groupName: v.groupName, tier: v.tier, checkedAt: now })
        .where(eq(channels.id, old.id))
        .run();
    }
  }
  const toInsert = values.filter((v) => !byUrl.has(v.url));
  for (let i = 0; i < toInsert.length; i += 100) {
    await db.insert(channels).values(toInsert.slice(i, i + 100)).run();
  }
  for (const row of existing) {
    if (!freshUrls.has(row.url)) {
      await db.delete(channels).where(eq(channels.id, row.id)).run();
    }
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
