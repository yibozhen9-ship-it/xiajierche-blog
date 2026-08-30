export const site = {
	title: '虾基尔车',
	description: '在读硕士。',
	url: 'https://xiajierche-blog.pages.dev',
};

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
}
