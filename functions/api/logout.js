import { expiredSessionCookie, json } from '../_lib/auth.js';

export function onRequestPost() {
	return json({ ok: true }, 200, { 'Set-Cookie': expiredSessionCookie() });
}
