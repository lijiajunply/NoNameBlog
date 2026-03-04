# NoName Blog

一个没有名字的博客，使用 Next.JS 构建

## 技术栈

- [x] Next.JS
- [x] Tailwind CSS
- [x] Shadcn
- [x] Bklit UI
- [x] Typescript

## 评论区配置（Giscus）

项目已支持在文章页展示 Giscus 评论区。使用前先在 GitHub 仓库开启 Discussions，并配置环境变量：

```bash
cp .env.example .env.local
```

填写以下变量：

- `NEXT_PUBLIC_GISCUS_REPO`：仓库名，例如 `owner/repo`
- `NEXT_PUBLIC_GISCUS_REPO_ID`：仓库 ID
- `NEXT_PUBLIC_GISCUS_CATEGORY`：Discussion 分类名，例如 `Announcements`
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`：分类 ID

## 开源协议

本项目使用 MIT 协议
