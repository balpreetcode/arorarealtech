# Arora Realtech Next.js Migration – Comprehensive Technical & Operations Manual

This document expands on the standard project readme and is meant for stakeholders who need a deep understanding of architecture, UI behaviour, backend integrations, deployment practices, and ongoing administration. It describes every major surface of the application so changes can be executed confidently without referring back to the legacy Drupal codebase.

---

## 1. Executive Summary

- **Objective**: Rebuild the public marketing site of Arora Realtech in Next.js while preserving the Drupal visual identity and content hierarchy.
- **Key Benefits**: Modernised stack, faster load times via ISR, simplified hosting, cleaner component architecture, reusable UI blocks, easier integration with future APIs.
- **Primary Artefacts**:
  - `app/` folder containing all routes and the App Router implementation.
  - `components/` for reusable UI widgets, led by a configurable navigation header.
  - `prisma/` schema + migrations for the migrated Drupal content database.
  - Global styles (`app/globals.css`) that replicate the Drupal theme without relying on Bootstrap.

---

## 2. Architecture Overview

### 2.1 High-Level Diagram (Textual)

```
[Browser]
   ↓
Next.js App Router (Vercel/Node runtime)
   ↓                        ↘
Prisma Client ---------  Static Asset CDN (`/public`)
   ↓
Managed SQL Database (migrated Drupal data)
```

### 2.2 Front-End Runtime
- **Framework**: Next.js 14 (App Router) with TypeScript for type safety.
- **Rendering Strategy**:
  - Static generation with Incremental Static Regeneration (`revalidate = 3600`) for most routes.
  - Dynamic rendering triggered for catch-all routes when visiting unseen slugs.
- **State**: No client-side global state library is used; pages are server-rendered with content fetched via Prisma.
- **Routing**: `app/[[...slug]]/page.tsx` interprets clean URLs and chooses the correct view (home, node detail, taxonomy listing).

### 2.3 Backend Integration
- **Database**: SQL database populated with exported Drupal content structured to match Prisma schema.
- **ORM**: Prisma Client handles type-safe queries. Connection pooling is handled via `lib/db.ts`, which caches the client across hot reloads.
- **Content Model**:
  - `Node` table for pages, properties, and news.
  - `TaxonomyTerm` for categories (e.g., property types, news tags).
  - `UrlAlias` reproduces Drupal path aliases.
  - `NodeTerm` join table linking nodes to terms.
- **Sanitisation**: All HTML retrieved from the database is sanitised using the `sanitizeHtml` utility to avoid XSS.

### 2.4 Caching & Revalidation
- Pages regenerate every 60 minutes. This protects against stale content while keeping performance predictable.
- For urgent updates, administrators can trigger a deployment or use Next.js on-demand revalidation (endpoint can be added later).

### 2.5 Error Handling & Observability
- Try/catch blocks in resolver functions prevent the UI from crashing when a slug is missing; users receive a 404 via `app/not-found.tsx`.
- Logging hooks should be added (e.g., `pino`, `Sentry`) in production; placeholders are noted in future roadmap.

---

## 3. UI Implementation Details

### 3.1 Global Layout (`app/layout.tsx`)
- Applies the utility bar and imports `NavHeader` for all routes.
- Hosts the `<body>` wrapper with consistent font stack.
- Utility bar replicates Drupal links/CTAs and can be edited directly in this file.

### 3.2 Navigation System (`components/NavHeader.tsx`)
- **Desktop Row**: Left-aligned logo, centered search form (with icon), right-aligned hamburger (hidden on desktop) that collapses to mobile view.
- **Menu Band**: Navy background, uppercase menu items defined in `PRIMARY_LINKS` array.
- **Mobile Drawer**: Triggered below 1024px, includes search field, CTA buttons, and stacked links.
- **Responsiveness**: `useEffect` closes the drawer on route change or when viewport expands beyond desktop breakpoint.

### 3.3 Home Page Sections (`app/[[...slug]]/page.tsx`)
1. **Hero Banner**
   - Background image served from `/public/images/home/gurugram-hero.jpg`.
   - Overlay card near bottom with translucent red background to match Drupal hero.
   - CTA anchored to `/about-us`.
