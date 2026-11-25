import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { favorites, channels } from '../schema.js';
import { ensureUser } from '../lib/users.js';

// Toggle a favourite for the caller. Input: { channel_id: number }.
// Returns { ok, favorite: boolean }.
export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  await ensureUser(user);
  const channelId = Number(input?.channel_id);
  if (!channelId) {
    throw new EndpointError('channel_id is required', { code: 'BAD_INPUT' });
  }
  const channel = await db.select().from(channels).where(eq(channels.id, channelId)).get();
  if (!channel) {
    throw new EndpointError('Channel not found', { code: 'NOT_FOUND' });
  }
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.channelId, channelId)))
    .get();
  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id)).run();
    return { ok: true, favorite: false };
  }
  await db.insert(favorites).values({ userId: user.id, channelId }).run();
  return { ok: true, favorite: true };
}
