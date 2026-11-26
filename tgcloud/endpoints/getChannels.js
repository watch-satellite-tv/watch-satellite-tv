import { EndpointError } from 'sdk';
import { ensureUser, getUserLanguage } from '../lib/users.js';
import { getFeedChannels, FEEDS } from '../lib/catalog.js';
import { feedLabel, effectiveLang } from '../lib/i18n.js';

// Return the channel list for one feed (default 'fas' = Persian).
// Input: { feed?: string, force?: boolean, includeHttp?: boolean }.
// Refreshes lazily from iptv-org when the cache is empty or >12h old.
// Feed labels come back in the user's effective language.
export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  await ensureUser(user);
  const lang = effectiveLang(await getUserLanguage(user.id), user.language_code);
  const feed = typeof input?.feed === 'string' && FEEDS[input.feed] ? input.feed : 'fas';
  const result = await getFeedChannels(feed, {
    force: input?.force === true,
    includeHttp: input?.includeHttp === true,
  });
  return {
    ok: true,
    lang,
    feeds: Object.keys(FEEDS).map((key) => ({ key, label: feedLabel(key, lang) })),
    ...result,
  };
}