2. **About & Values Media Rows**
   - Uses `.teaser` classes for two mirrored sections (image left/right, copy opposite).
   - Content stored in arrays for easy modification.
3. **Recent Properties Grid**
   - Fetches 20 latest property nodes.
   - Cards contain date, summary (180 char limit), and alias-driven link.
   - CTA to `/properties` when more items exist.
4. **News Highlights**
   - Similar card layout with sanitized `summary` HTML.
   - CTA to `/news`.
5. **Business Services**
   - Bullet list of services, editable in `businessServices` array.
6. **Footer**
   - Reuses legacy content: logo, contact methods, social links.
   - Auto-updating copyright year.

### 3.4 Listing Pages
- **Properties (`app/properties/page.tsx`)**
  - Pagination computed from `count` / `skip` / `take`.
  - `buildPagination` helper creates page numbers, next/previous links.
- **News (`app/news/page.tsx`)**
  - Similar structure, uses sanitized snippet fallback when summary missing.

### 3.5 Detail Pages
- **Property Detail**
  - Hero with background image and overlay meta.
  - Breadcrumb computed from node’s alias & taxonomy terms.
  - Contact sidebar includes static agent info, phone, WhatsApp prefilled message, email.
- **Default Node Detail**
  - Used for news detail, about pages, etc.
  - Displays author, date, summary (optional), sanitized body content.

### 3.6 Forms & CTAs
- **Search form**: Submits to `/search/node`, matching Drupal’s search behaviour. Back-end endpoint available for integration/migration later.
- **CTA Buttons**: `.btn` class replicates Bootstrap look without dependency.
- **Header Pill Buttons**: `.top-button` and `.nav-btn` provide rounded CTA styling for WhatsApp and call actions.

### 3.7 Accessibility & Responsive Notes
- All interactive elements have accessible names (`aria-label` on external links, hamburger toggle).
- Layout adjusts at 600px, 768px, 900px, and 1024px.
- Focus outline preserved via default browser styles.
- Hero uses text with sufficient contrast against translucent overlay.

### 3.8 Asset Management
- Location: `public/images/home/` for hero, teaser, and services imagery.
- Additional assets can be dropped into `public/` and referenced via `/images/...` path.
- Logo matches Drupal’s `logo.svg`; replacing should maintain similar aspect ratio.

---

## 4. Backend & Data Services

### 4.1 Database Schema Summary

| Table | Purpose | Key Columns |
| ----- | ------- | ----------- |
| `Node` | Stores all Drupal nodes. | `type`, `slug`, `title`, `summary`, `bodyHtml`, `imageUrl`, `createdAt`, `published` |
| `TaxonomyTerm` | Stores taxonomy terms. | `vocabulary`, `slug`, `name`, `description` |
| `NodeTerm` | Join table linking nodes to taxonomy. | `nodeId`, `termId` |
| `UrlAlias` | Preserves Drupal path aliases. | `sourcePath`, `targetType`, `targetId` |
| `MenuLink` *(optional future)* | Potential table if Drupal menus are imported for dynamic navigation. |

### 4.2 Prisma Usage
- Prisma client initialised in `lib/db.ts` with global caching to avoid repeated instantiation.
- Query patterns:
  - `findMany` with `take`/`skip` for pagination.
  - `count` to calculate total pages.
  - `select` to limit payload (e.g., only fields needed for cards).
  - `where` filters for `type`, `published`, taxonomy vocabulary.
- All queries return plain JS objects consumed by React components without additional serialisation.

### 4.3 Content Synchronisation
- Current build assumes content migrated into Prisma database with minimal updates.
- For ongoing sync with Drupal, recommended approach:
  1. Export Drupal nodes/terms via scheduled job.
  2. Run ETL script to insert/update Prisma DB.
  3. Trigger site revalidation or rebuild.
- Future enhancement: create `/api/revalidate` endpoint to refresh specific slugs when Drupal content changes.

### 4.4 Sanitisation & Validation
- Sanitize HTML using `sanitizeHtml` helper before injecting into `dangerouslySetInnerHTML` blocks.
- Slugs vetted in `resolveByPath`; unknown slugs result in 404.
- `inferLocation` helper for property detail pulls location strings from node metadata or fallback to path segments.

