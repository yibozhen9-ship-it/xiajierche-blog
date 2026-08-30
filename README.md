# 虾基尔车 · 个人博客

一个用 Astro 和 Markdown 制作的中文个人博客。文章不需要后台：写好一个 Markdown 文件，网站会在构建时自动生成对应页面。

## 最常用的三个位置

- `src/lib/site.ts`：修改博客名称、简介和未来的域名。
- `src/pages/about.astro`：修改“关于我”和联系邮箱。
- `src/data/blog/`：新建或编辑文章。

## 写一篇文章

在 `src/data/blog/` 新建一个英文文件名的 `.md` 文件，例如 `my-first-post.md`：

```md
---
title: 我的第一篇文章
description: 用一两句话说明这篇文章。
pubDate: 2026-08-30
tags: [随笔]
---

从这里开始写正文。
```

保存后，文章会出现在首页、文章列表和 RSS 中，网址为 `/blog/my-first-post/`。

## 本地查看

```sh
npm run dev -- --background
```

在浏览器打开 `http://localhost:4321`。停止预览可运行：

```sh
npm run astro -- dev stop
```

## 发布前检查

```sh
npm run build
```

构建后的静态文件位于 `dist/`，可发布到 Vercel、Cloudflare Pages 或 GitHub Pages。
