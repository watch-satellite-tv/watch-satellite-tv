// i18n for the bot + Mini App — 5 languages: fa, en, zh, ar, ru.
// A user's chosen language lives in users.language (NULL = not chosen
// yet). The effective language is the saved choice, else the Telegram
// language_code, else 'fa'. Admin strings stay Persian (owner-only).

export const LANGS = ['fa', 'en', 'zh', 'ar', 'ru'];
export const RTL_LANGS = new Set(['fa', 'ar']);

export const LANG_NAMES = {
  fa: 'فارسی',
  en: 'English',
  zh: '中文',
  ar: 'العربية',
  ru: 'Русский',
};

export const LANG_FLAGS = {
  fa: '🇮🇷',
  en: '🇬🇧',
  zh: '🇨🇳',
  ar: '🇸🇦',
  ru: '🇷🇺',
};

// Map a Telegram language_code ('fa', 'en', 'zh-hans', 'ar', 'ru', …)
// to one of LANGS, or null when it matches none of them.
export function normalizeLang(code) {
  if (!code) return null;
  const c = String(code).toLowerCase();
  if (c.startsWith('fa')) return 'fa';
  if (c.startsWith('en')) return 'en';
  if (c.startsWith('zh')) return 'zh';
  if (c.startsWith('ar')) return 'ar';
  if (c.startsWith('ru')) return 'ru';
  return null;
}

export function isLang(v) {
  return LANGS.includes(v);
}

export function effectiveLang(saved, telegramCode) {
  return isLang(saved) ? saved : normalizeLang(telegramCode) || 'fa';
}

// Feed labels, per language. Channel names/groups are proper names
// from the playlists and are NOT translated.
export const FEED_LABELS = {
  fas: { fa: 'فارسی', en: 'Persian', zh: '波斯语', ar: 'فارسية', ru: 'Персидский' },
  news: { fa: 'خبری', en: 'News', zh: '新闻', ar: 'أخبار', ru: 'Новости' },
  movies: { fa: 'فیلم', en: 'Movies', zh: '电影', ar: 'أفلام', ru: 'Фильмы' },
  sports: { fa: 'ورزشی', en: 'Sports', zh: '体育', ar: 'رياضة', ru: 'Спорт' },
  music: { fa: 'موسیقی', en: 'Music', zh: '音乐', ar: 'موسيقى', ru: 'Музыка' },
  entertainment: { fa: 'سرگرمی', en: 'Entertainment', zh: '娱乐', ar: 'ترفيه', ru: 'Развлечения' },
};

export function feedLabel(feed, lang) {
  const labels = FEED_LABELS[feed];
  return (labels && labels[lang]) || (labels && labels.fa) || feed;
}

// --- Bot strings ---

export const BOT_STRINGS = {
  pickPrompt: {
    fa: '🌐 زبان رو انتخاب کن:',
    en: '🌐 Choose your language:',
    zh: '🌐 请选择语言：',
    ar: '🌐 اختر لغتك:',
    ru: '🌐 Выберите язык:',
  },
  welcome: {
    fa: '📡 به «ماهواره زنده» خوش اومدی!\n\nپخش زنده‌ی شبکه‌های ماهواره‌ای، بدون دیش، با اینترنت — شبکه‌های فارسی و جهانی رو انتخاب کن و تماشا کن.',
    en: '📡 Welcome to Watch Satellite TV!\n\nLive satellite TV channels, no dish, over the internet — pick Persian and international channels and watch.',
    zh: '📡 欢迎使用卫星直播！\n\n无需卫星锅，通过互联网观看卫星电视频道直播——选择波斯语和国际频道，开始观看。',
    ar: '📡 أهلاً بك في «البث الفضائي المباشر»!\n\nقنوات تلفزيونية فضائية مباشرة، بدون طبق، عبر الإنترنت — اختر القنوات الفارسية والعالمية وشاهد.',
    ru: '📡 Добро пожаловать в «Спутниковое ТВ»!\n\nПрямой эфир спутниковых каналов без антенны, через интернет — выбирайте персидские и международные каналы и смотрите.',
  },
  openApp: {
    fa: '📺 باز کردن ماهواره زنده',
    en: '📺 Open Watch Satellite TV',
    zh: '📺 打开卫星直播',
    ar: '📺 فتح البث الفضائي',
    ru: '📺 Открыть спутниковое ТВ',
  },
  pointer: {
    fa: 'برای تماشای شبکه‌ها، مینی‌اپ رو باز کن 👇',
    en: 'Open the Mini App to watch channels 👇',
    zh: '打开小程序观看频道 👇',
    ar: 'افتح التطبيق المصغّر لمشاهدة القنوات 👇',
    ru: 'Откройте мини-приложение, чтобы смотреть каналы 👇',
  },
  langButton: {
    fa: '🌐 تغییر زبان',
    en: '🌐 Change language',
    zh: '🌐 切换语言',
    ar: '🌐 تغيير اللغة',
    ru: '🌐 Сменить язык',
  },
  langSet: {
    fa: '✅ زبان روی فارسی تنظیم شد.',
    en: '✅ Language set to English.',
    zh: '✅ 语言已设为中文。',
    ar: '✅ تم تعيين اللغة إلى العربية.',
    ru: '✅ Язык установлен: русский.',
  },
};

export function t(key, lang) {
  const table = BOT_STRINGS[key];
  if (!table) return '';
  return table[lang] || table.fa;
}

// Mini App URL — live since the first deploy (2026-11-25).
export const MINI_APP_URL = 'https://app9110256990.tgcloud.ai/';

// The language picker: one button per language, in its own name.
export function languagePickerKeyboard() {
  const rows = [];
  for (let i = 0; i < LANGS.length; i += 2) {
    rows.push(
      LANGS.slice(i, i + 2).map((l) => ({
        text: `${LANG_FLAGS[l]} ${LANG_NAMES[l]}`,
        callback_data: 'lang:' + l,
      })),
    );
  }
  return { inline_keyboard: rows };
}

// Welcome message buttons: open the Mini App + change language.
export function welcomeKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t('openApp', lang), web_app: { url: MINI_APP_URL } }],
      [{ text: t('langButton', lang), callback_data: 'lang:pick' }],
    ],
  };
}
