# NoName Blog

一个基于 Next.js 16 构建的静态博客项目，用来记录技术文章、学习笔记和一些随想。

项目当前采用 App Router + MDX 内容驱动的方式组织文章，支持静态导出、全文搜索、RSS、站点地图、Giscus 评论，以及一套面向博客场景定制过的 Markdown/MDX 渲染能力。

## 项目特性

- 使用 `Next.js 16`、`React 19`、`TypeScript` 开发
- 基于 `MDX` 管理文章和页面内容
- 支持静态导出，适合部署到静态托管平台
- 内置 `RSS` 和 `sitemap.xml` 生成脚本
- 集成 `Pagefind`，支持全文搜索
- 支持 `Giscus` 评论系统
- 支持深色模式切换
- 支持 `KaTeX` 数学公式
- 支持 `Mermaid` 流程图/关系图
- 支持多种自定义 MDX 组件和图表块
- 支持分类、标签、归档统计、友链页等博客常见页面

## 技术栈

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Biome`
- `MDX`
- `Pagefind`
- `Giscus`
- `Mermaid`
- `KaTeX`

## 目录结构

```text
.
├── content
│   ├── pages              # 独立页面内容，例如 about
│   ├── posts              # 博客文章（支持子目录组织）
│   └── friends.json       # 友链数据
├── public
│   ├── notion-covers      # 文章封面资源
│   ├── notion-images      # 文章中引用的静态图片
│   ├── rss.xml            # 构建后生成
│   └── sitemap.xml        # 构建后生成
├── scripts
│   ├── cli.mjs            # 内容管理 CLI
│   ├── generate-rss.mjs
│   └── generate-sitemap.mjs
└── src
    ├── app                # Next.js App Router 路由
    ├── components         # 页面组件、UI 组件、MDX 组件、图表组件
    ├── config             # 站点配置
    └── lib                # 内容解析、RSS、站点地图、工具函数
```

## 本地开发

先安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev         # 启动开发环境
npm run build       # 生产构建（静态导出）
npm run postbuild   # 生成 RSS / Sitemap / Pagefind 搜索索引
npm run start       # 以静态站点方式启动 out/
npm run serve:out   # 直接在 3000 端口预览 out/
npm run lint        # Biome 检查
npm run format      # Biome 格式化
npm run cli         # 博客内容管理 CLI
```

## 内容管理

### 文章位置

文章位于 `content/posts` 目录下，支持按主题放在子目录中，但最终路由 slug 取文件名本身，所以**不要使用重复文件名**。

例如：

```text
content/posts/markdown-syntax-showcase.mdx
content/posts/linux-guide/linux-guide-arch.mdx
content/posts/flutter/flutter-1.mdx
```

### 文章 Frontmatter

文章的基础字段如下：

```yaml
---
title: "文章标题"
date: "2026-03-13"
summary: "文章摘要"
tags:
  - "Next.js"
  - "MDX"
category: "技术"
draft: false
cover: "/notion-covers/example.jpg"
previous: "上一篇 slug"
next: "下一篇 slug"
---
```

其中：

- `title`、`date` 为必填
- `summary` 可选，但建议填写，便于列表页和 SEO 展示
- `tags` 默认为空数组
- `category` 默认值为 `Uncategorized`
- `draft: true` 的文章不会出现在生产环境中
- `cover`、`previous`、`next` 为可选扩展字段

### 新建文章

项目内置了一个简单的内容 CLI：

```bash
npm run cli -- new
```

也可以直接带参数创建：

```bash
npm run cli -- new \
  --title "我的新文章" \
  --category "技术" \
  --tags "Next.js,MDX" \
  --published
```

此外还支持查看当前分类和标签统计：

```bash
npm run cli -- categories
npm run cli -- tags
```

## Markdown / MDX 能力

当前项目除了标准 Markdown 外，还支持一批增强能力：

- GFM 扩展：表格、任务列表、脚注
- 代码高亮
- 数学公式（KaTeX）
- Mermaid 图表
- Alert 引用块
- 可缩放图片
- 自定义 `::组件名` 风格的块级 MDX 组件
- `chart` 代码块驱动的图表组件

可参考现有示例文章：

- `content/posts/markdown-syntax-showcase.mdx`

## 站点页面

项目当前包含这些主要页面：

- 首页
- 文章详情页
- 分类页
- 标签页
- 关于页
- 搜索页
- 统计页
- 友链页
- 写作页

## 站点配置

站点基础信息集中在 `src/config/site.ts`：

- 站点地址 `siteUrl`
- 站点名称 `siteName`
- 描述 `description`
- 作者 `author`
- 语言 `locale`
- SEO 关键词 `keywords`
- 社交链接 `socialLinks`

如果准备正式部署，建议优先检查这里的配置是否已经更新为你的站点信息。

## 环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

### Giscus 评论区

如需启用文章评论，请配置：

- `NEXT_PUBLIC_GISCUS_REPO`：仓库名，例如 `owner/repo`
- `NEXT_PUBLIC_GISCUS_REPO_ID`：仓库 ID
- `NEXT_PUBLIC_GISCUS_CATEGORY`：Discussion 分类名，例如 `Announcements`
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`：分类 ID

前提是对应 GitHub 仓库已启用 Discussions。

### Vercel Analytics

可通过环境变量控制是否启用 Vercel Analytics：

- `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=false`：默认关闭
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true`：启用

## 构建与发布

项目在 `next.config.ts` 中启用了：

- `output: "export"`
- `trailingSlash: true`
- `images.unoptimized: true`

这意味着它当前是一个面向静态导出的博客站点。推荐发布流程如下：

```bash
npm run build
npm run postbuild
```

构建完成后：

- 静态产物位于 `out/`
- `public/rss.xml` 和 `public/sitemap.xml` 会被重新生成
- 搜索索引会生成到 `out/pagefind`

本地预览导出结果：

```bash
npm run start
```

## 质量检查

目前仓库没有单独的自动化测试套件，建议每次提交前至少执行：

```bash
npm run lint
npm run build
```

如果改动涉及内容、搜索或 SEO，建议再执行：

```bash
npm run postbuild
```

## 开源协议

本项目使用 [MIT](./LICENSE) 协议。
