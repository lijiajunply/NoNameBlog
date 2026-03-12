# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoName Blog is a static blog built with Next.js 16, featuring MDX content, custom chart components, and a sidebar-based application layout. The project is configured for static export and deployed as a static site.

## Development Commands

```bash
# Development server (do NOT run via Claude - recommend user runs manually)
pnpm dev

# Build static site (generates RSS, sitemap, and Pagefind search index)
pnpm build

# Serve built static site locally
pnpm serve:out

# Lint code with Biome
pnpm lint

# Format code with Biome
pnpm format
```

## Architecture

### Content System

- **Content Location**: `content/posts/` for blog posts, `content/pages/` for static pages (e.g., about.mdx)
- **Content Format**: MDX files with frontmatter (validated by Zod schema in `src/lib/content/schema.ts`)
- **Content Processing**: `src/lib/content/posts.ts` handles reading, parsing, and aggregating posts
- **MDX Compilation**: `src/lib/content/mdx.tsx` configures MDX with custom components and rehype/remark plugins

### Layout System

The project uses a sidebar-based application layout in `src/app/(routes)/`, built on top of the shadcn/ui Sidebar component with collapsible navigation.

### MDX Custom Components

Custom MDX components are defined in `src/lib/content/mdx.tsx` and include:

- `<Chart>`: Various chart types (area, pie, radar, sankey, funnel, choropleth)
- `<LinkCard>`: External link preview cards
- `<ZoomableImage>`: Images with zoom functionality
- `<MermaidDiagram>`: Mermaid diagram rendering
- `<MusicScore>`: ABC notation music score rendering
- `<Chat>`: Chat-style message display
- `<GitHubCalendarCard>`: GitHub contribution calendar
- `<Icon>`: Iconify icon component

### Chart System

Custom chart components in `src/components/charts/` built on top of @visx:

- Context-based architecture (e.g., `chart-context.tsx`, `pie-context.tsx`)
- Composable chart primitives (axes, grids, tooltips)
- MDX-friendly wrapper components in `src/components/mdx/charts/`

### Build Process

The `postbuild` script performs:

1. Generates RSS feed (`scripts/generate-rss.mjs`)
2. Generates sitemap (`scripts/generate-sitemap.mjs`)
3. Copies RSS and sitemap to `out/` directory
4. Runs Pagefind to generate search index

### Configuration

- **Site Config**: `src/config/site.ts` contains site metadata, URLs, and social links
- **Next.js Config**: Static export mode with unoptimized images and trailing slashes
- **Environment Variables**: Giscus comments and Vercel Analytics are controlled via `.env.local`

## Key Patterns

### Content Queries

Use functions from `src/lib/content/posts.ts`:

- `getAllPosts()`: Get all posts sorted by date
- `getPostBySlug(slug)`: Get single post
- `getAllCategories()`: Get all unique categories with counts
- `getAllTags()`: Get all unique tags with counts
- `getAboutPage()`: Get about page content

### MDX Rehype/Remark Plugins

Custom plugins in `src/lib/content/`:

- `rehype-chart.ts`: Transforms `<Chart>` elements
- `rehype-mermaid.ts`: Transforms Mermaid code blocks
- `rehype-music.ts`: Transforms ABC notation code blocks
- `remark-colon-components.ts`: Transforms `:ComponentName` syntax

### Theme System

- Uses `next-themes` for dark mode
- Theme provider in `src/components/theme-provider.tsx`
- Tailwind CSS with custom dark mode gradients

## Important Notes

- This is a static site (Next.js `output: "export"`), so no server-side runtime features
- Posts are read from filesystem at build time, not runtime
- Duplicate post slugs will throw an error during build
- The app layout fetches all posts/categories/tags at layout level for sidebar navigation
- Biome is used for linting and formatting (not ESLint/Prettier)
