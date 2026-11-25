import { db, EndpointError } from 'sdk';
import { eq, sql } from 'sdk/db';
import { reports, channels } from '../schema.js';
import { ensureUser } from '../lib/users.js';

// Report a channel as broken. Input: { channel_id: number, reason?: string }.
// Increments the channel's report counter so repeatedly reported
// channels can be hidden or re-checked later.
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
  const reason = typeof input?.reason === 'string' ? input.reason.slice(0, 200) : null;
  await db.insert(reports).values({ userId: user.id, channelId, reason }).run();
  await db
    .update(channels)
    .set({ reports: sql`${channels.reports} + 1` })
    .where(eq(channels.id, channelId))
    .run();
  return { ok: true };
}
