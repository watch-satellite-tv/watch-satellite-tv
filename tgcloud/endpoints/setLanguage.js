import { EndpointError } from 'sdk';
import { ensureUser, setUserLanguage } from '../lib/users.js';
import { isLang } from '../lib/i18n.js';

// Save the user's chosen UI language (from the in-app switcher).
// Input: { lang: 'fa' | 'en' | 'zh' | 'ar' | 'ru' }.
export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  const lang = input?.lang;
  if (!isLang(lang)) {
    throw new EndpointError('Unknown language', { code: 'BAD_LANG' });
  }
  await ensureUser(user);
  await setUserLanguage(user.id, lang);
  return { ok: true, lang };
}
