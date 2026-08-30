import { hasValidSession, json } from '../_lib/auth.js';
import { writeFile } from '../_lib/github.js';

const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export async function onRequestPost({ request, env }) {
	if (!(await hasValidSession(request, env))) return json({ error: '请先登录。' }, 401);
	try {
		const form = await request.formData();
		const image = form.get('image');
		const githubToken = typeof form.get('githubToken') === 'string' ? form.get('githubToken').trim() : '';
		if (!image || typeof image.arrayBuffer !== 'function') return json({ error: '请选择一张图片。' }, 400);
		const extension = extensions[image.type];
		if (!extension) return json({ error: '请使用 JPG、PNG、WebP 或 GIF 图片。' }, 400);
		if (image.size > 5 * 1024 * 1024) return json({ error: '图片请小于 5 MB。' }, 400);
		const filename = `${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}.${extension}`;
		await writeFile(env, `public/images/${filename}`, new Uint8Array(await image.arrayBuffer()), `上传图片：${filename}`, githubToken);
		return json({ ok: true, path: `/images/${filename}` });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : '上传图片失败。' }, 500);
	}
}
