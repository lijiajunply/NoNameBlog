# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, route segments, and global styles (`globals.css`).
- `src/components`: Shared UI and feature components (`ui/`, `mdx/`, `charts/`).
- `src/lib`: Utilities and content-processing logic (MDX, posts, RSS, sitemap, schema).
- `src/config`: Site-level configuration.
- `content/posts`: Blog posts in `.mdx`; `content/pages`: standalone MDX pages; `content/friends.json`: friends data.
- `public`: Static assets, generated feeds (`rss.xml`, `sitemap.xml`), and Notion images/covers.
- `scripts`: Content and build helpers (RSS/sitemap generation, Notion asset sync/import).

## Build, Test, and Development Commands
- `npm run dev`: Start local development server on `http://localhost:3000`.
- `npm run build`: Create production build and static export artifacts.
- `npm run postbuild`: Generate RSS + sitemap and build Pagefind index from `out/`.
- `npm run start`: Serve the exported `out/` site (respects `PORT`, default `3000`).
- `npm run serve:out`: Serve `out/` directly on port `3000`.
- `npm run lint`: Run Biome checks (lint + formatting diagnostics).
- `npm run format`: Apply Biome formatting and import organization.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Formatting: Biome, 2-space indentation, spaces (configured in `biome.json`).
- Prefer named exports for reusable modules; keep utility functions in `src/lib`.
- Component/file naming: kebab-case for files (for example `post-card.tsx`), route folders following Next.js conventions (`[slug]`, `[id]`).
- Keep content slugs lowercase and hyphenated (for example `linux-guide-ubuntu.mdx`).

## Testing Guidelines
- No dedicated automated test suite is configured currently.
- Minimum quality gate before PR: `npm run lint` and `npm run build` must pass.
- For content/SEO changes, also run `npm run postbuild` and verify generated files in `public/` and `out/`.

## Commit & Pull Request Guidelines
- Follow existing Conventional Commit style: `type(scope): summary`.
- Common types in this repo: `feat`, `fix`, `docs`, `style`, `chore`, `removal`.
- Keep commit summaries short and specific; scope by area when possible (for example `feat(blog): ...`).
- PRs should include:
  - Clear description of user-visible and technical changes.
  - Linked issue/task (if applicable).
  - Screenshots or short recordings for UI changes.
  - Notes about content generation steps run (`lint/build/postbuild`).
