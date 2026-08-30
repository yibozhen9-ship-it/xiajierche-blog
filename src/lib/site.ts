export const site = {
	title: '虾基尔车',
	description: '瞎玩瞎写瞎干。',
	url: 'https://xiajierche-blog.pages.dev',
};

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
}
