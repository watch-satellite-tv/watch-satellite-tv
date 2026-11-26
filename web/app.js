// Watch Satellite TV — Mini App front-end.
// Talks to the bot only through Telegram.WebApp.Serverless.call()
// (endpoints: register, getChannels, getFavorites, toggleFavorite,
// reportBroken, setLanguage). Playback is direct from the phone to
// the origin CDN via hls.js (or native HLS on iOS Safari) — no proxy.
//
// i18n: the UI renders in the user's effective language (saved choice,
// else Telegram language_code, else 'fa') from the register endpoint.
// The header select switches it (setLanguage) and re-renders everything.

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

const I18N = {
  fa: {
    brandTitle: 'ماهواره زنده',
    brandSub: 'پخش زنده‌ی شبکه‌های ماهواره‌ای، بدون دیش',
    idleText: 'برای تماشا، یه شبکه رو انتخاب کن',
    reportBtn: 'پخش نمی‌شه؟ گزارش بده',
    statusPick: 'یه شبکه رو از لیست پایین انتخاب کن 👇',
    searchPh: 'جستجوی شبکه…',
    favChip: '⭐ علاقه‌مندی‌ها',
    fasLabel: '🇮🇷 ایران',
    loading: 'در حال بارگذاری شبکه‌ها…',
    refreshed: 'لیست شبکه‌ها به‌روز شد.',
    noChannels: 'شبکه‌ای پیدا نشد.',
    noFav: 'هنوز شبکه‌ای رو به علاقه‌مندی‌ها اضافه نکردی — روی ستاره‌ی کنار هر شبکه بزن.',
    favSaveFail: 'نتونستم علاقه‌مندی رو ذخیره کنم.',
    reportOk: 'ممنون — گزارشت ثبت شد، بررسی می‌کنیم.',
    reportFail: 'گزارش ثبت نشد — دوباره امتحان کن.',
    notInTelegram: 'این مینی‌اپ رو باید از داخل تلگرام باز کنی.',
    loadFail: 'خطا در بارگذاری شبکه‌ها — دوباره امتحان کن.',
    playing: 'در حال پخش…',
    nowPlaying: 'در حال پخش: ',
    playFail: 'پخش نشد — ممکنه این شبکه فعلاً در دسترس نباشه. یه شبکه‌ی دیگه رو امتحان کن.',
    playFailShort: 'پخش نشد — ممکنه این شبکه فعلاً در دسترس نباشه.',
    empty: 'چیزی پیدا نشد.',
    note: 'فقط شبکه‌هایی نشون داده می‌شن که مستقیم توی گوشی پخش می‌شن. اگه شبکه‌ای پخش نشد، دکمه‌ی «گزارش بده» رو بزن تا بررسی بشه.',
    favLabel: 'علاقه‌مندی',
  },
  en: {
    brandTitle: 'Watch Satellite TV',
    brandSub: 'Live satellite TV channels, no dish',
    idleText: 'Pick a channel to watch',
    reportBtn: 'Not playing? Report it',
    statusPick: 'Pick a channel from the list below 👇',
    searchPh: 'Search channels…',
    favChip: '⭐ Favorites',
    fasLabel: '🇮🇷 Iran',
    loading: 'Loading channels…',
    refreshed: 'Channel list updated.',
    noChannels: 'No channels found.',
    noFav: 'You haven’t added any favorites yet — tap the star next to a channel.',
    favSaveFail: 'Couldn’t save the favorite.',
    reportOk: 'Thanks — your report was saved, we’ll check it.',
    reportFail: 'Report wasn’t saved — try again.',
    notInTelegram: 'Open this Mini App from inside Telegram.',
    loadFail: 'Failed to load channels — try again.',
    playing: 'Playing…',
    nowPlaying: 'Now playing: ',
    playFail: 'Couldn’t play — this channel may be unavailable right now. Try another one.',
    playFailShort: 'Couldn’t play — this channel may be unavailable right now.',
    empty: 'Nothing found.',
    note: 'Only channels that play directly on your phone are shown. If a channel doesn’t play, tap “Report it” so we can check it.',
    favLabel: 'Favorite',
  },
  zh: {
    brandTitle: '卫星直播',
    brandSub: '卫星电视频道直播，无需卫星锅',
    idleText: '选择一个频道开始观看',
    reportBtn: '无法播放？请报告',
    statusPick: '从下方列表中选择一个频道 👇',
    searchPh: '搜索频道…',
    favChip: '⭐ 收藏',
    fasLabel: '🇮🇷 伊朗',
    loading: '正在加载频道…',
    refreshed: '频道列表已更新。',
    noChannels: '未找到频道。',
    noFav: '你还没有收藏任何频道——点击频道旁的星标即可收藏。',
    favSaveFail: '无法保存收藏。',
    reportOk: '谢谢——你的报告已保存，我们会核查。',
    reportFail: '报告保存失败——请重试。',
    notInTelegram: '请从 Telegram 内打开此小程序。',
    loadFail: '加载频道失败——请重试。',
    playing: '正在播放…',
    nowPlaying: '正在播放：',
    playFail: '无法播放——该频道目前可能不可用，请试试其他频道。',
    playFailShort: '无法播放——该频道目前可能不可用。',
    empty: '未找到内容。',
    note: '仅显示可在手机上直接播放的频道。如果某个频道无法播放，请点击“报告”，我们会核查。',
    favLabel: '收藏',
  },
  ar: {
    brandTitle: 'البث الفضائي المباشر',
    brandSub: 'قنوات فضائية مباشرة، بدون طبق',
    idleText: 'اختر قناة للمشاهدة',
    reportBtn: 'لا يعمل؟ أبلغ عنه',
    statusPick: 'اختر قناة من القائمة أدناه 👇',
    searchPh: 'ابحث عن قناة…',
    favChip: '⭐ المفضلة',
    fasLabel: '🇮🇷 إيران',
    loading: 'جارٍ تحميل القنوات…',
    refreshed: 'تم تحديث قائمة القنوات.',
    noChannels: 'لم يتم العثور على قنوات.',
    noFav: 'لم تضف أي قناة إلى المفضلة بعد — اضغط على النجمة بجانب أي قناة.',
    favSaveFail: 'تعذّر حفظ القناة في المفضلة.',
    reportOk: 'شكراً — تم حفظ بلاغك وسنراجعه.',
    reportFail: 'تعذّر حفظ البلاغ — حاول مجدداً.',
    notInTelegram: 'افتح هذا التطبيق المصغّر من داخل تيليجرام.',
    loadFail: 'تعذّر تحميل القنوات — حاول مجدداً.',
    playing: 'جارٍ التشغيل…',
    nowPlaying: 'يُعرض الآن: ',
    playFail: 'تعذّر التشغيل — قد تكون هذه القناة غير متاحة حالياً. جرّب قناة أخرى.',
    playFailShort: 'تعذّر التشغيل — قد تكون هذه القناة غير متاحة حالياً.',
    empty: 'لم يتم العثور على شيء.',
    note: 'تُعرض فقط القنوات التي تعمل مباشرة على هاتفك. إذا لم تعمل قناة، اضغط «أبلغ عنه» لنراجعها.',
    favLabel: 'مفضلة',
  },
  ru: {
    brandTitle: 'Спутниковое ТВ',
    brandSub: 'Спутниковые каналы в прямом эфире, без антенны',
    idleText: 'Выберите канал для просмотра',
    reportBtn: 'Не работает? Сообщить',
    statusPick: 'Выберите канал из списка ниже 👇',
    searchPh: 'Поиск каналов…',
    favChip: '⭐ Избранное',
    fasLabel: '🇮🇷 Иран',
    loading: 'Загрузка каналов…',
    refreshed: 'Список каналов обновлён.',
    noChannels: 'Каналы не найдены.',
    noFav: 'У вас пока нет избранного — нажмите на звезду рядом с каналом.',
    favSaveFail: 'Не удалось сохранить в избранное.',
    reportOk: 'Спасибо — жалоба сохранена, мы проверим.',
    reportFail: 'Не удалось отправить жалобу — попробуйте ещё раз.',
    notInTelegram: 'Откройте это мини-приложение из Telegram.',
    loadFail: 'Не удалось загрузить каналы — попробуйте ещё раз.',
    playing: 'Воспроизведение…',
    nowPlaying: 'Сейчас играет: ',
    playFail: 'Не удалось воспроизвести — канал может быть недоступен. Попробуйте другой.',
    playFailShort: 'Не удалось воспроизвести — канал может быть недоступен.',
    empty: 'Ничего не найдено.',
    note: 'Показаны только каналы, которые играют прямо на телефоне. Если канал не работает, нажмите «Сообщить», и мы проверим.',
    favLabel: 'В избранное',
  },
};

