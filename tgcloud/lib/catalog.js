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
  // https is kept). Every iptv-org country playlist with >=1 channel
  // (checked 2026-11-26: 188 of 250 API countries; 62 have no file
  // upstream). The UK is 'uk' (not 'gb'). ir.m3u is NOT listed
  // separately — the merged fas feed above IS the Iran feed.
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
  az: { label: '🇦🇿 آذربایجان', url: 'https://iptv-org.github.io/iptv/countries/az.m3u' },
  aw: { label: '🇦🇼 آروبا', url: 'https://iptv-org.github.io/iptv/countries/aw.m3u' },
  ar: { label: '🇦🇷 آرژانتین', url: 'https://iptv-org.github.io/iptv/countries/ar.m3u' },
  za: { label: '🇿🇦 آفریقای جنوبی', url: 'https://iptv-org.github.io/iptv/countries/za.m3u' },
  al: { label: '🇦🇱 آلبانی', url: 'https://iptv-org.github.io/iptv/countries/al.m3u' },
  ag: { label: '🇦🇬 آنتیگوا و باربودا', url: 'https://iptv-org.github.io/iptv/countries/ag.m3u' },
  ad: { label: '🇦🇩 آندورا', url: 'https://iptv-org.github.io/iptv/countries/ad.m3u' },
  ao: { label: '🇦🇴 آنگولا', url: 'https://iptv-org.github.io/iptv/countries/ao.m3u' },
  at: { label: '🇦🇹 اتریش', url: 'https://iptv-org.github.io/iptv/countries/at.m3u' },
  et: { label: '🇪🇹 اتیوپی', url: 'https://iptv-org.github.io/iptv/countries/et.m3u' },
  jo: { label: '🇯🇴 اردن', url: 'https://iptv-org.github.io/iptv/countries/jo.m3u' },
  am: { label: '🇦🇲 ارمنستان', url: 'https://iptv-org.github.io/iptv/countries/am.m3u' },
  uy: { label: '🇺🇾 اروگوئه', url: 'https://iptv-org.github.io/iptv/countries/uy.m3u' },
  er: { label: '🇪🇷 اریتره', url: 'https://iptv-org.github.io/iptv/countries/er.m3u' },
  uz: { label: '🇺🇿 ازبکستان', url: 'https://iptv-org.github.io/iptv/countries/uz.m3u' },
  au: { label: '🇦🇺 استرالیا', url: 'https://iptv-org.github.io/iptv/countries/au.m3u' },
  ee: { label: '🇪🇪 استونی', url: 'https://iptv-org.github.io/iptv/countries/ee.m3u' },
  il: { label: '🇮🇱 اسرائیل', url: 'https://iptv-org.github.io/iptv/countries/il.m3u' },
  sk: { label: '🇸🇰 اسلواکی', url: 'https://iptv-org.github.io/iptv/countries/sk.m3u' },
  si: { label: '🇸🇮 اسلوونی', url: 'https://iptv-org.github.io/iptv/countries/si.m3u' },
  es: { label: '🇪🇸 اسپانیا', url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  dz: { label: '🇩🇿 الجزایر', url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  sv: { label: '🇸🇻 السالوادور', url: 'https://iptv-org.github.io/iptv/countries/sv.m3u' },
  id: { label: '🇮🇩 اندونزی', url: 'https://iptv-org.github.io/iptv/countries/id.m3u' },
  uk: { label: '🇬🇧 انگلیس', url: 'https://iptv-org.github.io/iptv/countries/uk.m3u' },
  ua: { label: '🇺🇦 اوکراین', url: 'https://iptv-org.github.io/iptv/countries/ua.m3u' },
  ug: { label: '🇺🇬 اوگاندا', url: 'https://iptv-org.github.io/iptv/countries/ug.m3u' },
  ec: { label: '🇪🇨 اکوادور', url: 'https://iptv-org.github.io/iptv/countries/ec.m3u' },
  it: { label: '🇮🇹 ایتالیا', url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
  ie: { label: '🇮🇪 ایرلند', url: 'https://iptv-org.github.io/iptv/countries/ie.m3u' },
  is: { label: '🇮🇸 ایسلند', url: 'https://iptv-org.github.io/iptv/countries/is.m3u' },
  bb: { label: '🇧🇧 باربادوس', url: 'https://iptv-org.github.io/iptv/countries/bb.m3u' },
  bs: { label: '🇧🇸 باهاما', url: 'https://iptv-org.github.io/iptv/countries/bs.m3u' },
  bh: { label: '🇧🇭 بحرین', url: 'https://iptv-org.github.io/iptv/countries/bh.m3u' },
  br: { label: '🇧🇷 برزیل', url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
  bn: { label: '🇧🇳 برونئی', url: 'https://iptv-org.github.io/iptv/countries/bn.m3u' },
  by: { label: '🇧🇾 بلاروس', url: 'https://iptv-org.github.io/iptv/countries/by.m3u' },
  bg: { label: '🇧🇬 بلغارستان', url: 'https://iptv-org.github.io/iptv/countries/bg.m3u' },
  be: { label: '🇧🇪 بلژیک', url: 'https://iptv-org.github.io/iptv/countries/be.m3u' },
  bz: { label: '🇧🇿 بلیز', url: 'https://iptv-org.github.io/iptv/countries/bz.m3u' },
  bd: { label: '🇧🇩 بنگلادش', url: 'https://iptv-org.github.io/iptv/countries/bd.m3u' },
  bj: { label: '🇧🇯 بنین', url: 'https://iptv-org.github.io/iptv/countries/bj.m3u' },
  bi: { label: '🇧🇮 بوروندی', url: 'https://iptv-org.github.io/iptv/countries/bi.m3u' },
  bf: { label: '🇧🇫 بورکینافاسو', url: 'https://iptv-org.github.io/iptv/countries/bf.m3u' },
  ba: { label: '🇧🇦 بوسنی و هرزگوین', url: 'https://iptv-org.github.io/iptv/countries/ba.m3u' },
  bo: { label: '🇧🇴 بولیوی', url: 'https://iptv-org.github.io/iptv/countries/bo.m3u' },
  bq: { label: '🇧🇶 بونیر', url: 'https://iptv-org.github.io/iptv/countries/bq.m3u' },
  tj: { label: '🇹🇯 تاجیکستان', url: 'https://iptv-org.github.io/iptv/countries/tj.m3u' },
  tz: { label: '🇹🇿 تانزانیا', url: 'https://iptv-org.github.io/iptv/countries/tz.m3u' },
  th: { label: '🇹🇭 تایلند', url: 'https://iptv-org.github.io/iptv/countries/th.m3u' },
  tw: { label: '🇹🇼 تایوان', url: 'https://iptv-org.github.io/iptv/countries/tw.m3u' },
  tm: { label: '🇹🇲 ترکمنستان', url: 'https://iptv-org.github.io/iptv/countries/tm.m3u' },
  tt: { label: '🇹🇹 ترینیداد و توباگو', url: 'https://iptv-org.github.io/iptv/countries/tt.m3u' },
  tn: { label: '🇹🇳 تونس', url: 'https://iptv-org.github.io/iptv/countries/tn.m3u' },
  tg: { label: '🇹🇬 توگو', url: 'https://iptv-org.github.io/iptv/countries/tg.m3u' },
  jm: { label: '🇯🇲 جامائیکا', url: 'https://iptv-org.github.io/iptv/countries/jm.m3u' },
  vg: { label: '🇻🇬 جزایر ویرجین بریتانیا', url: 'https://iptv-org.github.io/iptv/countries/vg.m3u' },
  do: { label: '🇩🇴 جمهوری دومینیکن', url: 'https://iptv-org.github.io/iptv/countries/do.m3u' },
  dk: { label: '🇩🇰 دانمارک', url: 'https://iptv-org.github.io/iptv/countries/dk.m3u' },
  re: { label: '🇷🇪 رئونیون', url: 'https://iptv-org.github.io/iptv/countries/re.m3u' },
  rw: { label: '🇷🇼 رواندا', url: 'https://iptv-org.github.io/iptv/countries/rw.m3u' },
  ro: { label: '🇷🇴 رومانی', url: 'https://iptv-org.github.io/iptv/countries/ro.m3u' },
  zw: { label: '🇿🇼 زیمبابوه', url: 'https://iptv-org.github.io/iptv/countries/zw.m3u' },
  ci: { label: '🇨🇮 ساحل عاج', url: 'https://iptv-org.github.io/iptv/countries/ci.m3u' },
  ws: { label: '🇼🇸 ساموآ', url: 'https://iptv-org.github.io/iptv/countries/ws.m3u' },
  // Manual feed — channels from iptv-org's database that belong to NO
  // country playlist (2026-11-26 full diff: 2,228 such channels,
  // 4,426 streams). No playlist source: rows come from the streams.json
  // import, and refreshFeed() skips manual feeds so they survive.
  other: { label: '🌍 سایر', manual: true },
  lk: { label: '🇱🇰 سری‌لانکا', url: 'https://iptv-org.github.io/iptv/countries/lk.m3u' },
  sm: { label: '🇸🇲 سن مارینو', url: 'https://iptv-org.github.io/iptv/countries/sm.m3u' },
  lc: { label: '🇱🇨 سنت لوسیا', url: 'https://iptv-org.github.io/iptv/countries/lc.m3u' },
  sx: { label: '🇸🇽 سنت مارتن', url: 'https://iptv-org.github.io/iptv/countries/sx.m3u' },
  vc: { label: '🇻🇨 سنت وینسنت و گرنادین‌ها', url: 'https://iptv-org.github.io/iptv/countries/vc.m3u' },
  kn: { label: '🇰🇳 سنت کیتس و نویس', url: 'https://iptv-org.github.io/iptv/countries/kn.m3u' },
  sn: { label: '🇸🇳 سنگال', url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' },
  sg: { label: '🇸🇬 سنگاپور', url: 'https://iptv-org.github.io/iptv/countries/sg.m3u' },
  se: { label: '🇸🇪 سوئد', url: 'https://iptv-org.github.io/iptv/countries/se.m3u' },
  ch: { label: '🇨🇭 سوئیس', url: 'https://iptv-org.github.io/iptv/countries/ch.m3u' },
  sd: { label: '🇸🇩 سودان', url: 'https://iptv-org.github.io/iptv/countries/sd.m3u' },
  sr: { label: '🇸🇷 سورینام', url: 'https://iptv-org.github.io/iptv/countries/sr.m3u' },
  sy: { label: '🇸🇾 سوریه', url: 'https://iptv-org.github.io/iptv/countries/sy.m3u' },
  so: { label: '🇸🇴 سومالی', url: 'https://iptv-org.github.io/iptv/countries/so.m3u' },
  sl: { label: '🇸🇱 سیرالئون', url: 'https://iptv-org.github.io/iptv/countries/sl.m3u' },
  cl: { label: '🇨🇱 شیلی', url: 'https://iptv-org.github.io/iptv/countries/cl.m3u' },
  eh: { label: '🇪🇭 صحرای غربی', url: 'https://iptv-org.github.io/iptv/countries/eh.m3u' },
  rs: { label: '🇷🇸 صربستان', url: 'https://iptv-org.github.io/iptv/countries/rs.m3u' },
  om: { label: '🇴🇲 عمان', url: 'https://iptv-org.github.io/iptv/countries/om.m3u' },
  gh: { label: '🇬🇭 غنا', url: 'https://iptv-org.github.io/iptv/countries/gh.m3u' },
  ps: { label: '🇵🇸 فلسطین', url: 'https://iptv-org.github.io/iptv/countries/ps.m3u' },
  fi: { label: '🇫🇮 فنلاند', url: 'https://iptv-org.github.io/iptv/countries/fi.m3u' },
  fj: { label: '🇫🇯 فیجی', url: 'https://iptv-org.github.io/iptv/countries/fj.m3u' },
  ph: { label: '🇵🇭 فیلیپین', url: 'https://iptv-org.github.io/iptv/countries/ph.m3u' },
  cy: { label: '🇨🇾 قبرس', url: 'https://iptv-org.github.io/iptv/countries/cy.m3u' },
  kg: { label: '🇰🇬 قرقیزستان', url: 'https://iptv-org.github.io/iptv/countries/kg.m3u' },
  kz: { label: '🇰🇿 قزاقستان', url: 'https://iptv-org.github.io/iptv/countries/kz.m3u' },
  qa: { label: '🇶🇦 قطر', url: 'https://iptv-org.github.io/iptv/countries/qa.m3u' },
  la: { label: '🇱🇦 لائوس', url: 'https://iptv-org.github.io/iptv/countries/la.m3u' },
  lb: { label: '🇱🇧 لبنان', url: 'https://iptv-org.github.io/iptv/countries/lb.m3u' },
  lv: { label: '🇱🇻 لتونی', url: 'https://iptv-org.github.io/iptv/countries/lv.m3u' },
  pl: { label: '🇵🇱 لهستان', url: 'https://iptv-org.github.io/iptv/countries/pl.m3u' },
  lu: { label: '🇱🇺 لوکزامبورگ', url: 'https://iptv-org.github.io/iptv/countries/lu.m3u' },
  ly: { label: '🇱🇾 لیبی', url: 'https://iptv-org.github.io/iptv/countries/ly.m3u' },
  lt: { label: '🇱🇹 لیتوانی', url: 'https://iptv-org.github.io/iptv/countries/lt.m3u' },
  li: { label: '🇱🇮 لیختن‌اشتاین', url: 'https://iptv-org.github.io/iptv/countries/li.m3u' },
  mg: { label: '🇲🇬 ماداگاسکار', url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
  mq: { label: '🇲🇶 مارتینیک', url: 'https://iptv-org.github.io/iptv/countries/mq.m3u' },
  mt: { label: '🇲🇹 مالت', url: 'https://iptv-org.github.io/iptv/countries/mt.m3u' },
  mv: { label: '🇲🇻 مالدیو', url: 'https://iptv-org.github.io/iptv/countries/mv.m3u' },
  my: { label: '🇲🇾 مالزی', url: 'https://iptv-org.github.io/iptv/countries/my.m3u' },
  ml: { label: '🇲🇱 مالی', url: 'https://iptv-org.github.io/iptv/countries/ml.m3u' },
  mo: { label: '🇲🇴 ماکائو', url: 'https://iptv-org.github.io/iptv/countries/mo.m3u' },
  hu: { label: '🇭🇺 مجارستان', url: 'https://iptv-org.github.io/iptv/countries/hu.m3u' },
  ma: { label: '🇲🇦 مراکش', url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
  eg: { label: '🇪🇬 مصر', url: 'https://iptv-org.github.io/iptv/countries/eg.m3u' },
  mn: { label: '🇲🇳 مغولستان', url: 'https://iptv-org.github.io/iptv/countries/mn.m3u' },
  mk: { label: '🇲🇰 مقدونیه شمالی', url: 'https://iptv-org.github.io/iptv/countries/mk.m3u' },
  mr: { label: '🇲🇷 موریتانی', url: 'https://iptv-org.github.io/iptv/countries/mr.m3u' },
  mu: { label: '🇲🇺 موریس', url: 'https://iptv-org.github.io/iptv/countries/mu.m3u' },
  mz: { label: '🇲🇿 موزامبیک', url: 'https://iptv-org.github.io/iptv/countries/mz.m3u' },
  md: { label: '🇲🇩 مولداوی', url: 'https://iptv-org.github.io/iptv/countries/md.m3u' },
  mc: { label: '🇲🇨 موناکو', url: 'https://iptv-org.github.io/iptv/countries/mc.m3u' },
  me: { label: '🇲🇪 مونته‌نگرو', url: 'https://iptv-org.github.io/iptv/countries/me.m3u' },
  mx: { label: '🇲🇽 مکزیک', url: 'https://iptv-org.github.io/iptv/countries/mx.m3u' },
  mm: { label: '🇲🇲 میانمار', url: 'https://iptv-org.github.io/iptv/countries/mm.m3u' },
  na: { label: '🇳🇦 نامیبیا', url: 'https://iptv-org.github.io/iptv/countries/na.m3u' },
  no: { label: '🇳🇴 نروژ', url: 'https://iptv-org.github.io/iptv/countries/no.m3u' },
  np: { label: '🇳🇵 نپال', url: 'https://iptv-org.github.io/iptv/countries/np.m3u' },
  ne: { label: '🇳🇪 نیجر', url: 'https://iptv-org.github.io/iptv/countries/ne.m3u' },
  ng: { label: '🇳🇬 نیجریه', url: 'https://iptv-org.github.io/iptv/countries/ng.m3u' },
  nz: { label: '🇳🇿 نیوزیلند', url: 'https://iptv-org.github.io/iptv/countries/nz.m3u' },
  ni: { label: '🇳🇮 نیکاراگوئه', url: 'https://iptv-org.github.io/iptv/countries/ni.m3u' },
  ht: { label: '🇭🇹 هائیتی', url: 'https://iptv-org.github.io/iptv/countries/ht.m3u' },
  nl: { label: '🇳🇱 هلند', url: 'https://iptv-org.github.io/iptv/countries/nl.m3u' },
  hn: { label: '🇭🇳 هندوراس', url: 'https://iptv-org.github.io/iptv/countries/hn.m3u' },
  hk: { label: '🇭🇰 هنگ‌کنگ', url: 'https://iptv-org.github.io/iptv/countries/hk.m3u' },
  va: { label: '🇻🇦 واتیکان', url: 'https://iptv-org.github.io/iptv/countries/va.m3u' },
  ve: { label: '🇻🇪 ونزوئلا', url: 'https://iptv-org.github.io/iptv/countries/ve.m3u' },
  vn: { label: '🇻🇳 ویتنام', url: 'https://iptv-org.github.io/iptv/countries/vn.m3u' },
  py: { label: '🇵🇾 پاراگوئه', url: 'https://iptv-org.github.io/iptv/countries/py.m3u' },
  pa: { label: '🇵🇦 پاناما', url: 'https://iptv-org.github.io/iptv/countries/pa.m3u' },
  pg: { label: '🇵🇬 پاپوآ گینه نو', url: 'https://iptv-org.github.io/iptv/countries/pg.m3u' },
  pk: { label: '🇵🇰 پاکستان', url: 'https://iptv-org.github.io/iptv/countries/pk.m3u' },
  pt: { label: '🇵🇹 پرتغال', url: 'https://iptv-org.github.io/iptv/countries/pt.m3u' },
  pe: { label: '🇵🇪 پرو', url: 'https://iptv-org.github.io/iptv/countries/pe.m3u' },
  pf: { label: '🇵🇫 پلی‌نزی فرانسه', url: 'https://iptv-org.github.io/iptv/countries/pf.m3u' },
  pr: { label: '🇵🇷 پورتوریکو', url: 'https://iptv-org.github.io/iptv/countries/pr.m3u' },
  td: { label: '🇹🇩 چاد', url: 'https://iptv-org.github.io/iptv/countries/td.m3u' },
  cz: { label: '🇨🇿 چک', url: 'https://iptv-org.github.io/iptv/countries/cz.m3u' },
  jp: { label: '🇯🇵 ژاپن', url: 'https://iptv-org.github.io/iptv/countries/jp.m3u' },
  cr: { label: '🇨🇷 کاستاریکا', url: 'https://iptv-org.github.io/iptv/countries/cr.m3u' },
  nc: { label: '🇳🇨 کالدونیای جدید', url: 'https://iptv-org.github.io/iptv/countries/nc.m3u' },
  kh: { label: '🇰🇭 کامبوج', url: 'https://iptv-org.github.io/iptv/countries/kh.m3u' },
  cm: { label: '🇨🇲 کامرون', url: 'https://iptv-org.github.io/iptv/countries/cm.m3u' },
  ca: { label: '🇨🇦 کانادا', url: 'https://iptv-org.github.io/iptv/countries/ca.m3u' },
  kr: { label: '🇰🇷 کره جنوبی', url: 'https://iptv-org.github.io/iptv/countries/kr.m3u' },
  kp: { label: '🇰🇵 کره شمالی', url: 'https://iptv-org.github.io/iptv/countries/kp.m3u' },
  hr: { label: '🇭🇷 کرواسی', url: 'https://iptv-org.github.io/iptv/countries/hr.m3u' },
  co: { label: '🇨🇴 کلمبیا', url: 'https://iptv-org.github.io/iptv/countries/co.m3u' },
  cg: { label: '🇨🇬 کنگو', url: 'https://iptv-org.github.io/iptv/countries/cg.m3u' },
  cd: { label: '🇨🇩 کنگوی دموکراتیک', url: 'https://iptv-org.github.io/iptv/countries/cd.m3u' },
  ke: { label: '🇰🇪 کنیا', url: 'https://iptv-org.github.io/iptv/countries/ke.m3u' },
  cu: { label: '🇨🇺 کوبا', url: 'https://iptv-org.github.io/iptv/countries/cu.m3u' },
  cw: { label: '🇨🇼 کوراسائو', url: 'https://iptv-org.github.io/iptv/countries/cw.m3u' },
  xk: { label: '🇽🇰 کوزوو', url: 'https://iptv-org.github.io/iptv/countries/xk.m3u' },
  km: { label: '🇰🇲 کومور', url: 'https://iptv-org.github.io/iptv/countries/km.m3u' },
  kw: { label: '🇰🇼 کویت', url: 'https://iptv-org.github.io/iptv/countries/kw.m3u' },
  cv: { label: '🇨🇻 کیپ‌ورد', url: 'https://iptv-org.github.io/iptv/countries/cv.m3u' },
  gm: { label: '🇬🇲 گامبیا', url: 'https://iptv-org.github.io/iptv/countries/gm.m3u' },
  ge: { label: '🇬🇪 گرجستان', url: 'https://iptv-org.github.io/iptv/countries/ge.m3u' },
  gg: { label: '🇬🇬 گرنزی', url: 'https://iptv-org.github.io/iptv/countries/gg.m3u' },
  gt: { label: '🇬🇹 گواتمالا', url: 'https://iptv-org.github.io/iptv/countries/gt.m3u' },
  gp: { label: '🇬🇵 گوادلوپ', url: 'https://iptv-org.github.io/iptv/countries/gp.m3u' },
  gu: { label: '🇬🇺 گوام', url: 'https://iptv-org.github.io/iptv/countries/gu.m3u' },
  gy: { label: '🇬🇾 گویان', url: 'https://iptv-org.github.io/iptv/countries/gy.m3u' },
  gf: { label: '🇬🇫 گویان فرانسه', url: 'https://iptv-org.github.io/iptv/countries/gf.m3u' },
  gn: { label: '🇬🇳 گینه', url: 'https://iptv-org.github.io/iptv/countries/gn.m3u' },
  gq: { label: '🇬🇶 گینه استوایی', url: 'https://iptv-org.github.io/iptv/countries/gq.m3u' },
  ye: { label: '🇾🇪 یمن', url: 'https://iptv-org.github.io/iptv/countries/ye.m3u' },
  gr: { label: '🇬🇷 یونان', url: 'https://iptv-org.github.io/iptv/countries/gr.m3u' },
  news: { label: 'خبری', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
  movies: { label: 'فیلم', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
  sports: { label: 'ورزشی', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  music: { label: 'موسیقی', url: 'https://iptv-org.github.io/iptv/categories/music.m3u' },
  entertainment: { label: 'سرگرمی', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u' },
};

// Hand-picked extras for the Persian feed — channels neither upstream
// playlist carries, verified by a live probe before adding:
// - iFilm (Free-TV/IPTV iran.md): https + HTTP 200 + CORS *.
// - GEM Sport (livefarsi): https + HTTP 200 + CORS *.
// - GEM x13 + Persiana x4 (FATV directory, fatv.live): GEM streams
//   answer HTTP 200 but send NO CORS header — they play through the
//   iPhone's native HLS player (no CORS needed there) but hls.js on
//   Android/desktop will refuse them. Persiana China/Podcast/Teen/
//   Voyage are 200 + CORS * (play everywhere).
// - Persiana Sports 1–4 (IR Only): 403 + CORS * from this VM —
//   labelled IR-only upstream, kept on the Telewebion logic (likely
//   Iran-reachable); the user's phone test is the decider.
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
  // GEM via FATV (ib.abntv.live) — HTTP 200, no CORS (iPhone only).
  { name: 'جم بالیوود', logo: 'https://fatv.live/logo/GemBollywood.jpg', group: 'فیلم و سریال', url: 'https://ib.abntv.live/hls/gembolly.m3u8' },
  { name: 'جم کلاسیک', logo: 'https://fatv.live/logo/30b552ae63424f498cfc0c08d74cd060-GEMClassic.jpg', group: 'فیلم و سریال', url: 'https://ib.abntv.live/hls/gemclassic.m3u8' },
  { name: 'جم کمدی', logo: 'https://fatv.live/logo/gemseries.jpg', group: 'سرگرمی', url: 'https://ib.abntv.live/hls/gemcom.m3u8' },
  { name: 'جم انترتینمنت', logo: 'https://fatv.live/logo/GEMGeneral.jpg', group: 'سرگرمی', url: 'https://ib.abntv.live/hls/gement.m3u8' },
  { name: 'جم فیت', logo: 'https://fatv.live/logo/317b9cc64bce48448815f8cd18851923-GEMFit.jpg', group: 'ورزشی', url: 'https://ib.abntv.live/hls/gemfit.m3u8' },
  { name: 'جم فیلم', logo: 'https://fatv.live/logo/GEMGeneral.jpg', group: 'فیلم و سریال', url: 'https://ib.abntv.live/hls/gemfilm.m3u8' },
  { name: 'جم فود', logo: 'https://fatv.live/logo/GEMGeneral.jpg', group: 'آشپزی', url: 'https://ib.abntv.live/hls/gemfood.m3u8' },
  { name: 'جم فود ۲', logo: 'https://fatv.live/logo/7ce162632f2045899aa39bd58819a636-gem-food.png', group: 'آشپزی', url: 'https://ib.abntv.live/hls/gemf2.m3u8' },
  { name: 'جم جونیور', logo: 'https://fatv.live/logo/GEMJunior.jpg', group: 'کودک', url: 'https://ib.abntv.live/hls/gemjun.m3u8' },
  { name: 'جم کیدز', logo: 'https://fatv.live/logo/2892768890564bbc89e1b94832722abe-GEMKids.jpg', group: 'کودک', url: 'https://ib.abntv.live/hls/gemkids.m3u8' },
  { name: 'جم لایف', logo: 'https://fatv.live/logo/def1b08e166d4accad91dd77f17a7347-GEMLife.jpeg', group: 'سرگرمی', url: 'https://ib.abntv.live/hls/gemlife.m3u8' },
  { name: 'جم نیچر', logo: 'https://fatv.live/logo/GEMGeneral.jpg', group: 'مستند', url: 'https://ib.abntv.live/hls/gemnat.m3u8' },
  { name: 'جم پیکسل', logo: 'https://fatv.live/logo/2df4014453074538ad47ce4e75daf4ed-GEMPixel.jpg', group: 'فیلم و سریال', url: 'https://ib.abntv.live/hls/gempixel.m3u8' },
  // GEM Series + Series Plus were added 2026-11-27 and REMOVED the same
  // day: their only public stream (ca-rt.onetv.app, both slugs) is 403
  // from every datacenter egress tried AND did not play on the owner's
  // iPhone in Iran either — no alternative host exists (tvatlas,
  // teleora and babaktv all point to the same onetv URL). Do not re-add
  // until a different, working source is found.
  // Persiana via FATV — 200 + CORS * (play everywhere).
  { name: 'پرشیانا چین', logo: 'https://fatv.live/logo/persianaGeneral.png', group: 'سرگرمی', url: 'https://chinahls.persiana.live/hls/stream.m3u8' },
  { name: 'پرشیانا پادکست', logo: 'https://fatv.live/logo/persianaGeneral.png', group: 'موسیقی', url: 'https://podhls.persiana.live/hls/stream.m3u8' },
  { name: 'پرشیانا تین', logo: 'https://fatv.live/logo/persianaGeneral.png', group: 'سرگرمی', url: 'https://teenhls.persiana.live/hls/stream.m3u8' },
  { name: 'پرشیانا وویاژ', logo: 'https://fatv.live/logo/persianaGeneral.png', group: 'سرگرمی', url: 'https://voyhls.persiana.live/hls/stream.m3u8' },
  // Persiana Sports 1–4 (IR Only) — 403 from this VM, kept on the
  // Telewebion logic; phone test decides.
  { name: 'پرشیانا اسپورت ۱', logo: 'https://fatv.live/logo/7d640fde982a44138c2b19859698be55-PersianaSport.jpg', group: 'ورزشی', url: 'https://live.persianasports.net/hls/psports1.m3u8' },
  { name: 'پرشیانا اسپورت ۲', logo: 'https://fatv.live/logo/ed303222ce1f48bfa0b984b8314b66fd-PersianaSport.jpg', group: 'ورزشی', url: 'https://live.persianasports.net/hls/psports2.m3u8' },
  { name: 'پرشیانا اسپورت ۳', logo: 'https://fatv.live/logo/8bcf61c145ad406dabae8589afeb9e3c-PersianaSport.jpg', group: 'ورزشی', url: 'https://live.persianasports.net/hls/psports3.m3u8' },
  { name: 'پرشیانا اسپورت ۴', logo: 'https://fatv.live/logo/3320256d0ac147079d34f2e8ad48abdb-PersianaSport.jpg', group: 'ورزشی', url: 'https://live.persianasports.net/hls/psports4.m3u8' },
  // Persian-language satellite channels from the FATV directory
  // sweep (2026-11-26): all probed live, HTTP 200 + CORS *
  // (play everywhere). FATV names mapped to Persian where natural.
  { name: '316 TV', logo: 'https://fatv.live/logo/316.jpg', group: 'مذهبی', url: 'https://316hls.wns.live/hls/stream.m3u8' },
  { name: '4U Family', logo: 'https://fatv.live/logo/4ufamily.jpg', group: 'سرگرمی', url: 'https://familyhls.4utv.live/hls/stream.m3u8' },
  { name: 'ABN افغانستان', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'مذهبی', url: 'https://mediaserver.abnvideos.com/streams/abnafghanistan.m3u8' },
  { name: 'آلترناتیو شورایی', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'سیاسی', url: 'https://hlspackager.akamaized.net/live/DB/ALTERNATIVE_SHORAI_TV/HLS/ALTERNATIVE_SHORAI_TV.m3u8' },
  { name: 'چشمه عقاب', logo: 'https://fatv.live/logo/cheshme_oghab.jpg', group: 'تکنولوژی', url: 'https://choghls.wns.live/hls/stream.m3u8' },
  { name: 'داتیس', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'سرگرمی', url: 'https://dathls.wns.live/hls/stream.m3u8' },
  { name: 'درخت زندگی', logo: 'https://fatv.live/logo/derakhtezendego.jpg', group: 'مذهبی', url: 'https://derakhtzhls.wns.live/hls/stream.m3u8' },
  { name: 'دیدنی‌ها', logo: 'https://fatv.live/logo/didanihatv.jpg', group: 'سرگرمی', url: 'https://932y493eljv8-hls-live.5centscdn.com/did/a5a78758611d40a8beef13f803dd816b.sdp/playlist.m3u8' },
  { name: 'دیدگاه', logo: 'https://fatv.live/logo/didgahtv.jpg', group: 'سیاسی', url: 'https://media.streambrothers.com:1936/8276/8276/chunklist_w2130353529.m3u8' },
  { name: 'دنیا نو فراه', logo: 'https://fatv.live/logo/Dunya-naw-tv.jpg', group: 'عمومی', url: 'https://dunyanhls.wns.live/hls/stream.m3u8' },
  { name: 'اصلاح', logo: 'https://fatv.live/logo/eslahtv.jpg', group: 'عمومی', url: 'https://eslahtvhls.wns.live/hls/stream.m3u8' },
  { name: 'گنج حضور', logo: 'https://fatv.live/logo/ganjehozoor.png', group: 'سرگرمی', url: 'https://media.parvizshahbazi.com/ganjehozour/Main_tv/chunks.m3u8' },
  { name: 'گردآفرید', logo: 'https://fatv.live/logo/GordAfarid.jpg', group: 'سیاسی', url: 'https://gatvhls.wns.live/hls/stream.m3u8' },
  { name: 'ایمان', logo: 'https://fatv.live/logo/886d22336fa649b3829a71de1d1b37b7-imantvaf.jpg', group: 'مذهبی', url: 'https://afghantv.app/hls4/imantv/index.m3u8' },
  { name: 'ایران فیلم', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'سرگرمی', url: 'https://ifilmhls.wns.live/hls/stream.m3u8' },
  { name: 'ایران ایندیپندنت', logo: 'https://fatv.live/logo/IranIndep.jpg', group: 'سرگرمی', url: 'https://mediamtx.elitelatrade.com/live/stream/main_stream.m3u8' },
  { name: 'ایران اینترنشنال', logo: 'https://www.fatv.live/logo/iitv.jpg', group: 'خبر', url: 'https://hls.irantv.live/hls/stream.m3u8' },
  { name: 'ایران‌نما', logo: 'https://fatv.live/logo/irannama.jpg', group: 'سرگرمی', url: 'https://irnamahls.wns.live/hls/stream.m3u8' },
  { name: 'ایران ریپابلیک', logo: 'https://fatv.live/logo/IRRepublic.jpg', group: 'سیاسی', url: 'https://irrephls.wns.live/hls/stream.m3u8' },
  { name: 'ایران‌وایر', logo: 'https://fatv.live/logo/Iranwire_Logos_Square_-_White.png', group: 'خبر', url: 'https://irwhls.wns.live/hls/stream.m3u8' },
  { name: 'اسرائیل پارس', logo: 'https://fatv.live/logo/israelparstv.png', group: 'سرگرمی', url: 'https://live.pars-israel.com/tmp_hls/iptv/index.m3u8' },
  { name: 'خاطره', logo: 'https://fatv.live/logo/khaterehtv.jpg', group: 'سرگرمی', url: 'https://stream.khatereh.online/LiveApp/streams/jWF37YKCgZ0FSYTR86368797449.m3u8' },
  { name: 'موج', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'سرگرمی', url: 'https://mojhls.wns.live/hls/stream.m3u8' },
  { name: 'مردم', logo: 'https://fatv.live/logo/mardomtv.jpg', group: 'عمومی', url: 'https://hls.tamadon.live/hls/stream.m3u8' },
  { name: 'معلم', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'مذهبی', url: 'https://moallemhls.wns.live/hls/stream.m3u8' },
  { name: 'محبت', logo: 'https://fatv.live/logo/mohabat-logo-Sattelite.webp', group: 'مذهبی', url: 'https://mohabathls.wns.live/hls/stream.m3u8' },
  { name: 'مژده', logo: 'https://fatv.live/logo/7c9d41590c4047099e87d12f64967fa3-Mozhda.png', group: 'مذهبی', url: 'https://mozhdahls.wns.live/hls/stream.m3u8' },
  { name: 'نهاد آزادی', logo: 'https://fatv.live/logo/nahadeazadi.png', group: 'سیاسی', url: 'https://livestream.5centscdn.com/nahadeazadi/14a66ff6dca989d3a2eb0dc8cdb50892.sdp/chunks.m3u8' },
  { name: 'نوید', logo: 'https://fatv.live/logo/NavidTV.jpg', group: 'مذهبی', url: 'https://hls.navidtv.live/hls/stream.m3u8' },
  { name: 'نیما', logo: 'https://fatv.live/logo/2e80898bb2bf478ab865efbd4293acea-NimaTV.jpg', group: 'سرگرمی', url: 'https://nimatv.loclx.io/nimatv/index.m3u8' },
  { name: 'نور', logo: 'https://fatv.live/logo/8e8c81edf2244237be3175f051138216-nourtv.jpg', group: 'مذهبی', url: 'https://nourhls.wns.live/hls/stream.m3u8' },
  { name: 'امید دانا', logo: 'https://fatv.live/logo/OmidDana.jpeg', group: 'سیاسی', url: 'https://odhls.wns.live/hls/stream.m3u8' },
  { name: 'امید جاودان', logo: 'https://fatv.live/logo/omidejavdan.jpg', group: 'مذهبی', url: 'https://livestream.5centscdn.com/pwocchurchweb1/cebac1e921182acff008ab1222f0c916.sdp/chunks.m3u8' },
  { name: 'پیام افغان', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'عمومی', url: 'https://g5nl6xx5lpq6-hls-live.5centscdn.com/live1234/2621b29e501b445fabf227b086123b70.sdp/mono.m3u8' },
  { name: 'Project Leon', logo: 'https://fatv.live/logo/ProjectLeon.jpeg', group: 'سیاسی', url: 'https://pleonhls.wns.live/hls/stream.m3u8' },
  { name: 'پالس', logo: 'https://fatv.live/logo/pulsetv.jpeg', group: 'خبر', url: 'https://pulsehls.wns.live/hls/stream.m3u8' },
  { name: 'راوی', logo: 'https://fatv.live/logo/Ravitv.jpg', group: 'سرگرمی', url: 'https://hls.ravitv.com/hls/stream.m3u8' },
  { name: 'RTA افغانستان', logo: 'https://fatv.live/logo/RTA.jpg', group: 'عمومی', url: 'https://rta-tv.akamaized.net/live/SD/RTA-1/RTA/RTA-1.m3u8' },
  { name: 'RTA آموزش', logo: 'https://fatv.live/logo/RTA.jpg', group: 'عمومی', url: 'https://rta-tv.akamaized.net/live/SD/RTA-4/RTA/RTA-4.m3u8' },
  { name: 'RTA خبر', logo: 'https://fatv.live/logo/RTANews_400x400.jpg', group: 'عمومی', url: 'https://rta-tv.akamaized.net/live/SD/RTA-2/RTA/RTA-2.m3u8' },
  { name: 'RTA ورزش', logo: 'https://fatv.live/logo/RTANews_400x400.jpg', group: 'عمومی', url: 'https://rta-tv.akamaized.net/live/SD/RTA-3/RTA/RTA-3.m3u8' },
  { name: 'RTA جهانی', logo: 'https://fatv.live/logo/RTANews_400x400.jpg', group: 'عمومی', url: 'https://rta-tv.akamaized.net/live/SD/RTA-5/RTA/RTA-5.m3u8' },
  { name: 'رادیو فردا', logo: 'https://fatv.live/logo/radiofarda.png', group: 'خبر', url: 'https://rferl-ingest.akamaized.net/hls/live/2121768-b/tvmc01/playlist.m3u8' },
  { name: 'رادیو شمرون', logo: 'https://fatv.live/logo/WhatsApp_Image_2026-10-05_at_19.20.06.jpeg', group: 'سیاسی', url: 'https://rshemhls.wns.live/hls/stream.m3u8' },
  { name: 'صمد', logo: 'https://fatv.live/logo/tv-logo-design-flat-icon-vector.jpg', group: 'سیاسی', url: 'https://samadhls.wns.live/hls/stream.m3u8' },
  { name: 'ستاره', logo: 'https://fatv.live/logo/setare_logo_Gold.png', group: 'سرگرمی', url: 'https://setarehhls.wns.live/hls/stream.m3u8' },
  { name: 'Super Yacht TV', logo: 'https://fatv.live/logo/sytv.jpg', group: 'سرگرمی', url: 'https://sy.wns.live/hls/stream.m3u8' },
  { name: 'TBS TV', logo: 'https://fatv.live/logo/TBS.jpg', group: 'خبر', url: 'https://tbshls.wns.live/hls/stream.m3u8' },
  { name: 'تمدن', logo: 'https://fatv.live/logo/Tamadon.png', group: 'عمومی', url: 'https://hlst.tamadon.live/hls/stream.m3u8' },
  { name: 'طپش', logo: 'https://fatv.live/logo/Tapesh.jpg', group: 'سرگرمی', url: 'https://hls.tapeshtv.live/hls/stream.m3u8' },
  { name: 'Today TV', logo: 'https://fatv.live/logo/b6a9915f1b9f49999fc5499a99b1a24d-todaytv.png', group: 'سرگرمی', url: 'https://live.ontodaytv.com/hls/ontoday.m3u8' },
  // Same sweep, HTTP 200 but NO CORS header — iPhone native HLS
  // only (needs the canPlayType fix, live since 2026-11-26).
  { name: 'افغانستان اینترنشنال', logo: 'https://www.fatv.live/logo/afin.jpg', group: 'خبر', url: 'https://afintlbak.livetvstream.co.uk/aitv/chunklist_b1196000.m3u8' },
  { name: 'بی‌بی‌سی افغانستان', logo: 'https://fatv.live/logo/23a3378374034663bb415afe18f8d6f3-bbcafg.jpg', group: 'خبر', url: 'https://ib.abntv.live/hls/bbcafgfatv.m3u8' },
  { name: 'بی‌بی‌سی فارسی', logo: 'https://fatv.live/logo/9c5bdcdde5c74a9bb8a694245d9d08b1-bbcper.jpg', group: 'خبر', url: 'https://ib.abntv.live/hls/bbcperfatv.m3u8' },
  { name: 'خانه هنرمندان', logo: 'https://fatv.live/logo/khh.jpg', group: 'سرگرمی', url: 'https://ib.abntv.live/hls/khh.m3u8' },
  { name: 'پامیر', logo: 'https://fatv.live/logo/43a9a9f84ad94a72bfd54dff93d93c20-PamirTV.jpg', group: 'عمومی', url: 'https://ib.abntv.live/hls/pamirtv.m3u8' },
  // Deep sweep (2026-11-26): streamzhd + livefarsi + Quincunx
  // ir.m3u + iptv-org prd.m3u — all probed live, HTTP 200 + CORS *
  // (play everywhere). The gg.hls2.xyz family (Manoto, GEM TV
  // main, Tolo, ...) is 403/404 even via livefarsi's worker
  // proxy — dead, NOT added.
  { name: 'AMG', logo: 'https://www.livefarsi.com/uploads/tv_image/amg-tv.jpg', group: 'سرگرمی', url: 'https://streamer1.connectto.com/AMGA_WEB_1202/tracks-v1a1/mono.ts.m3u8' },
  { name: 'ATN اروپا', logo: 'https://www.livefarsi.com/uploads/tv_image/atn-europe-tv.jpg', group: 'سرگرمی', url: 'https://tgn.bozztv.com/eshgtv-dvrfl05/gin-ariana/tracks-v1a1/mono.m3u8' },
  { name: 'الولایه', logo: 'https://i.imgur.com/OI1HQv5.png', group: 'مذهبی', url: 'https://nl.livekadeh.com/hls2/alwilayah_tv.m3u8' },
  { name: 'آمو', logo: '', group: 'خبر', url: 'https://jmc-live.ercdn.net/amutv/amutv.m3u8' },
  { name: 'اصیل', logo: 'https://i.imgur.com/gROQqFD.png', group: 'عمومی', url: 'https://live.asil.tv/asiltv/index.m3u8' },
  { name: 'الصراط', logo: '', group: 'مذهبی', url: 'https://softverse.b-cdn.net/Assirat/assiratobs/playlist.m3u8' },
  { name: 'کلمه', logo: 'https://www.livefarsi.com/uploads/tv_image/kalemeh-tv.jpg', group: 'مذهبی', url: 'https://player.kalemeh.tv/live/ngrp:kalemeh_all/playlist.m3u8' },
  { name: 'کارون', logo: 'https://static.telewebion.com/channelsLogo/448a8dca-ab58-4533-8d71-ad74b8812c79/default', group: 'عمومی', url: 'https://ncdn.telewebion.ir/karoon/live/playlist.m3u8' },
  { name: 'پیوند', logo: 'https://www.livefarsi.com/uploads/tv_image/payvand-tv.jpg', group: 'عمومی', url: 'https://uni6rtmp.tulix.tv/ucur1/Payvand/tracks-v1a1/mono.m3u8' },
  { name: 'رسول‌الله', logo: '', group: 'مذهبی', url: 'https://avr.host247.net/live/rasoulallahtv/playlist.m3u8' },
  { name: 'شمس', logo: '', group: 'عمومی', url: 'https://fflive-darya-educationtv.b-cdn.net/master.m3u8' },
  { name: 'سهیل', logo: '', group: 'عمومی', url: 'https://iptv.sohailtv.com/sohail/playlist/index.m3u8' },
  { name: 'طرفداری', logo: '', group: 'ورزشی', url: 'https://cp11.adabmedia.com/hls2/bein1.m3u8' },
  { name: 'وایز هیومن', logo: '', group: 'عمومی', url: 'https://avr.host247.net/live/WiseHumanTv/playlist.m3u8' },
  // Same sweep, HTTP 200 but NO CORS — iPhone native HLS only.
  { name: 'نگاه', logo: 'https://www.livefarsi.com/uploads/tv_image/negah-tv.jpg', group: 'عمومی', url: 'https://hls.ashena.live/hls/stream.m3u8' },
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
    // The URL is the next non-empty, non-# line: some upstream entries
    // put #EXTVLCOPT lines between #EXTINF and the URL, and the old
    // code (lines[i+1] only) silently dropped those 826 channels.
    let url = '';
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next) continue;
      if (next.startsWith('#EXTINF:')) break;
      if (next.startsWith('#')) continue;
      url = next;
      break;
    }
    if (!url) continue;
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
  // Manual feeds (no playlist source, e.g. 'other') are curated, not
  // fetched: their rows must survive every refresh. Just refresh the
  // cache stamp so getFeedChannels doesn't retry on every open.
  if (def.manual || (!def.url && !def.sources)) {
    const count = await db.$count(channels, eq(channels.feed, feed));
    await db
      .insert(cacheMeta)
      .values({ key: 'feed:' + feed, value: String(count), updatedAt: now })
      .onConflictDoUpdate({
        target: cacheMeta.key,
        set: { value: String(count), updatedAt: now },
      })
      .run();
    return count;
  }
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
