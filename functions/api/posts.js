import { hasValidSession, json } from '../_lib/auth.js';
import { deleteFile, listFiles, writeFile } from '../_lib/github.js';

function safeText(value, limit) {
	return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function createSlug(value) {
	return safeText(value, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const categories = { daily: '日常', misc: '杂七杂八' };

function validSlug(value) {
	const slug = safeText(value, 100).toLowerCase();
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : '';
}

export async function onRequestGet({ request, env }) {
	if (!(await hasValidSession(request, env))) return json({ error: '请先登录。' }, 401);
	try {
		const groups = await Promise.all(Object.entries(categories).map(async ([key, category]) => {
			const files = await listFiles(env, `src/data/blog/${key}`);
			return files.filter((file) => file.type === 'file' && typeof file.name === 'string' && file.name.endsWith('.md')).map((file) => ({
				category: key,
				categoryName: category,
				slug: file.name.slice(0, -3),
			}));
		}));
		const rootFiles = await listFiles(env, 'src/data/blog');
		const rootPosts = rootFiles.filter((file) => file.type === 'file' && typeof file.name === 'string' && file.name.endsWith('.md')).map((file) => ({
			category: 'root',
			categoryName: '早期文章',
			slug: file.name.slice(0, -3),
		}));
		return json({ posts: [...groups.flat(), ...rootPosts].sort((left, right) => right.slug.localeCompare(left.slug)) });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : '无法读取文章列表。' }, 500);
	}
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
		const categoryKey = safeText(data.category, 16);
		const category = categories[categoryKey];
		const tags = Array.isArray(data.tags) ? data.tags.map((tag) => safeText(tag, 24)).filter(Boolean).slice(0, 8) : [];
		if (!title || !description || !content || !slug || !category || !/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) {
			return json({ error: '请填写分类、标题、简介、日期、英文链接名和正文。' }, 400);
		}
		if (content.length > 50000) return json({ error: '正文太长，请分成两篇文章。' }, 400);
		const markdown = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\npubDate: ${pubDate}\ncategory: ${JSON.stringify(category)}\ntags: ${JSON.stringify(tags)}\n---\n\n${content}\n`;
		await writeFile(env, `src/data/blog/${categoryKey}/${slug}.md`, markdown, `发布${category}：${title}`);
		return json({ ok: true, url: `/blog/${categoryKey}/${slug}/` });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : '发布失败。' }, 500);
	}
}

export async function onRequestDelete({ request, env }) {
	if (!(await hasValidSession(request, env))) return json({ error: '请先登录。' }, 401);
	try {
		const data = await request.json();
		const categoryKey = safeText(data.category, 16);
		const category = categories[categoryKey] ?? (categoryKey === 'root' ? '早期文章' : '');
		const slug = validSlug(data.slug);
		if (!category || !slug) return json({ error: '文章信息无效，删除已取消。' }, 400);
		const path = categoryKey === 'root' ? `src/data/blog/${slug}.md` : `src/data/blog/${categoryKey}/${slug}.md`;
		await deleteFile(env, path, `删除${category}：${slug}`);
		return json({ ok: true });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : '删除失败。' }, 500);
	}
}
