import { db, EndpointError } from 'sdk';
import { eq, inArray, asc } from 'sdk/db';
import { favorites, channels } from '../schema.js';
import { ensureUser } from '../lib/users.js';

// Return the caller's favourite channels. No body needed.
export default async function (_input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  await ensureUser(user);
  const favs = await db.select().from(favorites).where(eq(favorites.userId, user.id)).all();
  const ids = favs.map((f) => f.channelId);
  if (ids.length === 0) return { ok: true, channels: [] };
  const rows = await db
    .select()
    .from(channels)
    .where(inArray(channels.id, ids))
    .orderBy(asc(channels.name))
    .all();
  return {
    ok: true,
    channels: rows.map((r) => ({
      id: r.id,
      tvg_id: r.tvgId,
      name: r.name,
      logo: r.logo,
      group: r.groupName,
      url: r.url,
      tier: r.tier,
      reports: r.reports,
    })),
  };
}
