import { table, integer, text, index, sql } from 'sdk/db';

// Watch Satellite TV — IPTV Mini App on Telegram Serverless.
// Users are registered on /start and on first Mini App open (register
// endpoint). Channels are cached from iptv-org playlists (lazy refresh,
// see lib/catalog.js). No foreign keys (platform forbids them): the
// *_user_id / channel_id columns are logical links, enforced in app code.

export const users = table('users', {
  tgId: integer('tg_id').primaryKey(),
  username: text('username'),
  firstName: text('first_name'),
  languageCode: text('language_code'),
  // The user's chosen UI language (fa/en/zh/ar/ru). NULL = not chosen
  // yet — /start shows the language picker until they pick one.
  language: text('language'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  lastSeenAt: integer('last_seen_at').default(sql`(unixepoch())`),
});

// One row per (feed, stream url). A channel id in a playlist is not
// globally unique, so the url is the identity; the feed keeps the same
// channel in two feeds separate.
export const channels = table('channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  feed: text('feed').notNull(),
  // Which playlist a row came from ('fas', 'persiana', or the feed key
  // for single-source feeds). The fas feed merges two playlists, so
  // the source decides which probe filter applied at insert time.
  source: text('source'),
  tvgId: text('tvg_id'),
  name: text('name').notNull(),
  logo: text('logo'),
  groupName: text('group_title'),
  url: text('url').notNull(),
  // 'https' = directly playable in the Mini App; 'http' = mixed-content
  // blocked, hidden by default until a proxy exists.
  tier: text('tier').notNull().default('https'),
  reports: integer('reports').notNull().default(0),
  checkedAt: integer('checked_at').default(sql`(unixepoch())`),
}, (t) => ({
  feedUrlIdx: index('idx_channels_feed_url').on(t.feed, t.url),
  feedIdx: index('idx_channels_feed').on(t.feed),
}));

// When a feed was last refreshed from iptv-org (key = feed name).
export const cacheMeta = table('cache_meta', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
});

export const favorites = table('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  channelId: integer('channel_id').notNull(),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
}, (t) => ({
  userChannelIdx: index('idx_favorites_user_channel').on(t.userId, t.channelId),
  userIdx: index('idx_favorites_user').on(t.userId),
}));

export const reports = table('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  channelId: integer('channel_id').notNull(),
  reason: text('reason'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
}, (t) => ({
  channelIdx: index('idx_reports_channel').on(t.channelId),
}));

// Tiny key/value store for the admin's multi-step flows (e.g. the
// broadcast draft). Serverless handlers have no memory between calls,
// so the flow state lives here, not in a variable.
export const adminState = table('admin_state', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
});

// Support inbox (same design as FontStory): a user taps the
// reply-keyboard «پیام به پشتیبانی» button, writes one message, it is
// sent to the owner; the owner answers by replying to that message in
// the bot chat. support_pending tracks who is mid-message;
// support_map links the owner's copy of a support message back to
// the user who sent it.
export const supportPending = table('support_pending', {
  tgId: integer('tg_id').primaryKey(),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
});

export const supportMap = table('support_map', {
  ownerMsgId: integer('owner_msg_id').primaryKey(),
  userId: integer('user_id').notNull(),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
});
