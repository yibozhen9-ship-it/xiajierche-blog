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

export async function writeFile(env, path, content, message, oneTimeToken = '') {
	const token = env.GITHUB_TOKEN || oneTimeToken;
	if (!token) throw new Error('请粘贴一次 GitHub 发布凭证，或完成 Cloudflare 的 GitHub 配置。');
	const response = await fetch(contentUrl(path), {
		method: 'PUT',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2026-03-10',
		},
		body: JSON.stringify({ message, content: toBase64(content), branch: 'main' }),
	});
	if (response.ok) return response.json();
	const error = await response.json().catch(() => ({}));
	if (response.status === 422) throw new Error('这个文章链接名已存在，请换一个。');
	throw new Error(error.message || '保存到 GitHub 时出现问题。');
}

export { toBase64 };
