import { EndpointError } from 'sdk';
import { ensureUser } from '../lib/users.js';
import { getFeedChannels, FEEDS } from '../lib/catalog.js';

// Return the channel list for one feed (default 'fas' = Persian).
// Input: { feed?: string, force?: boolean, includeHttp?: boolean }.
// Refreshes lazily from iptv-org when the cache is empty or >12h old.
export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  await ensureUser(user);
  const feed = typeof input?.feed === 'string' && FEEDS[input.feed] ? input.feed : 'fas';
  const result = await getFeedChannels(feed, {
    force: input?.force === true,
    includeHttp: input?.includeHttp === true,
  });
  return {
    ok: true,
    feeds: Object.entries(FEEDS).map(([key, def]) => ({ key, label: def.label })),
    ...result,
  };
}
