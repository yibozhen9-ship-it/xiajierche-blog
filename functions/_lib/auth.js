const encoder = new TextEncoder();
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function toBase64Url(bytes) {
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	}
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sign(value, secret) {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

function equal(left, right) {
	if (left.length !== right.length) return false;
	let result = 0;
	for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
	return result === 0;
}

function cookieValue(request, name) {
	const cookie = request.headers.get('Cookie') ?? '';
	const entry = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
	return entry ? entry.slice(name.length + 1) : null;
}

export function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
	});
}

export async function createSession(env) {
	if (!env.SESSION_SECRET) throw new Error('后台尚未完成安全配置。');
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
	const value = `${expiresAt}.${crypto.randomUUID()}`;
	return `${value}.${await sign(value, env.SESSION_SECRET)}`;
}

export async function hasValidSession(request, env) {
	if (!env.SESSION_SECRET) return false;
	const session = cookieValue(request, 'blog_admin_session');
	if (!session) return false;
	const finalDot = session.lastIndexOf('.');
	if (finalDot < 1) return false;
	const value = session.slice(0, finalDot);
	const signature = session.slice(finalDot + 1);
	const [expiresAt] = value.split('.');
	if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now() / 1000) return false;
	return equal(signature, await sign(value, env.SESSION_SECRET));
}

export function sessionCookie(session) {
	return `blog_admin_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_SECONDS}`;
}

export function expiredSessionCookie() {
	return 'blog_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

export function passwordMatches(password, env) {
	return typeof password === 'string' && typeof env.ADMIN_PASSWORD === 'string' && equal(password, env.ADMIN_PASSWORD);
}
