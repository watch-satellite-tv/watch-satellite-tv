import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { playbackFeedback } from '../schema.js';
import { ensureUser } from '../lib/users.js';

// Silent playback feedback from the Mini App — the app itself knows
// whether a channel played, so nobody has to be asked.
// Input: { channel_id: number, outcome: 'played' | 'failed' }.
// 'played' = onplaying fired (the video actually started),
// 'failed' = a fatal play error. One vote per user per channel per
// day: a repeat call the same day updates the row instead of adding
// one, so retries and channel-hopping can't spam the table.
// (There used to be a third outcome, 'vpn', with a «با VPN کار کرد»
// button — removed 2026-11-28: Telegram itself is filtered in Iran,
// so every user here is already on a VPN and the distinction is
// meaningless.)
const OUTCOMES = new Set(['played', 'failed']);

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  await ensureUser(user);
  const channelId = Number(input?.channel_id);
  const outcome = String(input?.outcome || '');
  if (!Number.isInteger(channelId) || channelId <= 0) {
    throw new EndpointError('channel_id is required', { code: 'BAD_INPUT' });
  }
  if (!OUTCOMES.has(outcome)) {
    throw new EndpointError('outcome must be played or failed', { code: 'BAD_INPUT' });
  }
  const now = Math.floor(Date.now() / 1000);
  const day = Math.floor(now / 86400);
  const existing = await db
    .select()
    .from(playbackFeedback)
    .where(
      and(
        eq(playbackFeedback.userId, user.id),
        eq(playbackFeedback.channelId, channelId),
        eq(playbackFeedback.day, day),
      ),
    )
    .get();
  if (existing) {
    await db
      .update(playbackFeedback)
      .set({ outcome, createdAt: now })
      .where(eq(playbackFeedback.id, existing.id))
      .run();
  } else {
    await db
      .insert(playbackFeedback)
      .values({ userId: user.id, channelId, outcome, day, createdAt: now })
      .run();
  }
  return { ok: true };
}
