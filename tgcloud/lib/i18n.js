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
// from the playlists and are NOT translated. The Persian feed is the
// Iran feed — first chip, labelled with the flag in every language.
export const FEED_LABELS = {
  fas: { fa: '🇮🇷 ایران', en: '🇮🇷 Iran', zh: '🇮🇷 伊朗', ar: '🇮🇷 إيران', ru: '🇮🇷 Иран' },
  us: { fa: '🇺🇸 آمریکا', en: '🇺🇸 USA', zh: '🇺🇸 美国', ar: '🇺🇸 أمريكا', ru: '🇺🇸 США' },
  tr: { fa: '🇹🇷 ترکیه', en: '🇹🇷 Türkiye', zh: '🇹🇷 土耳其', ar: '🇹🇷 تركيا', ru: '🇹🇷 Турция' },
  sa: { fa: '🇸🇦 عربستان', en: '🇸🇦 Saudi Arabia', zh: '🇸🇦 沙特阿拉伯', ar: '🇸🇦 السعودية', ru: '🇸🇦 Саудовская Аравия' },
  ae: { fa: '🇦🇪 امارات', en: '🇦🇪 UAE', zh: '🇦🇪 阿联酋', ar: '🇦🇪 الإمارات', ru: '🇦🇪 ОАЭ' },
  de: { fa: '🇩🇪 آلمان', en: '🇩🇪 Germany', zh: '🇩🇪 德国', ar: '🇩🇪 ألمانيا', ru: '🇩🇪 Германия' },
  fr: { fa: '🇫🇷 فرانسه', en: '🇫🇷 France', zh: '🇫🇷 法国', ar: '🇫🇷 فرنسا', ru: '🇫🇷 Франция' },
  ru: { fa: '🇷🇺 روسیه', en: '🇷🇺 Russia', zh: '🇷🇺 俄罗斯', ar: '🇷🇺 روسيا', ru: '🇷🇺 Россия' },
  cn: { fa: '🇨🇳 چین', en: '🇨🇳 China', zh: '🇨🇳 中国', ar: '🇨🇳 الصين', ru: '🇨🇳 Китай' },
  in: { fa: '🇮🇳 هند', en: '🇮🇳 India', zh: '🇮🇳 印度', ar: '🇮🇳 الهند', ru: '🇮🇳 Индия' },
  af: { fa: '🇦🇫 افغانستان', en: '🇦🇫 Afghanistan', zh: '🇦🇫 阿富汗', ar: '🇦🇫 أفغانستان', ru: '🇦🇫 Афганистан' },
  iq: { fa: '🇮🇶 عراق', en: '🇮🇶 Iraq', zh: '🇮🇶 伊拉克', ar: '🇮🇶 العراق', ru: '🇮🇶 Ирак' },
  az: { fa: '🇦🇿 آذربایجان', en: '🇦🇿 Azerbaijan', zh: '🇦🇿 阿塞拜疆', ar: '🇦🇿 أذربيجان', ru: '🇦🇿 Азербайджан' },
  aw: { fa: '🇦🇼 آروبا', en: '🇦🇼 Aruba', zh: '🇦🇼 阿鲁巴', ar: '🇦🇼 أروبا', ru: '🇦🇼 Аруба' },
  ar: { fa: '🇦🇷 آرژانتین', en: '🇦🇷 Argentina', zh: '🇦🇷 阿根廷', ar: '🇦🇷 الأرجنتين', ru: '🇦🇷 Аргентина' },
  za: { fa: '🇿🇦 آفریقای جنوبی', en: '🇿🇦 South Africa', zh: '🇿🇦 南非', ar: '🇿🇦 جنوب أفريقيا', ru: '🇿🇦 ЮАР' },
  al: { fa: '🇦🇱 آلبانی', en: '🇦🇱 Albania', zh: '🇦🇱 阿尔巴尼亚', ar: '🇦🇱 ألبانيا', ru: '🇦🇱 Албания' },
  ag: { fa: '🇦🇬 آنتیگوا و باربودا', en: '🇦🇬 Antigua and Barbuda', zh: '🇦🇬 安提瓜和巴布达', ar: '🇦🇬 أنتيغوا وباربودا', ru: '🇦🇬 Антигуа и Барбуда' },
  ad: { fa: '🇦🇩 آندورا', en: '🇦🇩 Andorra', zh: '🇦🇩 安道尔', ar: '🇦🇩 أندورا', ru: '🇦🇩 Андорра' },
  ao: { fa: '🇦🇴 آنگولا', en: '🇦🇴 Angola', zh: '🇦🇴 安哥拉', ar: '🇦🇴 أنغولا', ru: '🇦🇴 Ангола' },
  at: { fa: '🇦🇹 اتریش', en: '🇦🇹 Austria', zh: '🇦🇹 奥地利', ar: '🇦🇹 النمسا', ru: '🇦🇹 Австрия' },
  et: { fa: '🇪🇹 اتیوپی', en: '🇪🇹 Ethiopia', zh: '🇪🇹 埃塞俄比亚', ar: '🇪🇹 إثيوبيا', ru: '🇪🇹 Эфиопия' },
  jo: { fa: '🇯🇴 اردن', en: '🇯🇴 Jordan', zh: '🇯🇴 约旦', ar: '🇯🇴 الأردن', ru: '🇯🇴 Иордания' },
  am: { fa: '🇦🇲 ارمنستان', en: '🇦🇲 Armenia', zh: '🇦🇲 亚美尼亚', ar: '🇦🇲 أرمينيا', ru: '🇦🇲 Армения' },
  uy: { fa: '🇺🇾 اروگوئه', en: '🇺🇾 Uruguay', zh: '🇺🇾 乌拉圭', ar: '🇺🇾 الأوروغواي', ru: '🇺🇾 Уругвай' },
  er: { fa: '🇪🇷 اریتره', en: '🇪🇷 Eritrea', zh: '🇪🇷 厄立特里亚', ar: '🇪🇷 إريتريا', ru: '🇪🇷 Эритрея' },
  uz: { fa: '🇺🇿 ازبکستان', en: '🇺🇿 Uzbekistan', zh: '🇺🇿 乌兹别克斯坦', ar: '🇺🇿 أوزبكستان', ru: '🇺🇿 Узбекистан' },
  au: { fa: '🇦🇺 استرالیا', en: '🇦🇺 Australia', zh: '🇦🇺 澳大利亚', ar: '🇦🇺 أستراليا', ru: '🇦🇺 Австралия' },
  ee: { fa: '🇪🇪 استونی', en: '🇪🇪 Estonia', zh: '🇪🇪 爱沙尼亚', ar: '🇪🇪 إستونيا', ru: '🇪🇪 Эстония' },
  il: { fa: '🇮🇱 اسرائیل', en: '🇮🇱 Israel', zh: '🇮🇱 以色列', ar: '🇮🇱 إسرائيل', ru: '🇮🇱 Израиль' },
  sk: { fa: '🇸🇰 اسلواکی', en: '🇸🇰 Slovakia', zh: '🇸🇰 斯洛伐克', ar: '🇸🇰 سلوفاكيا', ru: '🇸🇰 Словакия' },
  si: { fa: '🇸🇮 اسلوونی', en: '🇸🇮 Slovenia', zh: '🇸🇮 斯洛文尼亚', ar: '🇸🇮 سلوفينيا', ru: '🇸🇮 Словения' },
  es: { fa: '🇪🇸 اسپانیا', en: '🇪🇸 Spain', zh: '🇪🇸 西班牙', ar: '🇪🇸 إسبانيا', ru: '🇪🇸 Испания' },
  dz: { fa: '🇩🇿 الجزایر', en: '🇩🇿 Algeria', zh: '🇩🇿 阿尔及利亚', ar: '🇩🇿 الجزائر', ru: '🇩🇿 Алжир' },
  sv: { fa: '🇸🇻 السالوادور', en: '🇸🇻 El Salvador', zh: '🇸🇻 萨尔瓦多', ar: '🇸🇻 السلفادور', ru: '🇸🇻 Сальвадор' },
  id: { fa: '🇮🇩 اندونزی', en: '🇮🇩 Indonesia', zh: '🇮🇩 印度尼西亚', ar: '🇮🇩 إندونيسيا', ru: '🇮🇩 Индонезия' },
  uk: { fa: '🇬🇧 انگلیس', en: '🇬🇧 United Kingdom', zh: '🇬🇧 英国', ar: '🇬🇧 بريطانيا', ru: '🇬🇧 Великобритания' },
  ua: { fa: '🇺🇦 اوکراین', en: '🇺🇦 Ukraine', zh: '🇺🇦 乌克兰', ar: '🇺🇦 أوكرانيا', ru: '🇺🇦 Украина' },
  ug: { fa: '🇺🇬 اوگاندا', en: '🇺🇬 Uganda', zh: '🇺🇬 乌干达', ar: '🇺🇬 أوغندا', ru: '🇺🇬 Уганда' },
  ec: { fa: '🇪🇨 اکوادور', en: '🇪🇨 Ecuador', zh: '🇪🇨 厄瓜多尔', ar: '🇪🇨 الإكوادور', ru: '🇪🇨 Эквадор' },
  it: { fa: '🇮🇹 ایتالیا', en: '🇮🇹 Italy', zh: '🇮🇹 意大利', ar: '🇮🇹 إيطاليا', ru: '🇮🇹 Италия' },
  ie: { fa: '🇮🇪 ایرلند', en: '🇮🇪 Ireland', zh: '🇮🇪 爱尔兰', ar: '🇮🇪 أيرلندا', ru: '🇮🇪 Ирландия' },
  is: { fa: '🇮🇸 ایسلند', en: '🇮🇸 Iceland', zh: '🇮🇸 冰岛', ar: '🇮🇸 آيسلندا', ru: '🇮🇸 Исландия' },
  bb: { fa: '🇧🇧 باربادوس', en: '🇧🇧 Barbados', zh: '🇧🇧 巴巴多斯', ar: '🇧🇧 باربادوس', ru: '🇧🇧 Барбадос' },
  bs: { fa: '🇧🇸 باهاما', en: '🇧🇸 Bahamas', zh: '🇧🇸 巴哈马', ar: '🇧🇸 جزر البهاما', ru: '🇧🇸 Багамы' },
  bh: { fa: '🇧🇭 بحرین', en: '🇧🇭 Bahrain', zh: '🇧🇭 巴林', ar: '🇧🇭 البحرين', ru: '🇧🇭 Бахрейн' },
  br: { fa: '🇧🇷 برزیل', en: '🇧🇷 Brazil', zh: '🇧🇷 巴西', ar: '🇧🇷 البرازيل', ru: '🇧🇷 Бразилия' },
  bn: { fa: '🇧🇳 برونئی', en: '🇧🇳 Brunei', zh: '🇧🇳 文莱', ar: '🇧🇳 بروناي', ru: '🇧🇳 Бруней' },
  by: { fa: '🇧🇾 بلاروس', en: '🇧🇾 Belarus', zh: '🇧🇾 白俄罗斯', ar: '🇧🇾 بيلاروس', ru: '🇧🇾 Беларусь' },
  bg: { fa: '🇧🇬 بلغارستان', en: '🇧🇬 Bulgaria', zh: '🇧🇬 保加利亚', ar: '🇧🇬 بلغاريا', ru: '🇧🇬 Болгария' },
  be: { fa: '🇧🇪 بلژیک', en: '🇧🇪 Belgium', zh: '🇧🇪 比利时', ar: '🇧🇪 بلجيكا', ru: '🇧🇪 Бельгия' },
  bz: { fa: '🇧🇿 بلیز', en: '🇧🇿 Belize', zh: '🇧🇿 伯利兹', ar: '🇧🇿 بليز', ru: '🇧🇿 Белиз' },
  bd: { fa: '🇧🇩 بنگلادش', en: '🇧🇩 Bangladesh', zh: '🇧🇩 孟加拉国', ar: '🇧🇩 بنغلاديش', ru: '🇧🇩 Бангладеш' },
  bj: { fa: '🇧🇯 بنین', en: '🇧🇯 Benin', zh: '🇧🇯 贝宁', ar: '🇧🇯 بنين', ru: '🇧🇯 Бенин' },
  bi: { fa: '🇧🇮 بوروندی', en: '🇧🇮 Burundi', zh: '🇧🇮 布隆迪', ar: '🇧🇮 بوروندي', ru: '🇧🇮 Бурунди' },
  bf: { fa: '🇧🇫 بورکینافاسو', en: '🇧🇫 Burkina Faso', zh: '🇧🇫 布基纳法索', ar: '🇧🇫 بوركينا فاسو', ru: '🇧🇫 Буркина-Фасо' },
  ba: { fa: '🇧🇦 بوسنی و هرزگوین', en: '🇧🇦 Bosnia and Herzegovina', zh: '🇧🇦 波斯尼亚和黑塞哥维那', ar: '🇧🇦 البوسنة والهرسك', ru: '🇧🇦 Босния и Герцеговина' },
  bo: { fa: '🇧🇴 بولیوی', en: '🇧🇴 Bolivia', zh: '🇧🇴 玻利维亚', ar: '🇧🇴 بوليفيا', ru: '🇧🇴 Боливия' },
  bq: { fa: '🇧🇶 بونیر', en: '🇧🇶 Bonaire', zh: '🇧🇶 博内尔', ar: '🇧🇶 بونير', ru: '🇧🇶 Бонэйр' },
  tj: { fa: '🇹🇯 تاجیکستان', en: '🇹🇯 Tajikistan', zh: '🇹🇯 塔吉克斯坦', ar: '🇹🇯 طاجيكستان', ru: '🇹🇯 Таджикистан' },
  tz: { fa: '🇹🇿 تانزانیا', en: '🇹🇿 Tanzania', zh: '🇹🇿 坦桑尼亚', ar: '🇹🇿 تنزانيا', ru: '🇹🇿 Танзания' },
  th: { fa: '🇹🇭 تایلند', en: '🇹🇭 Thailand', zh: '🇹🇭 泰国', ar: '🇹🇭 تايلاند', ru: '🇹🇭 Таиланд' },
  tw: { fa: '🇹🇼 تایوان', en: '🇹🇼 Taiwan', zh: '🇹🇼 台湾', ar: '🇹🇼 تايوان', ru: '🇹🇼 Тайвань' },
  tm: { fa: '🇹🇲 ترکمنستان', en: '🇹🇲 Turkmenistan', zh: '🇹🇲 土库曼斯坦', ar: '🇹🇲 تركمانستان', ru: '🇹🇲 Туркмения' },
  tt: { fa: '🇹🇹 ترینیداد و توباگو', en: '🇹🇹 Trinidad and Tobago', zh: '🇹🇹 特立尼达和多巴哥', ar: '🇹🇹 ترينيداد وتوباغو', ru: '🇹🇹 Тринидад и Тобаго' },
  tn: { fa: '🇹🇳 تونس', en: '🇹🇳 Tunisia', zh: '🇹🇳 突尼斯', ar: '🇹🇳 تونس', ru: '🇹🇳 Тунис' },
  tg: { fa: '🇹🇬 توگو', en: '🇹🇬 Togo', zh: '🇹🇬 多哥', ar: '🇹🇬 توغو', ru: '🇹🇬 Того' },
  jm: { fa: '🇯🇲 جامائیکا', en: '🇯🇲 Jamaica', zh: '🇯🇲 牙买加', ar: '🇯🇲 جامايكا', ru: '🇯🇲 Ямайка' },
  vg: { fa: '🇻🇬 جزایر ویرجین بریتانیا', en: '🇻🇬 British Virgin Islands', zh: '🇻🇬 英属维尔京群岛', ar: '🇻🇬 جزر فيرجن البريطانية', ru: '🇻🇬 Британские Виргинские острова' },
  do: { fa: '🇩🇴 جمهوری دومینیکن', en: '🇩🇴 Dominican Republic', zh: '🇩🇴 多米尼加', ar: '🇩🇴 جمهورية الدومينيكان', ru: '🇩🇴 Доминиканская Республика' },
  dk: { fa: '🇩🇰 دانمارک', en: '🇩🇰 Denmark', zh: '🇩🇰 丹麦', ar: '🇩🇰 الدنمارك', ru: '🇩🇰 Дания' },
  re: { fa: '🇷🇪 رئونیون', en: '🇷🇪 Reunion', zh: '🇷🇪 留尼汪', ar: '🇷🇪 ريونيون', ru: '🇷🇪 Реюньон' },
  rw: { fa: '🇷🇼 رواندا', en: '🇷🇼 Rwanda', zh: '🇷🇼 卢旺达', ar: '🇷🇼 رواندا', ru: '🇷🇼 Руанда' },
  ro: { fa: '🇷🇴 رومانی', en: '🇷🇴 Romania', zh: '🇷🇴 罗马尼亚', ar: '🇷🇴 رومانيا', ru: '🇷🇴 Румыния' },
  zw: { fa: '🇿🇼 زیمبابوه', en: '🇿🇼 Zimbabwe', zh: '🇿🇼 津巴布韦', ar: '🇿🇼 زيمبابوي', ru: '🇿🇼 Зимбабве' },
  ci: { fa: '🇨🇮 ساحل عاج', en: '🇨🇮 Ivory Coast', zh: '🇨🇮 科特迪瓦', ar: '🇨🇮 ساحل العاج', ru: '🇨🇮 Кот-д’Ивуар' },
  ws: { fa: '🇼🇸 ساموآ', en: '🇼🇸 Samoa', zh: '🇼🇸 萨摩亚', ar: '🇼🇸 ساموا', ru: '🇼🇸 Самоа' },
  other: { fa: '🌍 سایر', en: '🌍 Other', zh: '🌍 其他', ar: '🌍 أخرى', ru: '🌍 Другие' },
  lk: { fa: '🇱🇰 سری‌لانکا', en: '🇱🇰 Sri Lanka', zh: '🇱🇰 斯里兰卡', ar: '🇱🇰 سريلانكا', ru: '🇱🇰 Шри-Ланка' },
  sm: { fa: '🇸🇲 سن مارینو', en: '🇸🇲 San Marino', zh: '🇸🇲 圣马力诺', ar: '🇸🇲 سان مارينو', ru: '🇸🇲 Сан-Марино' },
  lc: { fa: '🇱🇨 سنت لوسیا', en: '🇱🇨 Saint Lucia', zh: '🇱🇨 圣卢西亚', ar: '🇱🇨 سانت لوسيا', ru: '🇱🇨 Сент-Люсия' },
  sx: { fa: '🇸🇽 سنت مارتن', en: '🇸🇽 Sint Maarten', zh: '🇸🇽 圣马丁', ar: '🇸🇽 سينت مارتن', ru: '🇸🇽 Синт-Мартен' },
  vc: { fa: '🇻🇨 سنت وینسنت و گرنادین‌ها', en: '🇻🇨 Saint Vincent and the Grenadines', zh: '🇻🇨 圣文森特和格林纳丁斯', ar: '🇻🇨 سانت فنسنت والغرينادين', ru: '🇻🇨 Сент-Винсент и Гренадины' },
  kn: { fa: '🇰🇳 سنت کیتس و نویس', en: '🇰🇳 Saint Kitts and Nevis', zh: '🇰🇳 圣基茨和尼维斯', ar: '🇰🇳 سانت كيتس ونيفيس', ru: '🇰🇳 Сент-Китс и Невис' },
  sn: { fa: '🇸🇳 سنگال', en: '🇸🇳 Senegal', zh: '🇸🇳 塞内加尔', ar: '🇸🇳 السنغال', ru: '🇸🇳 Сенегал' },
  sg: { fa: '🇸🇬 سنگاپور', en: '🇸🇬 Singapore', zh: '🇸🇬 新加坡', ar: '🇸🇬 سنغافورة', ru: '🇸🇬 Сингапур' },
  se: { fa: '🇸🇪 سوئد', en: '🇸🇪 Sweden', zh: '🇸🇪 瑞典', ar: '🇸🇪 السويد', ru: '🇸🇪 Швеция' },
  ch: { fa: '🇨🇭 سوئیس', en: '🇨🇭 Switzerland', zh: '🇨🇭 瑞士', ar: '🇨🇭 سويسرا', ru: '🇨🇭 Швейцария' },
  sd: { fa: '🇸🇩 سودان', en: '🇸🇩 Sudan', zh: '🇸🇩 苏丹', ar: '🇸🇩 السودان', ru: '🇸🇩 Судан' },
  sr: { fa: '🇸🇷 سورینام', en: '🇸🇷 Suriname', zh: '🇸🇷 苏里南', ar: '🇸🇷 سورينام', ru: '🇸🇷 Суринам' },
  sy: { fa: '🇸🇾 سوریه', en: '🇸🇾 Syria', zh: '🇸🇾 叙利亚', ar: '🇸🇾 سوريا', ru: '🇸🇾 Сирия' },
  so: { fa: '🇸🇴 سومالی', en: '🇸🇴 Somalia', zh: '🇸🇴 索马里', ar: '🇸🇴 الصومال', ru: '🇸🇴 Сомали' },
  sl: { fa: '🇸🇱 سیرالئون', en: '🇸🇱 Sierra Leone', zh: '🇸🇱 塞拉利昂', ar: '🇸🇱 سيراليون', ru: '🇸🇱 Сьерра-Леоне' },
  cl: { fa: '🇨🇱 شیلی', en: '🇨🇱 Chile', zh: '🇨🇱 智利', ar: '🇨🇱 تشيلي', ru: '🇨🇱 Чили' },
  eh: { fa: '🇪🇭 صحرای غربی', en: '🇪🇭 Western Sahara', zh: '🇪🇭 西撒哈拉', ar: '🇪🇭 الصحراء الغربية', ru: '🇪🇭 Западная Сахара' },
  rs: { fa: '🇷🇸 صربستان', en: '🇷🇸 Serbia', zh: '🇷🇸 塞尔维亚', ar: '🇷🇸 صربيا', ru: '🇷🇸 Сербия' },
  om: { fa: '🇴🇲 عمان', en: '🇴🇲 Oman', zh: '🇴🇲 阿曼', ar: '🇴🇲 عُمان', ru: '🇴🇲 Оман' },
  gh: { fa: '🇬🇭 غنا', en: '🇬🇭 Ghana', zh: '🇬🇭 加纳', ar: '🇬🇭 غانا', ru: '🇬🇭 Гана' },
  ps: { fa: '🇵🇸 فلسطین', en: '🇵🇸 Palestine', zh: '🇵🇸 巴勒斯坦', ar: '🇵🇸 فلسطين', ru: '🇵🇸 Палестина' },
  fi: { fa: '🇫🇮 فنلاند', en: '🇫🇮 Finland', zh: '🇫🇮 芬兰', ar: '🇫🇮 فنلندا', ru: '🇫🇮 Финляндия' },
  fj: { fa: '🇫🇯 فیجی', en: '🇫🇯 Fiji', zh: '🇫🇯 斐济', ar: '🇫🇯 فيجي', ru: '🇫🇯 Фиджи' },
  ph: { fa: '🇵🇭 فیلیپین', en: '🇵🇭 Philippines', zh: '🇵🇭 菲律宾', ar: '🇵🇭 الفلبين', ru: '🇵🇭 Филиппины' },
  cy: { fa: '🇨🇾 قبرس', en: '🇨🇾 Cyprus', zh: '🇨🇾 塞浦路斯', ar: '🇨🇾 قبرص', ru: '🇨🇾 Кипр' },
  kg: { fa: '🇰🇬 قرقیزستان', en: '🇰🇬 Kyrgyzstan', zh: '🇰🇬 吉尔吉斯斯坦', ar: '🇰🇬 قيرغيزستان', ru: '🇰🇬 Киргизия' },
  kz: { fa: '🇰🇿 قزاقستان', en: '🇰🇿 Kazakhstan', zh: '🇰🇿 哈萨克斯坦', ar: '🇰🇿 كازاخستان', ru: '🇰🇿 Казахстан' },
  qa: { fa: '🇶🇦 قطر', en: '🇶🇦 Qatar', zh: '🇶🇦 卡塔尔', ar: '🇶🇦 قطر', ru: '🇶🇦 Катар' },
  la: { fa: '🇱🇦 لائوس', en: '🇱🇦 Laos', zh: '🇱🇦 老挝', ar: '🇱🇦 لاوس', ru: '🇱🇦 Лаос' },
  lb: { fa: '🇱🇧 لبنان', en: '🇱🇧 Lebanon', zh: '🇱🇧 黎巴嫩', ar: '🇱🇧 لبنان', ru: '🇱🇧 Ливан' },
  lv: { fa: '🇱🇻 لتونی', en: '🇱🇻 Latvia', zh: '🇱🇻 拉脱维亚', ar: '🇱🇻 لاتفيا', ru: '🇱🇻 Латвия' },
  pl: { fa: '🇵🇱 لهستان', en: '🇵🇱 Poland', zh: '🇵🇱 波兰', ar: '🇵🇱 بولندا', ru: '🇵🇱 Польша' },
  lu: { fa: '🇱🇺 لوکزامبورگ', en: '🇱🇺 Luxembourg', zh: '🇱🇺 卢森堡', ar: '🇱🇺 لوكسمبورغ', ru: '🇱🇺 Люксембург' },
  ly: { fa: '🇱🇾 لیبی', en: '🇱🇾 Libya', zh: '🇱🇾 利比亚', ar: '🇱🇾 ليبيا', ru: '🇱🇾 Ливия' },
  lt: { fa: '🇱🇹 لیتوانی', en: '🇱🇹 Lithuania', zh: '🇱🇹 立陶宛', ar: '🇱🇹 ليتوانيا', ru: '🇱🇹 Литва' },
  li: { fa: '🇱🇮 لیختن‌اشتاین', en: '🇱🇮 Liechtenstein', zh: '🇱🇮 列支敦士登', ar: '🇱🇮 ليختنشتاين', ru: '🇱🇮 Лихтенштейн' },
  mg: { fa: '🇲🇬 ماداگاسکار', en: '🇲🇬 Madagascar', zh: '🇲🇬 马达加斯加', ar: '🇲🇬 مدغشقر', ru: '🇲🇬 Мадагаскар' },
  mq: { fa: '🇲🇶 مارتینیک', en: '🇲🇶 Martinique', zh: '🇲🇶 马提尼克', ar: '🇲🇶 مارتينيك', ru: '🇲🇶 Мартиника' },
  mt: { fa: '🇲🇹 مالت', en: '🇲🇹 Malta', zh: '🇲🇹 马耳他', ar: '🇲🇹 مالطا', ru: '🇲🇹 Мальта' },
  mv: { fa: '🇲🇻 مالدیو', en: '🇲🇻 Maldives', zh: '🇲🇻 马尔代夫', ar: '🇲🇻 المالديف', ru: '🇲🇻 Мальдивы' },
  my: { fa: '🇲🇾 مالزی', en: '🇲🇾 Malaysia', zh: '🇲🇾 马来西亚', ar: '🇲🇾 ماليزيا', ru: '🇲🇾 Малайзия' },
  ml: { fa: '🇲🇱 مالی', en: '🇲🇱 Mali', zh: '🇲🇱 马里', ar: '🇲🇱 مالي', ru: '🇲🇱 Мали' },
  mo: { fa: '🇲🇴 ماکائو', en: '🇲🇴 Macao', zh: '🇲🇴 澳门', ar: '🇲🇴 ماكاو', ru: '🇲🇴 Макао' },
  hu: { fa: '🇭🇺 مجارستان', en: '🇭🇺 Hungary', zh: '🇭🇺 匈牙利', ar: '🇭🇺 المجر', ru: '🇭🇺 Венгрия' },
  ma: { fa: '🇲🇦 مراکش', en: '🇲🇦 Morocco', zh: '🇲🇦 摩洛哥', ar: '🇲🇦 المغرب', ru: '🇲🇦 Марокко' },
  eg: { fa: '🇪🇬 مصر', en: '🇪🇬 Egypt', zh: '🇪🇬 埃及', ar: '🇪🇬 مصر', ru: '🇪🇬 Египет' },
  mn: { fa: '🇲🇳 مغولستان', en: '🇲🇳 Mongolia', zh: '🇲🇳 蒙古', ar: '🇲🇳 منغوليا', ru: '🇲🇳 Монголия' },
  mk: { fa: '🇲🇰 مقدونیه شمالی', en: '🇲🇰 North Macedonia', zh: '🇲🇰 北马其顿', ar: '🇲🇰 مقدونيا الشمالية', ru: '🇲🇰 Северная Македония' },
  mr: { fa: '🇲🇷 موریتانی', en: '🇲🇷 Mauritania', zh: '🇲🇷 毛里塔尼亚', ar: '🇲🇷 موريتانيا', ru: '🇲🇷 Мавритания' },
  mu: { fa: '🇲🇺 موریس', en: '🇲🇺 Mauritius', zh: '🇲🇺 毛里求斯', ar: '🇲🇺 موريشيوس', ru: '🇲🇺 Маврикий' },
  mz: { fa: '🇲🇿 موزامبیک', en: '🇲🇿 Mozambique', zh: '🇲🇿 莫桑比克', ar: '🇲🇿 موزمبيق', ru: '🇲🇿 Мозамбик' },
  md: { fa: '🇲🇩 مولداوی', en: '🇲🇩 Moldova', zh: '🇲🇩 摩尔多瓦', ar: '🇲🇩 مولدوفا', ru: '🇲🇩 Молдавия' },
  mc: { fa: '🇲🇨 موناکو', en: '🇲🇨 Monaco', zh: '🇲🇨 摩纳哥', ar: '🇲🇨 موناكو', ru: '🇲🇨 Монако' },
  me: { fa: '🇲🇪 مونته‌نگرو', en: '🇲🇪 Montenegro', zh: '🇲🇪 黑山', ar: '🇲🇪 الجبل الأسود', ru: '🇲🇪 Черногория' },
  mx: { fa: '🇲🇽 مکزیک', en: '🇲🇽 Mexico', zh: '🇲🇽 墨西哥', ar: '🇲🇽 المكسيك', ru: '🇲🇽 Мексика' },
  mm: { fa: '🇲🇲 میانمار', en: '🇲🇲 Myanmar', zh: '🇲🇲 缅甸', ar: '🇲🇲 ميانمار', ru: '🇲🇲 Мьянма' },
  na: { fa: '🇳🇦 نامیبیا', en: '🇳🇦 Namibia', zh: '🇳🇦 纳米比亚', ar: '🇳🇦 ناميبيا', ru: '🇳🇦 Намибия' },
  no: { fa: '🇳🇴 نروژ', en: '🇳🇴 Norway', zh: '🇳🇴 挪威', ar: '🇳🇴 النرويج', ru: '🇳🇴 Норвегия' },
  np: { fa: '🇳🇵 نپال', en: '🇳🇵 Nepal', zh: '🇳🇵 尼泊尔', ar: '🇳🇵 نيبال', ru: '🇳🇵 Непал' },
  ne: { fa: '🇳🇪 نیجر', en: '🇳🇪 Niger', zh: '🇳🇪 尼日尔', ar: '🇳🇪 النيجر', ru: '🇳🇪 Нигер' },
  ng: { fa: '🇳🇬 نیجریه', en: '🇳🇬 Nigeria', zh: '🇳🇬 尼日利亚', ar: '🇳🇬 نيجيريا', ru: '🇳🇬 Нигерия' },
  nz: { fa: '🇳🇿 نیوزیلند', en: '🇳🇿 New Zealand', zh: '🇳🇿 新西兰', ar: '🇳🇿 نيوزيلندا', ru: '🇳🇿 Новая Зеландия' },
  ni: { fa: '🇳🇮 نیکاراگوئه', en: '🇳🇮 Nicaragua', zh: '🇳🇮 尼加拉瓜', ar: '🇳🇮 نيكاراغوا', ru: '🇳🇮 Никарагуа' },
  ht: { fa: '🇭🇹 هائیتی', en: '🇭🇹 Haiti', zh: '🇭🇹 海地', ar: '🇭🇹 هايتي', ru: '🇭🇹 Гаити' },
  nl: { fa: '🇳🇱 هلند', en: '🇳🇱 Netherlands', zh: '🇳🇱 荷兰', ar: '🇳🇱 هولندا', ru: '🇳🇱 Нидерланды' },
  hn: { fa: '🇭🇳 هندوراس', en: '🇭🇳 Honduras', zh: '🇭🇳 洪都拉斯', ar: '🇭🇳 هندوراس', ru: '🇭🇳 Гондурас' },
  hk: { fa: '🇭🇰 هنگ‌کنگ', en: '🇭🇰 Hong Kong', zh: '🇭🇰 香港', ar: '🇭🇰 هونغ كونغ', ru: '🇭🇰 Гонконг' },
  va: { fa: '🇻🇦 واتیکان', en: '🇻🇦 Vatican City', zh: '🇻🇦 梵蒂冈', ar: '🇻🇦 الفاتيكان', ru: '🇻🇦 Ватикан' },
  ve: { fa: '🇻🇪 ونزوئلا', en: '🇻🇪 Venezuela', zh: '🇻🇪 委内瑞拉', ar: '🇻🇪 فنزويلا', ru: '🇻🇪 Венесуэла' },
  vn: { fa: '🇻🇳 ویتنام', en: '🇻🇳 Vietnam', zh: '🇻🇳 越南', ar: '🇻🇳 فيتنام', ru: '🇻🇳 Вьетнам' },
  py: { fa: '🇵🇾 پاراگوئه', en: '🇵🇾 Paraguay', zh: '🇵🇾 巴拉圭', ar: '🇵🇾 باراغواي', ru: '🇵🇾 Парагвай' },
  pa: { fa: '🇵🇦 پاناما', en: '🇵🇦 Panama', zh: '🇵🇦 巴拿马', ar: '🇵🇦 بنما', ru: '🇵🇦 Панама' },
  pg: { fa: '🇵🇬 پاپوآ گینه نو', en: '🇵🇬 Papua New Guinea', zh: '🇵🇬 巴布亚新几内亚', ar: '🇵🇬 بابوا غينيا الجديدة', ru: '🇵🇬 Папуа — Новая Гвинея' },
  pk: { fa: '🇵🇰 پاکستان', en: '🇵🇰 Pakistan', zh: '🇵🇰 巴基斯坦', ar: '🇵🇰 باكستان', ru: '🇵🇰 Пакистан' },
  pt: { fa: '🇵🇹 پرتغال', en: '🇵🇹 Portugal', zh: '🇵🇹 葡萄牙', ar: '🇵🇹 البرتغال', ru: '🇵🇹 Португалия' },
  pe: { fa: '🇵🇪 پرو', en: '🇵🇪 Peru', zh: '🇵🇪 秘鲁', ar: '🇵🇪 بيرو', ru: '🇵🇪 Перу' },
  pf: { fa: '🇵🇫 پلی‌نزی فرانسه', en: '🇵🇫 French Polynesia', zh: '🇵🇫 法属波利尼西亚', ar: '🇵🇫 بولينزيا الفرنسية', ru: '🇵🇫 Французская Полинезия' },
  pr: { fa: '🇵🇷 پورتوریکو', en: '🇵🇷 Puerto Rico', zh: '🇵🇷 波多黎各', ar: '🇵🇷 بورتوريكو', ru: '🇵🇷 Пуэрто-Рико' },
  td: { fa: '🇹🇩 چاد', en: '🇹🇩 Chad', zh: '🇹🇩 乍得', ar: '🇹🇩 تشاد', ru: '🇹🇩 Чад' },
  cz: { fa: '🇨🇿 چک', en: '🇨🇿 Czech Republic', zh: '🇨🇿 捷克', ar: '🇨🇿 التشيك', ru: '🇨🇿 Чехия' },
  jp: { fa: '🇯🇵 ژاپن', en: '🇯🇵 Japan', zh: '🇯🇵 日本', ar: '🇯🇵 اليابان', ru: '🇯🇵 Япония' },
  cr: { fa: '🇨🇷 کاستاریکا', en: '🇨🇷 Costa Rica', zh: '🇨🇷 哥斯达黎加', ar: '🇨🇷 كوستاريكا', ru: '🇨🇷 Коста-Рика' },
  nc: { fa: '🇳🇨 کالدونیای جدید', en: '🇳🇨 New Caledonia', zh: '🇳🇨 新喀里多尼亚', ar: '🇳🇨 كاليدونيا الجديدة', ru: '🇳🇨 Новая Каледония' },
  kh: { fa: '🇰🇭 کامبوج', en: '🇰🇭 Cambodia', zh: '🇰🇭 柬埔寨', ar: '🇰🇭 كمبوديا', ru: '🇰🇭 Камбоджа' },
  cm: { fa: '🇨🇲 کامرون', en: '🇨🇲 Cameroon', zh: '🇨🇲 喀麦隆', ar: '🇨🇲 الكاميرون', ru: '🇨🇲 Камерун' },
  ca: { fa: '🇨🇦 کانادا', en: '🇨🇦 Canada', zh: '🇨🇦 加拿大', ar: '🇨🇦 كندا', ru: '🇨🇦 Канада' },
  kr: { fa: '🇰🇷 کره جنوبی', en: '🇰🇷 South Korea', zh: '🇰🇷 韩国', ar: '🇰🇷 كوريا الجنوبية', ru: '🇰🇷 Южная Корея' },
  kp: { fa: '🇰🇵 کره شمالی', en: '🇰🇵 North Korea', zh: '🇰🇵 朝鲜', ar: '🇰🇵 كوريا الشمالية', ru: '🇰🇵 Северная Корея' },
  hr: { fa: '🇭🇷 کرواسی', en: '🇭🇷 Croatia', zh: '🇭🇷 克罗地亚', ar: '🇭🇷 كرواتيا', ru: '🇭🇷 Хорватия' },
  co: { fa: '🇨🇴 کلمبیا', en: '🇨🇴 Colombia', zh: '🇨🇴 哥伦比亚', ar: '🇨🇴 كولومبيا', ru: '🇨🇴 Колумбия' },
  cg: { fa: '🇨🇬 کنگو', en: '🇨🇬 Republic of the Congo', zh: '🇨🇬 刚果（布）', ar: '🇨🇬 الكونغو', ru: '🇨🇬 Конго' },
  cd: { fa: '🇨🇩 کنگوی دموکراتیک', en: '🇨🇩 Democratic Republic of the Congo', zh: '🇨🇩 刚果（金）', ar: '🇨🇩 الكونغو الديمقراطية', ru: '🇨🇩 ДР Конго' },
  ke: { fa: '🇰🇪 کنیا', en: '🇰🇪 Kenya', zh: '🇰🇪 肯尼亚', ar: '🇰🇪 كينيا', ru: '🇰🇪 Кения' },
  cu: { fa: '🇨🇺 کوبا', en: '🇨🇺 Cuba', zh: '🇨🇺 古巴', ar: '🇨🇺 كوبا', ru: '🇨🇺 Куба' },
  cw: { fa: '🇨🇼 کوراسائو', en: '🇨🇼 Curacao', zh: '🇨🇼 库拉索', ar: '🇨🇼 كوراساو', ru: '🇨🇼 Кюрасао' },
  xk: { fa: '🇽🇰 کوزوو', en: '🇽🇰 Kosovo', zh: '🇽🇰 科索沃', ar: '🇽🇰 كوسوفو', ru: '🇽🇰 Косово' },
  km: { fa: '🇰🇲 کومور', en: '🇰🇲 Comoros', zh: '🇰🇲 科摩罗', ar: '🇰🇲 جزر القمر', ru: '🇰🇲 Коморы' },
  kw: { fa: '🇰🇼 کویت', en: '🇰🇼 Kuwait', zh: '🇰🇼 科威特', ar: '🇰🇼 الكويت', ru: '🇰🇼 Кувейт' },
  cv: { fa: '🇨🇻 کیپ‌ورد', en: '🇨🇻 Cape Verde', zh: '🇨🇻 佛得角', ar: '🇨🇻 الرأس الأخضر', ru: '🇨🇻 Кабо-Верде' },
  gm: { fa: '🇬🇲 گامبیا', en: '🇬🇲 Gambia', zh: '🇬🇲 冈比亚', ar: '🇬🇲 غامبيا', ru: '🇬🇲 Гамбия' },
  ge: { fa: '🇬🇪 گرجستان', en: '🇬🇪 Georgia', zh: '🇬🇪 格鲁吉亚', ar: '🇬🇪 جورجيا', ru: '🇬🇪 Грузия' },
  gg: { fa: '🇬🇬 گرنزی', en: '🇬🇬 Guernsey', zh: '🇬🇬 根西', ar: '🇬🇬 غيرنزي', ru: '🇬🇬 Гернси' },
  gt: { fa: '🇬🇹 گواتمالا', en: '🇬🇹 Guatemala', zh: '🇬🇹 危地马拉', ar: '🇬🇹 غواتيمالا', ru: '🇬🇹 Гватемала' },
  gp: { fa: '🇬🇵 گوادلوپ', en: '🇬🇵 Guadeloupe', zh: '🇬🇵 瓜德罗普', ar: '🇬🇵 غوادلوب', ru: '🇬🇵 Гваделупа' },
  gu: { fa: '🇬🇺 گوام', en: '🇬🇺 Guam', zh: '🇬🇺 关岛', ar: '🇬🇺 غوام', ru: '🇬🇺 Гуам' },
  gy: { fa: '🇬🇾 گویان', en: '🇬🇾 Guyana', zh: '🇬🇾 圭亚那', ar: '🇬🇾 غيانا', ru: '🇬🇾 Гайана' },
  gf: { fa: '🇬🇫 گویان فرانسه', en: '🇬🇫 French Guiana', zh: '🇬🇫 法属圭亚那', ar: '🇬🇫 غويانا الفرنسية', ru: '🇬🇫 Французская Гвиана' },
  gn: { fa: '🇬🇳 گینه', en: '🇬🇳 Guinea', zh: '🇬🇳 几内亚', ar: '🇬🇳 غينيا', ru: '🇬🇳 Гвинея' },
  gq: { fa: '🇬🇶 گینه استوایی', en: '🇬🇶 Equatorial Guinea', zh: '🇬🇶 赤道几内亚', ar: '🇬🇶 غينيا الاستوائية', ru: '🇬🇶 Экваториальная Гвинея' },
  ye: { fa: '🇾🇪 یمن', en: '🇾🇪 Yemen', zh: '🇾🇪 也门', ar: '🇾🇪 اليمن', ru: '🇾🇪 Йемен' },
  gr: { fa: '🇬🇷 یونان', en: '🇬🇷 Greece', zh: '🇬🇷 希腊', ar: '🇬🇷 اليونان', ru: '🇬🇷 Греция' },
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
  // Support inbox — same strings as FontStory.
  supportHint: {
    fa: 'اگه سوال یا مشکلی داشتی، از دکمه‌ی زیر به پشتیبانی پیام بده 👇',
    en: 'If you have a question or a problem, message support with the button below 👇',
    zh: '如有问题，请点击下方按钮联系客服 👇',
    ar: 'إذا كان لديك سؤال أو مشكلة، راسل الدعم بالزر أدناه 👇',
    ru: 'Если есть вопрос или проблема, напишите в поддержку кнопкой ниже 👇',
  },
  supportButton: {
    fa: '💬 پیام به پشتیبانی',
    en: '💬 Message to support',
    zh: '💬 联系客服',
    ar: '💬 مراسلة الدعم',
    ru: '💬 Сообщение в поддержку',
  },
  cancelButton: {
    fa: '❌ انصراف',
    en: '❌ Cancel',
    zh: '❌ 取消',
    ar: '❌ إلغاء',
    ru: '❌ Отмена',
  },
  supportPrompt: {
    fa: 'پیامت رو بنویس — مستقیم برای پشتیبانی ارسال می‌شه.',
    en: 'Write your message — it will be sent straight to support.',
    zh: '请写下您的消息——将直接发送给客服。',
    ar: 'اكتب رسالتك — ستُرسل مباشرة إلى الدعم.',
    ru: 'Напишите сообщение — оно сразу уйдёт в поддержку.',
  },
  supportCancelled: {
    fa: 'باشه، پیامت ارسال نشد.',
    en: 'OK, your message was not sent.',
    zh: '好的，您的消息未发送。',
    ar: 'حسناً، لم تُرسل رسالتك.',
    ru: 'Хорошо, сообщение не отправлено.',
  },
  supportTextOnly: {
    fa: 'لطفاً پیامت رو به صورت متن بفرست.',
    en: 'Please send your message as text.',
    zh: '请以文字形式发送您的消息。',
    ar: 'يرجى إرسال رسالتك كنص.',
    ru: 'Пожалуйста, отправьте сообщение текстом.',
  },
  supportSent: {
    fa: '✅ پیامت به پشتیبانی رسید — به‌زودی جواب می‌دیم.',
    en: '✅ Your message reached support — we will reply soon.',
    zh: '✅ 您的消息已送达客服——我们会尽快回复。',
    ar: '✅ وصلت رسالتك إلى الدعم — سنرد عليك قريباً.',
    ru: '✅ Ваше сообщение дошло до поддержки — скоро ответим.',
  },
  supportReplyPrefix: {
    fa: '💬 پاسخ پشتیبانی:\n\n',
    en: '💬 Support reply:\n\n',
    zh: '💬 客服回复：\n\n',
    ar: '💬 رد الدعم:\n\n',
    ru: '💬 Ответ поддержки:\n\n',
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
