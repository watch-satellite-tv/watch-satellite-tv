import { EndpointError } from 'sdk';
import { ensureUser, getUserLanguage } from '../lib/users.js';
import { effectiveLang } from '../lib/i18n.js';

// Called by the Mini App on load. Registers (or refreshes) the caller
// in the users table from verified initData. No body needed.
// Returns the user's effective language (saved choice, else Telegram
// language_code, else 'fa') so the app renders in the right language.
export default async function (_input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  const row = await ensureUser(user);
  const lang = effectiveLang(await getUserLanguage(user.id), user.language_code);
  return {
    ok: true,
    lang,
    user: { tg_id: row?.tgId ?? user.id, first_name: row?.firstName ?? user.first_name ?? null },
  };
}
