const encoder = new TextEncoder();
const REPOSITORY = 'yibozhen9-ship-it/xiajierche-blog';

function toBase64(input) {
	const bytes = input instanceof Uint8Array ? input : encoder.encode(input);
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	}
	return btoa(binary);
}

function contentUrl(path) {
	return `https://api.github.com/repos/${REPOSITORY}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
}

function tokenFor(env) {
	const token = typeof env.GITHUB_TOKEN === 'string' ? env.GITHUB_TOKEN.trim() : '';
	if (!token) throw new Error('后台尚未完成 GitHub 发布配置。请在 Cloudflare 添加 GITHUB_TOKEN 加密密钥后重新部署。');
	return token;
}

function headers(token) {
	return {
		Accept: 'application/vnd.github+json',
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
		'User-Agent': 'xiajierche-blog-admin',
		'X-GitHub-Api-Version': '2022-11-28',
	};
}

async function throwGithubError(response, conflictMessage = '') {
	const error = await response.json().catch(() => ({}));
	if (response.status === 401) throw new Error('GitHub 发布凭证无效或已过期。请检查 Cloudflare 中的 GITHUB_TOKEN。');
	if (response.status === 403) {
		const reason = typeof error.message === 'string' && error.message ? `（GitHub：${error.message}）` : '';
		throw new Error(`GitHub 拒绝了发布请求。请确认 Cloudflare 中保存的是最新 token，且它已授权此仓库并拥有“Contents: Read and write”权限。${reason}`);
	}
	if (response.status === 404) throw new Error('找不到目标 GitHub 仓库或文章，或当前 token 没有访问权限。');
	if (response.status === 422 && conflictMessage) throw new Error(conflictMessage);
	throw new Error(error.message ? `GitHub 操作失败：${error.message}` : '保存到 GitHub 时出现问题。');
}

export async function writeFile(env, path, content, message) {
	const response = await fetch(contentUrl(path), {
		method: 'PUT',
		headers: headers(tokenFor(env)),
		body: JSON.stringify({ message, content: toBase64(content), branch: 'main' }),
	});
	if (response.ok) return response.json();
	return throwGithubError(response, '这个文章链接名已存在，请换一个。');
}

export async function listFiles(env, path) {
	const response = await fetch(`${contentUrl(path)}?ref=main`, { headers: headers(tokenFor(env)) });
	if (!response.ok) return throwGithubError(response);
	const data = await response.json();
	return Array.isArray(data) ? data : [];
}

export async function deleteFile(env, path, message) {
	const token = tokenFor(env);
	const existing = await fetch(`${contentUrl(path)}?ref=main`, { headers: headers(token) });
	if (!existing.ok) return throwGithubError(existing);
	const file = await existing.json();
	if (!file || typeof file.sha !== 'string') throw new Error('无法读取文章版本，删除已取消。');
	const response = await fetch(contentUrl(path), {
		method: 'DELETE',
		headers: headers(token),
		body: JSON.stringify({ message, sha: file.sha, branch: 'main' }),
	});
	if (response.ok) return response.json();
	return throwGithubError(response);
}

export { toBase64 };
