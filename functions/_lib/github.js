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

export async function writeFile(env, path, content, message) {
	const token = env.GITHUB_TOKEN;
	if (!token) throw new Error('后台尚未完成 GitHub 发布配置。请在 Cloudflare 添加 GITHUB_TOKEN 加密密钥后重新部署。');
	const response = await fetch(contentUrl(path), {
		method: 'PUT',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			// GitHub currently documents this as its stable REST API version.
			'X-GitHub-Api-Version': '2022-11-28',
		},
		body: JSON.stringify({ message, content: toBase64(content), branch: 'main' }),
	});
	if (response.ok) return response.json();
	const error = await response.json().catch(() => ({}));
	if (response.status === 401) {
		throw new Error('GitHub 发布凭证无效或已过期。请重新粘贴一个有效的 token。');
	}
	if (response.status === 403) {
		throw new Error('GitHub 拒绝了发布请求。请确认 token 已授权此仓库，并拥有“Contents: Read and write”权限。');
	}
	if (response.status === 404) {
		throw new Error('找不到目标 GitHub 仓库，或当前 token 没有访问该仓库的权限。');
	}
	if (response.status === 422) throw new Error('这个文章链接名已存在，请换一个。');
	throw new Error(error.message ? `GitHub 发布失败：${error.message}` : '保存到 GitHub 时出现问题。');
}

export { toBase64 };