const RTL_LANGS = new Set(['fa', 'ar']);
const NUM_LOCALES = { fa: 'fa-IR', en: 'en-US', zh: 'zh-CN', ar: 'ar', ru: 'ru-RU' };

let lang = 'fa';

function S(key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.fa[key] || '';
}

function num(n) {
  return Number(n || 0).toLocaleString(NUM_LOCALES[lang] || 'fa-IR');
}

function countText(n) {
  const s = num(n);
  if (lang === 'en') return n === 1 ? '1 channel' : s + ' channels';
  if (lang === 'zh') return s + ' 个频道';
  if (lang === 'ar') {
    if (n === 1) return 'قناة واحدة';
    if (n === 2) return 'قناتان';
    if (n >= 3 && n <= 10) return s + ' قنوات';
    return s + ' قناة';
  }
  if (lang === 'ru') {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return s + ' канал';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return s + ' канала';
    return s + ' каналов';
  }
  return s + ' شبکه';
}

const video = document.getElementById('video');
const listEl = document.getElementById('list');
const chipsEl = document.getElementById('chips');
const searchEl = document.getElementById('search');
const statusEl = document.getElementById('status');
const countEl = document.getElementById('count');
const emptyEl = document.getElementById('empty');
const nowPlayingEl = document.getElementById('nowPlaying');
const npNameEl = document.getElementById('npName');
const npGroupEl = document.getElementById('npGroup');
const favBtn = document.getElementById('favBtn');
const reportBtn = document.getElementById('reportBtn');
const idleOverlay = document.getElementById('idleOverlay');
const langSelect = document.getElementById('langSelect');

