import { hasValidSession, json } from '../_lib/auth.js';
import { writeFile } from '../_lib/github.js';

function safeText(value, limit) {
	return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function createSlug(value) {
	return safeText(value, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function onRequestPost({ request, env }) {
	if (!(await hasValidSession(request, env))) return json({ error: '请先登录。' }, 401);
	try {
		const data = await request.json();
		const title = safeText(data.title, 120);
		const description = safeText(data.description, 240);
		const content = typeof data.content === 'string' ? data.content.trim() : '';
		const slug = createSlug(data.slug);
		const pubDate = safeText(data.pubDate, 10);
		const tags = Array.isArray(data.tags) ? data.tags.map((tag) => safeText(tag, 24)).filter(Boolean).slice(0, 8) : [];
		if (!title || !description || !content || !slug || !/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) {
			return json({ error: '请填写标题、简介、日期、英文链接名和正文。' }, 400);
		}
		if (content.length > 50000) return json({ error: '正文太长，请分成两篇文章。' }, 400);
		const markdown = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\npubDate: ${pubDate}\ntags: ${JSON.stringify(tags)}\n---\n\n${content}\n`;
		await writeFile(env, `src/data/blog/${slug}.md`, markdown, `发布文章：${title}`);
		return json({ ok: true, url: `/blog/${slug}/` });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : '发布失败。' }, 500);
	}
}
