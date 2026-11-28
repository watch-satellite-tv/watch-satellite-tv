import { db, EndpointError } from 'sdk';
import { eq, and, sql } from 'sdk/db';
import { reports, channels } from '../schema.js';
import { ensureUser } from '../lib/users.js';

// Report a channel as broken. Input: { channel_id: number, reason?: string }.
// Increments the channel's report counter so repeatedly reported
// channels can be hidden or re-checked later.
// One report per user per channel per day: the same user tapping the
// button 10 times in a row (MBC Persia: 44 reports from 3 users) used
// to count as 44 reports. A repeat call the same day returns
// duplicate:true and changes nothing.
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
  const now = Math.floor(Date.now() / 1000);
  const dayStart = Math.floor(now / 86400) * 86400;
  const existing = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.userId, user.id),
        eq(reports.channelId, channelId),
        sql`${reports.createdAt} >= ${dayStart}`,
      ),
    )
    .get();
  if (existing) return { ok: true, duplicate: true };
  const reason = typeof input?.reason === 'string' ? input.reason.slice(0, 200) : null;
  await db.insert(reports).values({ userId: user.id, channelId, reason }).run();
  await db
    .update(channels)
    .set({ reports: sql`${channels.reports} + 1` })
    .where(eq(channels.id, channelId))
    .run();
  return { ok: true };
}
