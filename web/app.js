// Watch Satellite TV — Mini App front-end.
// Talks to the bot only through Telegram.WebApp.Serverless.call()
// (endpoints: register, getChannels, getFavorites, toggleFavorite,
// reportBroken). Playback is direct from the phone to the origin CDN
// via hls.js (or native HLS on iOS Safari) — no proxy in v1.

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

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

function faNum(n) {
  return Number(n || 0).toLocaleString('fa-IR');
}

function renderChips() {
  chipsEl.innerHTML = '';
  const all = [{ key: 'fav', label: '⭐ علاقه‌مندی‌ها' }].concat(feeds);
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

function renderList() {
  const rows = filtered();
  listEl.innerHTML = '';
  emptyEl.hidden = rows.length !== 0;
  countEl.textContent = rows.length ? faNum(rows.length) + ' شبکه' : '';
  rows.forEach((c) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item' + (currentChannel && currentChannel.id === c.id ? ' playing' : '');
    const img = document.createElement('img');
    img.className = 'item-logo';
    img.alt = '';
    img.loading = 'lazy';
    img.src = c.logo || 'logo.webp';
    if (!c.logo) img.classList.add('fallback');
    img.onerror = () => { img.src = 'logo.webp'; img.classList.add('fallback'); };
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
    star.setAttribute('aria-label', 'علاقه‌مندی');
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFav(c);
    });
    btn.appendChild(img);
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
  setStatus('در حال پخش…');
  renderList();
  if (hls) { hls.destroy(); hls = null; }
  const url = c.url;
  const isHls = url.toLowerCase().includes('.m3u8');
  if (isHls && window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls({ maxBufferLength: 30 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    hls.on(window.Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) { idleOverlay.hidden = false; setStatus('پخش نشد — ممکنه این شبکه فعلاً در دسترس نباشه. یه شبکه‌ی دیگه رو امتحان کن.', true); }
    });
  } else {
    video.src = url;
    video.play().catch(() => { idleOverlay.hidden = false; setStatus('پخش نشد — ممکنه این شبکه فعلاً در دسترس نباشه.', true); });
  }
  video.onplaying = () => setStatus('در حال پخش: ' + c.name);
  video.onerror = () => { idleOverlay.hidden = false; setStatus('پخش نشد — ممکنه این شبکه فعلاً در دسترس نباشه. یه شبکه‌ی دیگه رو امتحان کن.', true); };
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
    setStatus('نتونستم علاقه‌مندی رو ذخیره کنم.', true);
  }
}

async function loadFavorites() {
  try {
    const res = await call('getFavorites', {});
    favorites = new Set((res.channels || []).map((c) => c.id));
  } catch (e) { favorites = new Set(); }
}

async function loadFeed() {
  setStatus('در حال بارگذاری شبکه‌ها…');
  listEl.innerHTML = '';
  countEl.textContent = '';
  try {
    if (currentFeed === 'fav') {
      const res = await call('getFavorites', {});
      channels = res.channels || [];
      feeds = feeds.length ? feeds : [{ key: 'fas', label: 'فارسی' }];
      setStatus(channels.length ? '' : 'هنوز شبکه‌ای رو به علاقه‌مندی‌ها اضافه نکردی — روی ستاره‌ی کنار هر شبکه بزن.');
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
    setStatus(res.refreshed ? 'لیست شبکه‌ها به‌روز شد.' : (channels.length ? '' : 'شبکه‌ای پیدا نشد.'));
    renderList();
  } catch (e) {
    setStatus(e.message === 'NOT_IN_TELEGRAM'
      ? 'این مینی‌اپ رو باید از داخل تلگرام باز کنی.'
      : 'خطا در بارگذاری شبکه‌ها — دوباره امتحان کن.', true);
  }
}

favBtn.addEventListener('click', () => { if (currentChannel) toggleFav(currentChannel); });
reportBtn.addEventListener('click', async () => {
  if (!currentChannel) return;
  try {
    await call('reportBroken', { channel_id: currentChannel.id, reason: 'playback failed' });
    setStatus('ممنون — گزارشت ثبت شد، بررسی می‌کنیم.');
  } catch (e) {
    setStatus('گزارش ثبت نشد — دوباره امتحان کن.', true);
  }
});
searchEl.addEventListener('input', () => { query = searchEl.value; renderList(); });

(async function init() {
  try { await call('register', {}); } catch (e) { /* register is best-effort here; loadFeed shows the real error */ }
  await loadFavorites();
  await loadFeed();
})();
