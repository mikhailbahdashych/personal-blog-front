# personal-blog-front

Public blog for [mikhailbahdashych.me](https://mikhailbahdashych.me) — Next.js (App Router, SSR).

Part of a three-repo system: **personal-blog-front** (this), `personal-blog-api` (content API), `personal-blog-admin` (editor).

## Architecture

- **App Router, dynamic rendering + tag-cached data.** Every route renders on request; API reads go through Next's data cache keyed by tags (`posts`, `post:<slug>`, `about`, `config`). The API invalidates those tags via `POST /api/revalidate` after each admin mutation, with a 1-hour staleness fallback. Builds never require a running API.
- **Markdown** (`src/lib/markdown.ts`): unified/remark/rehype — GFM, KaTeX math, Shiki highlighting, figures + table captions + TOC. Runs server-side only.
- **Theme**: `data-theme` on `<html>`, persisted in localStorage, system default, set by an inline pre-paint script (no flash).
- **SEO**: server-rendered metadata (canonical, Open Graph, Twitter), JSON-LD (`BlogPosting`/`CreativeWork`), `sitemap.xml`, `robots.txt`, `rss.xml`, proper 404 status.

## Pages

`/` home · `/blog` + `/projects` listings (pagination) · `/blog/[slug]` + `/projects/[slug]` detail · `/about` CV · `/search` results · 404.

## Development

Requires the API running locally (`personal-blog-api`: `npm run dev:infra && npm run migrate && npm run seed && npm run start:dev`).

```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run build` / `start` | Production build (standalone) / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — markdown pipeline fixtures |
| `npm run format` | Prettier |

## Environment

| Var | Purpose |
| --- | --- |
| `API_INTERNAL_URL` | Server-side API base (container-internal in prod) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin (build-time inlined) |
| `NEXT_PUBLIC_API_URL` | Browser-facing API base for search (build-time inlined) |
| `REVALIDATE_SECRET` | Shared secret guarding `/api/revalidate` (matches the API) |

## Deployment

Multi-stage Docker image (standalone output) built by `.github/workflows/deploy.yml` → GHCR → SSH deploy into the EC2 compose stack. Infra lives in the API repo's [`deploy/`](https://github.com/mikhailbahdashych/personal-blog-api/tree/master/deploy).
