import { createSession, json, passwordMatches, sessionCookie } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
	try {
		if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: '后台还没有完成密码配置。' }, 503);
		const { password } = await request.json();
		if (!passwordMatches(password, env)) return json({ error: '密码不正确。' }, 401);
		return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(await createSession(env)) });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : '登录失败。' }, 500);
	}
}