let hls = null;
let feeds = [];
let currentFeed = 'fas';
let channels = [];
let favorites = new Set();
let currentChannel = null;
let query = '';

function call(name, input) {
  return new Promise((resolve, reject) => {
    if (!tg || !tg.Serverless || typeof tg.Serverless.call !== 'function') {
      reject(new Error('NOT_IN_TELEGRAM'));
      return;
    }
    tg.Serverless.call(name, input || {}, (err, result) => {
      if (err) reject(new Error(err.message || 'endpoint error'));
      else resolve(result);
    });
  });
}

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', !!isError);
}

function applyLang(l) {
  if (!I18N[l]) l = 'fa';
  lang = l;
  document.documentElement.lang = l;
  document.documentElement.dir = RTL_LANGS.has(l) ? 'rtl' : 'ltr';
  document.title = S('brandTitle');
  document.getElementById('brandTitle').textContent = S('brandTitle');
  document.getElementById('brandSub').textContent = S('brandSub');
  document.getElementById('idleText').textContent = S('idleText');
  reportBtn.textContent = S('reportBtn');
  searchEl.placeholder = S('searchPh');
  searchEl.setAttribute('aria-label', S('searchPh'));
  emptyEl.textContent = S('empty');
  document.getElementById('noteText').textContent = S('note');
  if (langSelect) langSelect.value = l;
  if (!currentChannel) setStatus(S('statusPick'));
  renderChips();
  renderList();
}

function renderChips() {
  chipsEl.innerHTML = '';
  const all = [{ key: 'fav', label: S('favChip') }].concat(feeds);
  all.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (currentFeed === f.key ? ' active' : '');
    b.textContent = f.label;
    b.addEventListener('click', () => {
      currentFeed = f.key;
      searchEl.value = '';
      query = '';
      renderChips();
      loadFeed();
    });
    chipsEl.appendChild(b);
  });
}

function filtered() {
  const q = query.trim().toLowerCase();
  if (!q) return channels;
  return channels.filter((c) => (c.name + ' ' + (c.group || '')).toLowerCase().includes(q));
}

function playIcon() {
  const s = document.createElement('span');
  s.className = 'item-play';
  s.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  return s;
}