### 4.5 Search Endpoint Placeholder
- Search form currently posts to `/search/node`, matching Drupal path. For a native Next.js solution:
  - Create `app/api/search/route.ts` to accept query parameters.
  - Use Prisma full-text search or integrate with external service (Algolia, Elasticsearch).
  - Update form action to new endpoint.

### 4.6 Error Handling
- `resolveByPath` throws descriptive errors that are caught upstream to avoid user-facing stack traces.
- Unknown content types fall back to generic message (`Content not found`).
- Logging suggestions: integrate `@vercel/og`, `pino`, or `Sentry` for runtime tracking.

---

## 5. Deployment & Environment Management

### 5.1 Environment Matrix

| Environment | Purpose | Notes |
| ----------- | ------- | ----- |
| Local | Developer workstation | `.env` with local/remote DB; run `npm run dev`. |
| Staging | QA/UAT | Mirror production DB (read replica) or subset; run full regression before release. |
| Production | Live site | Hosted on Vercel, Netlify, or custom Node server with access to managed SQL instance. |

### 5.2 Required Environment Variables

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `DATABASE_URL` | Connection string for Prisma (PostgreSQL/MySQL). | `postgresql://user:pass@host:5432/realtech` |
| `NEXT_PUBLIC_SITE_URL` | Optional; used when generating absolute URLs for sitemap/RSS. | `https://arorarealtech.com` |
| `SENTRY_DSN`, `LOGTAIL_SOURCE_TOKEN` | Optional instrumentation tokens (future). | `https://...` |

### 5.3 Build & Release Workflow
1. Checkout branch, ensure lint/tests pass: `npm run lint`, `npx playwright test`.
2. Push to remote; CI (GitHub Actions, Vercel) runs the same checks.
3. Build command: `npm run build`.
4. Deployment command: `npm run start` for Node target or Vercel auto deploy.
5. After deploy, confirm revalidation window (1 hour) is acceptable; manual revalidate available via redeploy.

### 5.4 Asset & Static File Deployment
- Assets in `public/` are served via CDN automatically.
- For large media, consider external storage (S3, Cloudinary) and store URLs in the DB.

### 5.5 Monitoring & Alerting Recommendations
- Add realtime error logging (Sentry) and performance monitoring (Vercel Analytics or Datadog).
- Implement uptime checks (Pingdom, UptimeRobot) hitting the health endpoint (create `/api/health` returning 200). 

### 5.6 Rollback Plan
- Maintain previous deployment on platform (Vercel keeps previous builds). Roll back via UI if regression detected.
- Keep database backups before schema changes using managed provider snapshots.

---

## 6. Administration & Operations Guide

### 6.1 Updating Navigation, Utility Links, and CTAs
- **Utility bar**: Edit `<ul className="top-links">` and `<ul className="top-actions">` in `app/layout.tsx`.
- **Primary navigation**: Update `PRIMARY_LINKS` in `components/NavHeader.tsx`.
- **CTA labels**: Header CTAs appear both in utility bar and NavHeader mobile drawer; update both occurrences to keep parity.

### 6.2 Editing Copy & Section Content
- Hero, About, Values copy: `HomePage` function arrays (`aboutParagraphs`, `buyerMessage`, `sellerMessage`).
- Business services list: `businessServices` array.
- Footer contact info: Footer JSX block inside `HomePage` near bottom of file.
- Standard page content (About Us, Contact) is stored in the Prisma DB; update via DB migration script or admin tool once built.

### 6.3 Managing Assets & Media
- Add new images to `public/images/...` and reference by `/images/...` path.
- For hero replacements, use high-resolution (≥1920px) and optimise (WebP/JPEG) to keep file sizes reasonable.
- Consider adding an `images` subfolder per page/section for organisation.

### 6.4 Database Administration
- Backups: Configure automatic daily backups through DB provider.
- Schema updates: Modify `prisma/schema.prisma`, run `npx prisma migrate dev --name <feature>` for local changes, `npx prisma migrate deploy` in production.
- Data seeding: Use `prisma/seed.ts` to populate baseline terms or configuration (optional, currently not required).

