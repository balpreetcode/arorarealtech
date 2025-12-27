# Arora Realtech Next.js Migration – Technical Guide

This document is intended to be shared with the client as a high‑level yet practical reference for how the migrated site is organised, how content flows through it, and how to operate it going forward.

---

## 1. Solution Overview

- **Stack**: Next.js (App Router) with TypeScript, Prisma ORM, and a PostgreSQL/MySQL database that mirrors the legacy Drupal content.
- **Primary goals**: Maintain the Drupal site’s look & feel while lifting the front end onto a modern stack that supports incremental static regeneration, API-driven content rendering, and automated testing.
- **Repository layout**:
  ```
  app/                App Router pages and layouts
  components/         Reusable UI components
  data/               Static data seeds (if any)
  lib/                Shared utilities (DB, HTML sanitiser, path resolver)
  public/             Static assets (logo, migrated images)
  prisma/             Prisma schema & migrations
  tests/, testscripts Playwright end-to-end tests
  ```

---

## 2. Routing & Content Resolution

### 2.1 App Router entry
- `app/layout.tsx`: Global shell. Injects top utility bar + primary navigation (`NavHeader`), embeds global styles, and wraps all pages.
- `app/[[...slug]]/page.tsx`: Catch‑all route that handles:
  - Rendering the home page (`/`) through the `HomePage` function.
  - Resolving Drupal node pages (properties, news, static pages) via `resolveByPath`.
  - Resolving taxonomy term listings and pagination.

### 2.2 Additional routes
- `app/news/page.tsx`, `app/properties/page.tsx`, `app/news/[slug]/page.tsx`, etc., provide dedicated listing/detail views when needed.
- `app/robots.txt`, `app/sitemap.xml`, and `app/rss.xml` provide SEO artifacts.

---

## 3. Data Layer

- **Database access**: `lib/db.ts` exports a Prisma client configured against the migrated content database.
- **Resolvers**: `lib/resolve.ts` translates clean URLs into Drupal nodes, taxonomy terms, or 404s. It handles menu aliases, term relations, and pagination parameters.
- **Sanitisation**: `lib/html.ts` exposes `sanitizeHtml` (DOMPurify under the hood) for safe rendering of stored HTML snippets.
- **Prisma schema**: Defined in `prisma/schema.prisma`. Migrations in `prisma/migrations/`.

---

## 4. Key Components

| Component / File | Responsibility |
| ---------------- | -------------- |
| `components/NavHeader.tsx` | Desktop & mobile navigation, search form, CTA buttons. |
| `app/layout.tsx` | Utility links (“Useful Websites”, etc.) and global chrome. |
| `PropertyFilters` (if reintroduced) | Category filters for property listings. |
| `app/[[...slug]]/page.tsx` | Homepage sections: hero banner, About/Values rows, property + news decks, business services card, footer. Also renders node & term detail pages. |
| `app/properties/page.tsx` | Paginated property listing view. |
| `app/news/page.tsx` | Paginated news listing with sanitized snippets. |
| `app/not-found.tsx` | Custom 404 screen. |

Each component relies on global styling from `app/globals.css`.

---

## 5. Styling System

- **Global stylesheet**: `app/globals.css` is a hand-authored CSS file that replicates Drupal’s visual language (fonts, colours, spacing, buttons, cards).
- **Responsive behaviour**: Media queries at 1024 px (navigation collapse) and 900 px (utility bar stacking). Mobile menu is an overlay with the same links + CTAs as desktop.
- **Static assets**: Logos and imagery live in `public/`. Migrated hero/section images are under `public/images/home/`.
- **Design parity**: Key match points:
  - White utility header with navy CTA pills.
  - Navy navigation bar with uppercase menu items.
  - Red translucent hero block anchored near the banner base.
  - Bootstrap-like cards for properties/news (borders, uppercase metadata).

---

## 6. Content Management

### 6.1 Home page
Defined directly in `HomePage` within `app/[[...slug]]/page.tsx`. Sections pull from arrays defined in code (`aboutParagraphs`, `businessServices`) plus data fetched from the database (properties, news). To adjust copy or add new static bullet points, edit the relevant arrays.

### 6.2 Dynamic content

- **Properties**: Queried from Prisma (`node` table filtered by type `property`). Listing cards show title, summary, taxonomy tag, and alias links.
- **News**: Three most recent news nodes displayed on the homepage; full list uses `/news`.
- **Terms & nodes**: All other Drupal content is rendered with default templates in the same catch-all file. Body HTML is sanitized before output.

### 6.3 Assets

- Place new hero/teaser images in `public/images/<category>/`. Reference them via `/images/...` URLs.
- Logo (`public/logo.svg`) matches Drupal branding. Replace with like-for-like dimensions if needed.

---

## 7. Configuration & Environment

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Connection string for Prisma client. |
| `NEXT_PUBLIC_SITE_URL` (if used) | Absolute URL for sitemap/feeds. |

See `.env.example` or deployment notes for required values.

---

## 8. Scripts & Tooling

- `npm run dev` – Start the Next.js dev server.
- `npm run build` – Production build (generates static ISR pages + server bundle).
- `npm run start` – Serve the production build.
- `npm run lint` – ESLint with Next.js defaults (`@next/next/no-img-element` warnings remain until we migrate to `next/image`).
- Playwright tests (under `tests/` / `testscripts/`) provide automated UI checks for navigation, hero presence, etc. Run with `npx playwright test`.

---

## 9. Deployment

1. Ensure environment variables are configured (database credentials, site URL).
2. `npm install && npm run build`.
3. Deploy `.next` output on Vercel, Netlify, or a Node server. Prisma requires the database connection at runtime.
4. Revalidation (`export const revalidate = 3600`) keeps content fresh hourly; adjust as needed.

---

## 10. Known Differences vs Drupal

- **Images**: Currently rendered with `<img>`; Next.js warns to use `next/image` for optimisation. This is safe but flagged during linting.
- **Search form**: Replicates Drupal layout visually, but search functionality expects `/search/node` to be implemented (via legacy redirect or API).
- **Utility links/menus**: Mirrored from Drupal. Update arrays in `NavHeader.tsx` for label/href changes.

---

## 11. Maintenance Checklist

- **Adding a new navigation link**: Update `PRIMARY_LINKS` in `components/NavHeader.tsx`.
- **Changing hero copy**: Edit `hero-card` content inside `HomePage` (app/[[...slug]]/page.tsx).
- **Updating service list**: Modify the `businessServices` array in the same file.
- **Running migrations**: `npx prisma migrate dev` (development) or `npx prisma migrate deploy` (production).
- **Testing visual regression**: Run Playwright suites (`tests/ui-visual-review.spec.ts` etc.).

---

## 12. Next Steps / Recommendations

1. **Swap to `next/image`** for hero, teaser, card images to clear lint warnings and leverage automatic optimisation.
2. **Automate content sync**: If Drupal remains a source of truth during transition, create scripts to ingest/export updates regularly.
3. **Enhance search**: Integrate an API-backed search endpoint to replace the legacy Drupal search route.
4. **Performance audit**: After deployment, run Lighthouse against critical pages to ensure parity or improvement over the Drupal baseline.

---

This documentation should give stakeholders and developers the context they need to operate, extend, and troubleshoot the Next.js migration with confidence. Reach out if further training or walkthrough sessions are required.