function renderList() {
  const rows = filtered();
  listEl.innerHTML = '';
  emptyEl.hidden = rows.length !== 0;
  countEl.textContent = rows.length ? countText(rows.length) : '';
  rows.forEach((c) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item' + (currentChannel && currentChannel.id === c.id ? ' playing' : '');
    // Logo missing or broken -> orange play tile (no app-logo fallback).
    const logoEl = c.logo ? document.createElement('img') : playIcon();
    if (c.logo) {
      logoEl.className = 'item-logo';
      logoEl.alt = '';
      logoEl.loading = 'lazy';
      logoEl.src = c.logo;
      logoEl.onerror = () => { logoEl.replaceWith(playIcon()); };
    }
    const body = document.createElement('div');
    body.className = 'item-body';
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = c.name;
    const group = document.createElement('div');
    group.className = 'item-group';
    group.textContent = c.group || '';
    body.appendChild(name);
    body.appendChild(group);
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'item-star' + (favorites.has(c.id) ? '' : ' off');
    star.textContent = favorites.has(c.id) ? '★' : '☆';
    star.setAttribute('aria-label', S('favLabel'));
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFav(c);
    });
    btn.appendChild(logoEl);
    btn.appendChild(body);
    btn.appendChild(star);
    btn.addEventListener('click', () => play(c));
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function play(c) {
  currentChannel = c;
  nowPlayingEl.hidden = false;
  npNameEl.textContent = c.name;
  npGroupEl.textContent = c.group || '';
  favBtn.textContent = favorites.has(c.id) ? '★' : '☆';
  favBtn.classList.toggle('fav', favorites.has(c.id));
  idleOverlay.hidden = true;
  setStatus(S('playing'));
  renderList();
  if (hls) { hls.destroy(); hls = null; }
  const url = c.url;
  const isHls = url.toLowerCase().includes('.m3u8');
  if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
    // iOS Safari / WKWebView: native HLS needs NO CORS header, so
    // streams without Access-Control-Allow-Origin (e.g. GEM on
    // abntv.live) play here while hls.js would refuse them. Native
    // first on iOS; hls.js only where native HLS is unavailable.
    video.src = url;
    video.play().catch(() => { idleOverlay.hidden = false; setStatus(S('playFailShort'), true); });
  } else if (isHls && window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls({ maxBufferLength: 30 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    hls.on(window.Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) { idleOverlay.hidden = false; setStatus(S('playFail'), true); }
    });
  } else {
    video.src = url;
    video.play().catch(() => { idleOverlay.hidden = false; setStatus(S('playFailShort'), true); });
  }
  video.onplaying = () => setStatus(S('nowPlaying') + c.name);
  video.onerror = () => { idleOverlay.hidden = false; setStatus(S('playFail'), true); };
  document.getElementById('playerBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function toggleFav(c) {
  try {
    const res = await call('toggleFavorite', { channel_id: c.id });
    if (res.favorite) favorites.add(c.id); else favorites.delete(c.id);
    if (currentChannel && currentChannel.id === c.id) {
      favBtn.textContent = res.favorite ? '★' : '☆';
    }
    renderList();
  } catch (e) {
    setStatus(S('favSaveFail'), true);
  }
}

async function loadFavorites() {
  try {
    const res = await call('getFavorites', {});
    favorites = new Set((res.channels || []).map((c) => c.id));
  } catch (e) { favorites = new Set(); }
}

async function loadFeed() {
  setStatus(S('loading'));
  listEl.innerHTML = '';
  countEl.textContent = '';
  try {
    if (currentFeed === 'fav') {
      const res = await call('getFavorites', {});
      channels = res.channels || [];
      feeds = feeds.length ? feeds : [{ key: 'fas', label: S('fasLabel') }];
      setStatus(channels.length ? '' : S('noFav'));
      renderList();
      return;
    }
    const res = await call('getChannels', { feed: currentFeed });
    // The server is authoritative about the feed key: if the feed the
    // app had selected no longer exists (e.g. merged away), follow
    // what the server returned so the chips stay in sync.
    currentFeed = res.feed || currentFeed;
    feeds = res.feeds || feeds;
    channels = res.channels || [];
    renderChips();
    setStatus(res.refreshed ? S('refreshed') : (channels.length ? '' : S('noChannels')));
    renderList();
  } catch (e) {
    setStatus(e.message === 'NOT_IN_TELEGRAM' ? S('notInTelegram') : S('loadFail'), true);
  }
}

favBtn.addEventListener('click', () => { if (currentChannel) toggleFav(currentChannel); });
reportBtn.addEventListener('click', async () => {
  if (!currentChannel) return;
  try {
    await call('reportBroken', { channel_id: currentChannel.id, reason: 'playback failed' });
    setStatus(S('reportOk'));
  } catch (e) {
    setStatus(S('reportFail'), true);
  }
});
searchEl.addEventListener('input', () => { query = searchEl.value; renderList(); });
if (langSelect) {
  langSelect.addEventListener('change', async () => {
    const next = langSelect.value;
    const prev = lang;
    try {
      await call('setLanguage', { lang: next });
      applyLang(next);
      await loadFeed();
    } catch (e) {
      langSelect.value = prev;
      setStatus(S('loadFail'), true);
    }
  });
}

function telegramCodeLang() {
  const code = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
  if (!code) return null;
  const c = String(code).toLowerCase();
  if (c.startsWith('fa')) return 'fa';
  if (c.startsWith('en')) return 'en';
  if (c.startsWith('zh')) return 'zh';
  if (c.startsWith('ar')) return 'ar';
  if (c.startsWith('ru')) return 'ru';
  return null;
}

(async function init() {
  let initialLang = telegramCodeLang() || 'fa';
  try {
    const res = await call('register', {});
    if (res.lang) initialLang = res.lang;
  } catch (e) { /* register is best-effort here; loadFeed shows the real error */ }
  applyLang(initialLang);
  await loadFavorites();
  await loadFeed();
})();