### 6.5 User & Access Management
- Currently no authentication layer for the public site. If an admin UI is added, integrate NextAuth or custom solution.
- For DB access, enforce least-privilege credentials: read-only for production site, read-write for migration scripts.

### 6.6 Incident Response
- 404 or missing content: verify alias mapping in `UrlAlias` table; update if slug changed.
- Broken images: ensure assets exist in `public/` or DB image URLs are correct.
- Slow performance: check DB indexes on `slug`, `type`, `published`; add missing indexes via Prisma migration.

### 6.7 Release Checklist
1. Merge PR with latest content/components.
2. Run `npm run lint` and `npx playwright test` locally.
3. Ensure environment variables are present in target environment.
4. Deploy to staging; validate navigation, hero, news and property detail flows.
5. Release to production; run smoke test across desktop/mobile.
6. Communicate release via internal channels, include rollback plan.

---

## 7. Testing & Quality Assurance

### 7.1 Automated Tests
- **Linting**: `npm run lint` uses Next.js ESLint config. Current warnings highlight `<img>` usage; plan migration to `next/image`.
- **Playwright**: Suites under `tests/` verify
  - Header navigation opens/closes correctly on desktop and mobile.
  - Hero text and CTA presence.
  - Property/news cards render correct copy.
  - External links open in new tabs.

### 7.2 Manual QA
- Responsive snapshots at 320, 768, 1024, 1440 px.
- Content parity check between Drupal and Next.js for top pages.
- Accessibility check using Lighthouse (expect >90 score).
- Form submission (search) returns expected results (once API available).

### 7.3 Performance Benchmarks
- Target metrics:
  - Largest Contentful Paint < 2.5s on 4G (hero image optimised).
  - Time to First Byte < 0.5s (ISR cached pages).
  - CLS near zero (layout stable due to fixed heights and fonts loaded via `<link rel="preconnect">`).

---

## 8. Future Enhancements & Roadmap

| Priority | Enhancement | Description |
| -------- | ----------- | ----------- |
| High | `next/image` adoption | Resolve lint warnings, add responsive `Image` component with blur placeholders. |
| High | On-demand revalidation endpoint | `/api/revalidate` triggered by admin tool or webhook after DB updates. |
| Medium | Search API implementation | Replace `/search/node` with serverless search using Prisma full-text or external index. |
| Medium | Global configuration CMS | Use Sanity/Strapi to manage hero copy, service lists, navigation links without code changes. |
| Low | Analytics integration | Add GA4 or privacy-friendly alternative with consent banner. |
| Low | Internationalisation | Prepare for multilingual content by extracting strings and using `next-intl`. |

---

## 9. Appendices

### 9.1 Command Reference
- `npm run dev` – start local dev server.
- `npm run build` – compile production bundle.
- `npm run start` – serve compiled app.
- `npm run lint` – lint TypeScript/React files.
- `npx prisma studio` – open Prisma data explorer (read/write). Use cautiously on production DB.
- `npx prisma migrate dev --name <change>` – create migration locally.
- `npx prisma migrate deploy` – apply migrations in staging/production.

### 9.2 File References at a Glance

| File | Description |
| ---- | ----------- |
| `app/layout.tsx` | Root layout, utility bar, global shell. |
| `components/NavHeader.tsx` | Navigation component with desktop/mobile logic. |
| `app/[[...slug]]/page.tsx` | Catch-all route containing `HomePage`, `DefaultNodePage`, `PropertyDetailPage`, `TermPage`. |
| `app/news/page.tsx` | Paginated news listing. |
| `app/properties/page.tsx` | Paginated properties listing. |
| `lib/resolve.ts` | URL resolution logic mapping slugs to nodes/terms. |
| `lib/html.ts` | HTML sanitisation utility. |
| `lib/db.ts` | Prisma client bootstrap. |
| `app/globals.css` | Master stylesheet replicating Drupal theme. |
| `public/images/home/` | Hero/teaser images used on homepage. |

---

With this manual, teams across engineering, content, and operations should be able to locate the relevant files, understand how data flows from the database to rendered pages, modify UI and copy safely, and deploy updates with confidence. For any clarifications or walkthroughs, please coordinate with the project engineering lead.
