import { EndpointError } from 'sdk';
import { ensureUser } from '../lib/users.js';

// Called by the Mini App on load. Registers (or refreshes) the caller
// in the users table from verified initData. No body needed.
export default async function (_input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) {
    throw new EndpointError('No Telegram user in init data', { code: 'NO_USER' });
  }
  const row = await ensureUser(user);
  return {
    ok: true,
    user: { tg_id: row?.tgId ?? user.id, first_name: row?.firstName ?? user.first_name ?? null },
  };
}
