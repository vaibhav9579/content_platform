# The Publication

An enterprise-grade, SEO + GEO optimized blog publishing platform. Built with
Next.js App Router, TypeScript, Tailwind CSS, Prisma/PostgreSQL, Clerk, and a
Notion-style Tiptap editor.

The goal isn't "a blog" — it's a publishing system engineered to rank on
Google and Bing, and to be legible, quotable, and citable to AI answer
engines (ChatGPT, Claude, Gemini, Perplexity, Copilot).

## Stack

| Layer          | Choice                                                    |
| -------------- | ---------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack, React 19)                |
| Language       | TypeScript (strict)                                         |
| Styling        | Tailwind CSS v4 + hand-rolled shadcn/ui-style primitives     |
| Animation      | Framer Motion                                                |
| Database       | PostgreSQL + Prisma ORM                                      |
| Auth           | Clerk (RBAC: Admin / Editor / Author / Contributor / Subscriber) |
| Media          | Cloudinary (signed, server-proxied uploads)                  |
| Editor         | Tiptap (custom Notion-style node extensions + slash menu)    |
| Diagrams/Math  | Mermaid, KaTeX                                                |
| Deployment     | Vercel                                                        |

## Architecture

Feature-based, not type-based — logic for a domain lives together:

```
src/
  app/                    Routes (App Router)
    (marketing)/          Public site: home, blog, category, tag, author, search
    (admin)/admin/        CMS: dashboard, posts, taxonomy, media, comments, settings
    (auth)/                Clerk sign-in / sign-up
    api/                   Route handlers (upload, search, webhooks, cron)
    sitemap.ts, robots.ts, rss.xml/, news-sitemap.xml/, opengraph-image.tsx
  components/
    ui/                    Design-system primitives (button, dialog, table, …)
    layout/                Header, footer
    blog/                  Reading-experience components (TOC, share bar, comments, …)
    admin/                 CMS-only components
    editor/                Tiptap extensions, slash-command menu, toolbars
    seo/, shared/           JSON-LD renderer, theme provider, search palette, …
  features/                Domain logic: actions (mutations) + queries (reads)
    posts/ categories/ tags/ authors/ comments/ newsletter/ media/
    analytics/ bookmarks/ search/ settings/
  lib/                     Cross-cutting: prisma client, auth, cloudinary,
                           content utilities (slug, reading time, markdown, TOC),
                           SEO schema builders, validation (zod)
prisma/
  schema.prisma            Full data model
  seed.ts                  Realistic demo content (3 authors, 6 categories,
                           10 tags, 20 posts, comments, subscribers)
```

**Server Actions vs. queries.** Every mutation (`features/*/actions.ts`) is a
`"use server"` function that re-validates input with Zod and re-checks
authorization server-side — nothing trusts the client. Reads live in
`features/*/queries.ts` (or `queries/` folders) as plain async functions,
so they can be called directly from Server Components without the Server
Action wrapper overhead.

## Getting Started

### 1. Prerequisites

- Node.js 20.9+
- A PostgreSQL database (local, [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.)
- A [Clerk](https://dashboard.clerk.com) application
- A [Cloudinary](https://cloudinary.com/console) account

### 2. Install & configure

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, Clerk keys, Cloudinary credentials
```
  
### 3. Set up the database

```bash
npx prisma migrate dev   # creates tables from prisma/schema.prisma
npm run db:seed          # optional: realistic demo content
```

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in with an email listed in
`ADMIN_EMAILS` to get bootstrapped as an Admin and see the `/admin` CMS.

### Other scripts

```bash
npm run build       # production build
npm run start        # run the production build
npm run lint          # ESLint
npm run db:studio     # Prisma Studio (visual DB browser)
```

## What's implemented

**Admin CMS** — dashboard with view/engagement analytics, post
list with status filters + search, categories (nested), tags, authors,
media library, newsletter subscribers, comment moderation, an automated
SEO health audit, and site settings.

**Editor** — headings, lists, tables, code blocks with syntax highlighting
and copy buttons, image upload (drag/drop/paste, straight to Cloudinary),
YouTube/Tweet/video/GitHub embeds, callouts, FAQ blocks, Pros & Cons blocks,
Mermaid diagrams, KaTeX math, a Notion-style `/` command menu, bubble-menu
formatting, autosave, draft/scheduled/published workflow, revision history
with restore, and Markdown import/export.

**Reading experience** — serif article typography, sticky scroll-spy table
of contents, reading progress bar, floating share/bookmark bar, reactions
(like/clap), threaded comments, related articles, prev/next navigation,
recently-viewed, and full dark/light theming.

**SEO + GEO** — per-page dynamic metadata, canonical URLs, Open Graph +
Twitter cards (with dynamically generated fallback OG images),
`sitemap.xml` (with image-sitemap support), `news-sitemap.xml`, `robots.txt`
(explicitly welcoming GPTBot/ClaudeBot/PerplexityBot/etc.), `rss.xml`, and a
full JSON-LD graph (Article, FAQPage, BreadcrumbList, Person, Organization,
WebSite/SearchAction) on every article. Each article also carries
GEO-specific structure: a quotable summary, key takeaways, FAQ, sources,
difficulty level, and reading time — the same content humans read is
structured for machine extraction.

**Performance** — ISR on every public route, streaming `loading.tsx`
skeletons, AVIF/WebP image optimization via `next/image`, Server Components
by default, and 404s that resolve correctly (see the note on soft-404s
below for the one documented trade-off).

## Scheduled publishing

`updatePostStatus` can mark a post `SCHEDULED` with a future `scheduledAt`.
`src/app/api/cron/publish-scheduled/route.ts` flips due posts to
`PUBLISHED`; `vercel.json` runs it every 5 minutes via Vercel Cron. Set
`CRON_SECRET` in your environment — Vercel automatically authenticates cron
requests with it, no extra wiring needed. Self-hosting elsewhere means
calling that endpoint on your own schedule instead.

## Notes on trade-offs

- **Streaming vs. exact 404 status.** Routes with a `loading.tsx` stream
  their response, which means the HTTP status is already committed to `200`
  by the time a `notFound()` call would want to set `404` (this is documented
  Next.js behavior, not a bug). Next.js mitigates this by injecting
  `<meta name="robots" content="noindex">` on the streamed 404 content, and
  this app's `generateMetadata` functions explicitly return
  `{ robots: { index: false, follow: false } }` for missing resources so
  there's never a conflicting robots signal. If you need byte-exact 404
  status codes for compliance/analytics, remove `loading.tsx` from the
  routes where that matters.
- **Seed images.** `prisma/seed.ts` uses Unsplash/Pravatar URLs for quick,
  realistic-looking demo content. `next.config.ts` allow-lists those hosts
  for convenience — swap the seed script (or just re-upload through the
  Media Library) to use Cloudinary-hosted images in a real deployment, and
  remove those two `remotePatterns` entries.

## Deploying

1. Push to GitHub, import the repo in Vercel.
2. Add every variable from `.env.example` in Vercel's Environment Variables.
3. Point `DATABASE_URL` at your production Postgres (Vercel Postgres, Neon,
   Supabase, RDS, …) and run `npx prisma migrate deploy` against it.
4. Set `NEXT_PUBLIC_SITE_URL` to your real domain — it drives canonical
   URLs, sitemaps, and JSON-LD `@id`s.
5. Configure the Clerk webhook (`/api/webhooks/clerk`) in the Clerk
   dashboard so user updates/deletions stay in sync.
6. Vercel Cron picks up `vercel.json` automatically for scheduled
   publishing.
