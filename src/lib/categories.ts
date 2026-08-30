export const categories = {
	daily: { label: '日常', href: '/blog/daily/' },
	misc: { label: '杂七杂八', href: '/blog/misc/' },
} as const;

export type CategoryKey = keyof typeof categories;
