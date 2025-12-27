# Arora Realtech Next.js Migration – Detailed Technical & Content Documentation

This document expands on the high-level guide and walks through each screen, component, and supporting system in detail. It is intended for designers, content editors, and engineers who will maintain or extend the migrated site.

---

## Table of Contents
1. [Application Architecture](#application-architecture)
2. [Global Utilities & Layout](#global-utilities--layout)
3. [Screens & Page Flows](#screens--page-flows)
   - [Home (`/`)](#home-)
   - [Property Listings (`/properties`)](#property-listings-properties)
   - [Property Detail (`/properties/[slug]`)](#property-detail-propertiesslug)
   - [News Listing (`/news`)](#news-listing-news)
   - [News Detail (`/news/[slug]`)](#news-detail-newsslug)
   - [Static Nodes (About, Contact, etc.)](#static-nodes)
   - [Taxonomy Listings (`/[term]`)](#taxonomy-listings-term)
   - [404 / Not Found](#404--not-found)
4. [Component Library](#component-library)
5. [Styling & Theming](#styling--theming)
6. [Data Model & Content Sources](#data-model--content-sources)
7. [Environments, Configuration & Deployment](#environments-configuration--deployment)
8. [Testing & Quality Gates](#testing--quality-gates)
9. [Maintenance Playbook](#maintenance-playbook)
10. [Future Enhancements](#future-enhancements)

---

## Application Architecture

| Layer | Description |
| ----- | ----------- |
| Next.js App Router | All routes use the file-based App Router. `app/[[...slug]]/page.tsx` handles the majority of content rendering by mapping slugs to Drupal nodes/terms. |
| Prisma | Prisma Client (`lib/db.ts`) connects to the migrated Drupal database, exposing typed queries for nodes, taxonomy terms, and aliases. |
| ISR | Key pages export `revalidate = 3600`, allowing incremental static regeneration every hour. |
| Sanitisation | `sanitizeHtml` from `lib/html.ts` ensures Drupal-provided HTML is safe to render. |
| Assets | Static files live in `public/`; Next.js serves them at root (`/logo.svg`, `/images/...`). |

The repo structure:

```
app/
  layout.tsx               // Global shell, utility bar, <NavHeader />
  globals.css              // Master stylesheet
  [[...slug]]/page.tsx     // Catch-all for homepage, node, term
  news/..., properties/... // Dedicated listing pages
components/
  NavHeader.tsx            // Navigation & search
  (space for shared UI blocks if added later)
lib/                       // DB client, resolve utilities, helpers
prisma/                    // Schema & migrations
public/                    // logo, hero images, favicons
tests/                     // Playwright specs
```

---

## Global Utilities & Layout

### `app/layout.tsx`
- Wraps all pages.
- Injects:
  - **Utility bar**: “Useful Websites”, “Gurgaon Maps”, “Frequently Used Documents” + CTA pills (`Chat on Whatsapp`, `Call us`). Links editable directly in this file.
  - **`<NavHeader />`** component.
  - `<body>` also loads `app/globals.css`.

### `app/globals.css`
- Defines typography (Google Open Sans + legacy fallbacks), colour palette, button styles, layout utilities, responsive breakpoints, hero/image styling, cards, and footer.
- Media queries around 600 px, 768 px, 900 px, 1024 px adapt header, hero, grid layouts, and property/news sections.

### `components/NavHeader.tsx`
- Desktop:
  - White header row with logo, search field (with inline icon), hamburger toggle (hidden on large screens).
  - Navigation band below (navy background) containing uppercase links and CTA pills.
- Mobile:
  - Hamburger reveals overlay drawer with search, CTAs, and stacked menu links.
- Links defined in `PRIMARY_LINKS`. Update labels/URLs here when menu changes.

### `lib/resolve.ts`
- Exposes `resolveByPath` which:
  1. Looks up URL aliases from `urlAlias` table.
  2. Fetches nodes or taxonomy terms, including relationships.
  3. Returns typed objects consumed by `page.tsx`.

### `lib/db.ts`
- Reuses a single Prisma client (`globalThis` guard) to prevent hot-reload connection exhaustion during development.

---

## Screens & Page Flows

### Home (`/`)
**Entry**: `HomePage` function inside `app/[[...slug]]/page.tsx`.

**Sections & Data Requirements**
1. **Hero Banner**
   - Background Image: `/images/home/gurugram-hero.jpg`.
   - Overlay block content is hard-coded (update inside `HomePage`).
   - CTA: `Read more` -> `/about-us`.
   - Styles: `.hero-banner`, `.hero-card` (translucent rgba background, bottom alignment).

2. **About / Values Media Rows**
   - Two `teaser` blocks.
   - Copy stored in arrays: `aboutParagraphs`, `buyerMessage`, `sellerMessage`.
   - Images: `/images/home/neon.jpg`, `/images/home/aaron.jpg`.

3. **Recent Properties**
   - Prisma query fetches 20 latest property nodes.
   - Alias from `urlAlias` ensures Drupal-friendly path.
   - Summary truncated to 180 chars.
   - Cards styled via `.card-*` classes; CTA `Read more` -> detail page.
   - Fallback message when no records.

4. **News Highlights**
   - Fetches three recent news nodes.
   - Summary sanitized HTML snippet (if available) rendered with `dangerouslySetInnerHTML`.
   - CTA `Read more News` -> `/news`.

5. **Business Services**
   - List from `businessServices` array.
   - CTA `Read more About us`.

6. **Footer**
   - Static structure replicates Drupal footer.
   - Uses current year via `new Date().getFullYear()`.

### Property Listings (`/properties`)
**File**: `app/properties/page.tsx`.

**Behaviour**:
- Pagination: 12 items per page (`PROPERTIES_PER_PAGE` constant).
- Query includes taxonomy tags, summary, hero image.
- Cards show date, type tag, truncated summary, CTA.
- Query string `?page=n` controls pagination; uses `buildPagination` helper for numbered links.

### Property Detail (`/properties/[slug]`)
**Handled via**: `PropertyDetailPage` exported from `app/[[...slug]]/page.tsx` when `node.type === 'property'`.

**Features**:
- Header hero with background image (node image if provided, else fallback).
- Breadcrumbs built from taxonomy and path segments.
- Summary block, sanitized body content.
- Sidebar:
  - Property details list (location, type, listing ID, published date).
  - Contact card with static agent info (phone, WhatsApp prefilled message, email).
  - Tags list.
- Layout utilises `.property-detail-*` classes for carded sections.

### News Listing (`/news`)
**File**: `app/news/page.tsx`.

**Highlights**:
- Pagination similar to properties (`NEWS_PER_PAGE` = 12).
- Each card shows title, date, sanitized summary snippet, CTA.
- `buildPagination` helper yields previous/next links where appropriate.

### News Detail (`/news/[slug]`)
**Handled via**: default node rendering when `node.type === 'news'`.
- `DefaultNodePage` component shows hero image, meta (author, date), summary, body, attachments (if present).
- Body sanitized before rendering.

### Static Nodes
**Examples**: `/about-us`, `/contact-us`, `/maps`, etc.
- Render with `DefaultNodePage` (same structure as news detail).
- Content sourced from Drupal node body/fields.

### Taxonomy Listings (`/[term]`)
**Handled via**: `TermPage` in `app/[[...slug]]/page.tsx`.
- Displays term name, description, list of associated nodes with title, image (if available), summary, date.
- Pagination (`Page {current} of {total}` with prev/next links).

### 404 / Not Found
**File**: `app/not-found.tsx`.
- Styled message encouraging navigation via top menu.
- Next.js automatically serves this page for unmatched routes after resolver attempts.

---

## Component Library

| Component | File | Usage |
| --------- | ---- | ----- |
| `NavHeader` | `components/NavHeader.tsx` | Top navigation and mobile drawer. |
| `PropertyFilters` (optional) | `components/PropertyFilters.tsx` | Currently removed from homepage; can be reintroduced to filter property cards by taxonomy. |
| Footer (inline) | Within `HomePage` | Contains brand logo, social links, email. |
| Card styles | CSS classes `.card`, `.card-img`, `.card-date` etc. | Used for property/news lists, reuse for future cards. |

Custom components can be added under `components/` and imported where needed.

---

## Styling & Theming

### Colours
- Primary navy `#002664`, secondary red `#d7153a`, accent green `#25d366` for WhatsApp.
- Background neutrals: `#e5e9ef`, `#f8f9fb`.

### Typography
- `Open Sans` (400/600/700) with legacy fallback stack containing “Gotham A/B”.
- Headings use heavier weights to mimic Drupal theme.

### Buttons
- Base `.btn` style with square corners (0.25rem radius) to match Drupal.
- Variants: `.btn-primary`, `.btn-secondary`, `.btn-outline-primary`, `.btn-light`.
- Header CTAs (`.nav-btn`) retain pill shapes to match existing UI.

### Responsive Considerations
- Header:
  - At ≤1024 px, navigation collapses into hamburger overlay.
  - Utility bar stacks links & CTAs vertically for narrow screens.
- Cards:
  - `.card-grid` uses `repeat(auto-fit, minmax(280px, 1fr))`.
  - On mobile, declared width 1fr.
- Hero:
  - `.hero-image` height 320px mobile, 650px desktop.
  - `.hero-overlay` bottom aligned with dynamic padding.

---

## Data Model & Content Sources

### Prisma Schema Highlights

| Model | Key Fields | Notes |
| ----- | ---------- | ----- |
| `Node` | `id`, `type`, `title`, `slug`, `summary`, `bodyHtml`, `imageUrl`, `createdAt`, `published` | Represents Drupal nodes (property, news, basic pages). |
| `TaxonomyTerm` | `id`, `name`, `slug`, `vocabulary` | Terms for property categories, etc. |
| `NodeTerm` | `nodeId`, `termId` | Join table linking nodes to taxonomy terms. |
| `UrlAlias` | `sourcePath`, `targetType`, `targetId` | Maintains Drupal-friendly URLs. |

### Queries & Helpers
- Home `recentNodes`: `node.findMany` with `type: 'property', take: 20`.
- Home `newsNodes`: `node.findMany` with `type: 'news', take: 3`.
- Listings: `.count` + `.findMany` with `skip` & `take` for pagination.
- Property detail: Additional logic to determine location string (`inferLocation` helper).
- `sanitizeHtml`: ensures no script tags or malicious markup from Drupal enters the DOM.

---

## Environments, Configuration & Deployment

### Environment Variables
- `DATABASE_URL` – Prisma connection string.
- (Optional) `NEXT_PUBLIC_SITE_URL` – Used for absolute URLs in SEO routes if configured.
- Additional envs (email, analytics) can be added to `.env` as required.

### Local Setup
1. `npm install`
2. Create `.env` with `DATABASE_URL`.
3. `npx prisma migrate deploy` or `npx prisma db push` depending on migration strategy.
4. `npm run dev`.

### Build / Deploy
1. `npm run build`
2. `npm run start` (on Node server) OR deploy to Vercel/Netlify by connecting repo.
3. Ensure environment variables configured in hosting provider.
4. Database must be reachable from host (configure IP allowlist if needed).

---

## Testing & Quality Gates

### ESLint
- Run `npm run lint`. Current warnings:
  - `@next/next/no-img-element` (expected until we replace with `next/image`).

### Playwright
- Tests under `tests/` and `testscripts/`.
- Example checks:
  - Header nav toggles.
  - Hero presence.
  - Menu items open correct pages.
- Run `npx playwright test`.

### Manual QA Checklist
- Verify all navigation links open correct pages (including external review link).
- Test hero CTA, property card CTA, news card CTA.
- Confirm search form submits to `/search/node`.
- Check mobile menu open/close and overlay.
- Inspect hero overlay positioning at 320px, 768px, 1024px, 1440px.
- Validate property detail contact actions (phone, WhatsApp, email).

---

## Maintenance Playbook

| Task | Location |
| ---- | -------- |
| Update top utility links or CTAs | `app/layout.tsx` |
| Change navigation menu items | `components/NavHeader.tsx` (`PRIMARY_LINKS`) |
| Edit hero copy, about/values text | `HomePage` in `app/[[...slug]]/page.tsx` |
| Add new homepage hero/teaser image | Place file in `public/images/home/`, update `<img>` references |
| Modify property/news card styling | `app/globals.css` `.card-*` rules |
| Adjust pagination size | `NEWS_PER_PAGE` / `PROPERTIES_PER_PAGE` constants |
| Add new page type | Extend `resolveByPath` & conditional rendering in `page.tsx` |
| Change footer links/contact info | Footer block inside `HomePage` |
| Clear ISR cache immediately (after content updates) | Trigger rebuild or use Next.js On-Demand Revalidation endpoint (if configured) |

---

## Frontend Development Guide

This section provides detailed code examples and documentation for frontend development.

### Project Structure

```
app/
├── layout.tsx                   # Root layout with global components
├── globals.css                  # Global styles and CSS variables
├── [[...slug]]/page.tsx         # Catch-all dynamic route
├── properties/
│   └── page.tsx                 # Property listings
├── news/
│   └── page.tsx                 # News listings
└── not-found.tsx                # 404 page

components/
├── NavHeader.tsx                # Main navigation component

lib/
├── db.ts                        # Prisma client configuration
├── resolve.ts                   # Content resolution logic
└── html.ts                      # HTML utility functions
```

### 1. Root Layout Component

**File**: `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import './globals.css';
import NavHeader from '@/components/NavHeader';

export const metadata: Metadata = {
  title: 'Arora Real Tech - Property Listings in Gurugram',
  description: 'Find your dream property in Gurugram with Arora Real Tech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Top utility bar with quick links and CTAs */}
        <div className="top-bar">
          <div className="page-container top-bar-container">
            <ul className="top-links">
              <li>
                <a href="/websites">Useful Websites</a>
              </li>
              <li>
                <a href="/maps">Gurgaon Maps</a>
              </li>
              <li>
                <a href="/important-documents">Frequently Used Documents</a>
              </li>
            </ul>
            <ul className="top-actions">
              <li>
                <a
                  className="top-button whatsapp"
                  href="https://wa.me/919811586101?text=I%27m%20inquiring%20about%20the%20property%20listing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on Whatsapp
                </a>
              </li>
              <li>
                <a className="top-button call" href="tel:+919811586101">
                  Call us
                </a>
              </li>
            </ul>
          </div>
        </div>
        {/* Main navigation header */}
        <NavHeader />
        {/* Page content */}
        {children}
      </body>
    </html>
  );
}
```

**Key Features**:
- Global metadata configuration for SEO
- Utility bar with quick links
- WhatsApp and call-to-action buttons
- Main navigation component
- Consistent HTML structure across all pages

### 2. Navigation Header Component

**File**: `components/NavHeader.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Primary navigation links
const PRIMARY_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/properties', label: 'PROPERTIES' },
  { href: '/maps', label: 'GURUGRAM MAPS' },
  { href: '/news', label: 'NEWS' },
  {
    href: 'https://www.google.com/search?q=arora+realtech&...',
    label: 'CUSTOMER REVIEWS',
    external: true,
  },
  { href: '/about-us', label: 'ABOUT US' },
  { href: '/contact-us', label: 'CONTACT US' },
];

export default function NavHeader(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on desktop resize
  useEffect(() => {
    const listener = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, []);

  return (
    <header className="nav-header">
      <div className="nav-header-top">
        <div className="page-container nav-top-row">
          {/* Logo */}
          <a href="/" className="nav-logo" aria-label="Arora Realtech home">
            <img src="/logo.svg" alt="Arora Realtech" />
          </a>

          {/* Desktop search form */}
          <form className="nav-search nav-search--desktop" action="/search/node" method="get">
            <label className="sr-only" htmlFor="nav-search-desktop">
              Search the site
            </label>
            <input
              type="search"
              id="nav-search-desktop"
              name="keys"
              placeholder="Search"
              autoComplete="off"
            />
          </form>

          {/* Mobile menu toggle button */}
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span aria-hidden="true" className={`nav-toggle-bar ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Desktop navigation menu */}
      <div className="nav-main">
        <div className="page-container nav-main-inner">
          <ul className="nav-menu nav-menu--desktop">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : undefined)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <div
        id="mobile-navigation"
        className={`mobile-menu ${menuOpen ? 'open' : ''}`}
      >
        <div className="mobile-menu-inner">
          {/* Mobile search form */}
          <form className="nav-search nav-search--mobile" action="/search/node" method="get">
            <label className="sr-only" htmlFor="nav-search-mobile">
              Search the site
            </label>
            <input
              type="search"
              id="nav-search-mobile"
              name="keys"
              placeholder="Search"
              autoComplete="off"
            />
          </form>

          {/* Mobile CTAs */}
          <ul className="nav-cta nav-cta--mobile">
            <li>
              <a
                className="nav-btn whatsapp"
                href="https://wa.me/919811586101?text=I%27m%20inquiring%20about%20the%20property%20listing"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on Whatsapp
              </a>
            </li>
            <li>
              <a className="nav-btn call" href="tel:+919811586101">
                Call us
              </a>
            </li>
          </ul>

          {/* Mobile navigation links */}
          <ul className="nav-menu nav-menu--mobile">
            {PRIMARY_LINKS.map((link) => (
              <li key={`mobile-${link.href}`}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : undefined)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
```

**Key Features**:
- Responsive navigation with mobile hamburger menu
- Client-side state management using hooks
- Accessibility attributes (aria-label, aria-expanded, aria-controls)
- Dynamic class toggling for menu animations
- External link handling with proper security attributes

### 3. Dynamic Page Routing

**File**: `app/[[...slug]]/page.tsx`

```typescript
import { resolveByPath } from '@/lib/resolve';
import type { ResolvedNode, ResolvedTerm } from '@/lib/resolve';
import { sanitizeHtml } from '@/lib/html';
import prisma from '@/lib/db';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Incremental Static Regeneration - rebuild every hour
export const revalidate = 3600;

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = resolvedParams.slug || [];
  const path = '/' + slug.join('/');

  // Render homepage for root path
  if (path === '/') {
    return <HomePage />;
  }

  // Resolve content based on path
  const content = await resolveByPath(path, resolvedSearchParams);

  if (content.type === 'node') {
    return <NodePage content={content} path={path} />;
  } else if (content.type === 'term') {
    return <TermPage content={content} />;
  }

  return <div>Content not found</div>;
}

async function HomePage() {
  // Fetch recent property listings
  const recentNodes = await prisma.node.findMany({
    where: {
      published: true,
      type: 'property',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      imageUrl: true,
      createdAt: true,
      nodeTerms: {
        where: {
          term: {
            vocabulary: 'property',
          },
        },
        select: {
          term: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Get URL aliases for properties
  const nodeIds = recentNodes.map((n) => n.id);
  const aliases = await prisma.urlAlias.findMany({
    where: {
      targetId: { in: nodeIds },
      targetType: 'node',
    },
    select: {
      targetId: true,
      sourcePath: true,
    },
  });

  const aliasMap = new Map(aliases.map((a) => [a.targetId, a.sourcePath]));

  // Placeholder images for properties
  const placeholderImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
  ];

  // Fetch recent news
  const newsNodes = await prisma.node.findMany({
    where: {
      published: true,
      type: 'news',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  const newsAliases = newsNodes.length
    ? await prisma.urlAlias.findMany({
        where: {
          targetId: { in: newsNodes.map((n) => n.id) },
          targetType: 'node',
        },
        select: {
          targetId: true,
          sourcePath: true,
        },
      })
    : [];

  const newsAliasMap = new Map(newsAliases.map((item) => [item.targetId, item.sourcePath]));

  // Static content arrays
  const aboutParagraphs = [
    'Arora Realtech is a leading Real Estate Consultancy Organization in Gurugram, serving its clients for over two decades under the leadership of Dr. Arun Arora.',
    'We provide smarter, faster and reliable solutions for your property needs across residential, commercial, industrial and institutional segments.'
  ];

  const buyerMessage =
    'If you are a potential buyer then we support your efforts right from identification to acquisition of a specific property of your choice according to your budget and need.';

  const sellerMessage =
    'If you are a potential seller, we help you get the best price for your property and assure you of the transparency and safety of the deal.';

  const businessServices = [
    'Sale & Purchase of Plots – Residential, Commercial, Agricultural and Industrial',
    'Sale and Purchase of Apartments',
    'Renting – Residential, Commercial & Industrial',
    'Pre-rented Property – Investment & Ready Income',
    'Construction Services',
    'Interior Designing & Architectural Services',
    'Home Loans',
  ];

  // Render homepage JSX
  return (
    <main className="home-wrapper">
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="hero-image">
          <img
            src="/images/home/gurugram-hero.jpg"
            alt="Gurugram Skyline"
          />
        </div>
        <div className="hero-overlay">
          <div className="hero-card">
            <h1>Find Your Dream Property in Gurugram</h1>
            <p className="hero-tagline">
              Arora Realtech has been connecting people with their perfect properties for over two decades.
              Experience excellence in real estate consulting.
            </p>
            <a href="/about-us" className="btn btn-light">
              Read more <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="home-content">
        <div className="page-container">
          {/* About Section */}
          <section className="teaser-section">
            <div className="teaser">
              <div className="teaser-image">
                <img
                  src="/images/home/neon.jpg"
                  alt="About Arora Realtech"
                />
              </div>
              <div className="teaser-body">
                <h2>About Arora Realtech</h2>
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Properties Section */}
          <section className="home-section">
            <div className="section-header">
              <h2 className="hometitle">Recent Properties</h2>
            </div>

            {recentNodes.length > 0 ? (
              <div className="card-grid">
                {recentNodes.map((node, index) => {
                  const alias = aliasMap.get(node.id) || `/properties/${node.slug}`;
                  const imageIndex = index % placeholderImages.length;

                  return (
                    <article key={node.id} className="card">
                      <div className="card-img">
                        <img
                          src={node.imageUrl || placeholderImages[imageIndex]}
                          alt={node.title}
                        />
                      </div>
                      <div className="card-body">
                        <div className="card-date">
                          {new Date(node.createdAt).toLocaleDateString()}
                        </div>
                        <h3 className="card-title">
                          <a href={alias}>{node.title}</a>
                        </h3>
                        <div className="card-text">
                          <p>{node.summary?.substring(0, 180)}...</p>
                        </div>
                        <div className="card-actions">
                          <a href={alias} className="read-more-btn">
                            Read more
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No properties available at the moment. Please check back later.</p>
              </div>
            )}
          </section>

          {/* News Section */}
          <section className="home-section">
            <div className="section-header">
              <h2 className="hometitle">News & Updates</h2>
            </div>

            {newsNodes.length > 0 ? (
              <div className="card-grid">
                {newsNodes.map((node) => {
                  const alias = newsAliasMap.get(node.id) || `/news/${node.slug}`;

                  return (
                    <article key={node.id} className="card">
                      <div className="card-img">
                        <img
                          src={node.imageUrl || '/images/news-placeholder.jpg'}
                          alt={node.title}
                        />
                      </div>
                      <div className="card-body">
                        <div className="card-date">
                          {new Date(node.createdAt).toLocaleDateString()}
                        </div>
                        <h3 className="card-title">
                          <a href={alias}>{node.title}</a>
                        </h3>
                        <div className="card-text">
                          <p>{node.summary?.substring(0, 150)}...</p>
                        </div>
                        <div className="card-actions">
                          <a href={alias} className="read-more-btn">
                            Read more
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No news available at the moment.</p>
              </div>
            )}

            <div className="section-cta">
              <a href="/news" className="btn btn-outline-primary">
                Read more News <span className="arrow">→</span>
              </a>
            </div>
          </section>

          {/* Business Services */}
          <section className="home-section">
            <div className="section-header">
              <h2 className="hometitle">Our Services</h2>
            </div>
            <ul className="teaser-list">
              {businessServices.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
            <div className="section-cta">
              <a href="/about-us" className="btn btn-primary">
                Read more About us <span className="arrow">→</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function NodePage({ content, path }: { content: ResolvedNode; path: string }) {
  // ... (NodePage component implementation)
}

function TermPage({ content }: { content: ResolvedTerm }) {
  // ... (TermPage component implementation)
}
```

**Key Features**:
- Catch-all dynamic route handler
- Server-side data fetching with Prisma
- Incremental Static Regeneration (ISR)
- Homepage content with hero, properties, and news
- Dynamic image rendering with fallbacks

### 4. Property Listings Page

**File**: `app/properties/page.tsx`

```typescript
import PropertyFilters from '../components/PropertyFilters';
import prisma from '@/lib/db';
import { stripHtmlTags } from '@/lib/html';
import type { Prisma } from '@prisma/client';

export const revalidate = 3600;

const PROPERTIES_PER_PAGE = 18;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // Parse filter and pagination parameters
  const filterSlug =
    typeof resolvedSearchParams.filter === 'string'
      ? resolvedSearchParams.filter.toLowerCase()
      : null;
  const currentPage =
    typeof resolvedSearchParams.page === 'string'
      ? Math.max(0, Number.parseInt(resolvedSearchParams.page, 10) || 0)
      : 0;

  // Fetch property taxonomy terms for filtering
  const propertyTerms = await prisma.taxonomyTerm.findMany({
    where: { vocabulary: 'property' },
    orderBy: { name: 'asc' },
    select: { tid: true, name: true, slug: true },
  });

  const selectedTerm = filterSlug
    ? propertyTerms.find((term) => term.slug === filterSlug)
    : null;

  // Build Prisma query with optional filter
  const whereClause: Prisma.NodeWhereInput = {
    published: true,
    type: 'property',
    ...(selectedTerm
      ? {
          nodeTerms: {
            some: {
              term: {
                vocabulary: 'property',
                slug: selectedTerm.slug,
              },
            },
          },
        }
      : {}),
  };

  // Get total count for pagination
  const totalCount = await prisma.node.count({ where: whereClause });
  const totalPages = Math.max(1, Math.ceil(totalCount / PROPERTIES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);

  // Fetch properties with pagination
  const properties = await prisma.node.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: safePage * PROPERTIES_PER_PAGE,
    take: PROPERTIES_PER_PAGE,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      bodyHtml: true,
      imageUrl: true,
      createdAt: true,
      nodeTerms: {
        where: {
          term: {
            vocabulary: 'property',
          },
        },
        select: {
          term: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Get URL aliases
  const propertyIds = properties.map((property) => property.id);
  const aliases = propertyIds.length
    ? await prisma.urlAlias.findMany({
        where: {
          targetType: 'node',
          targetId: { in: propertyIds },
        },
        select: {
          targetId: true,
          sourcePath: true,
        },
      })
    : [];

  const aliasMap = new Map(aliases.map((a) => [a.targetId, a.sourcePath]));

  // Build pagination links
  const buildPagination = (current: number, total: number) => {
    const links = [];

    // Previous link
    if (current > 0) {
      links.push({
        page: current - 1,
        label: '← Previous',
        active: false,
      });
    }

    // Numbered pages
    for (let i = 0; i < total; i++) {
      links.push({
        page: i,
        label: (i + 1).toString(),
        active: i === current,
      });
    }

    // Next link
    if (current < total - 1) {
      links.push({
        page: current + 1,
        label: 'Next →',
        active: false,
      });
    }

    return links;
  };

  const paginationLinks = buildPagination(safePage, totalPages);

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <h1>Property Listings</h1>
        <p>
          Browse our extensive collection of properties in Gurugram.
          Find the perfect home or investment opportunity.
        </p>
      </div>

      <div className="filters-section">
        <PropertyFilters
          terms={propertyTerms}
          selectedTerm={selectedTerm}
        />
      </div>

      <div className="properties-grid-section">
        {properties.length > 0 ? (
          <>
            <div className="card-grid">
              {properties.map((property) => {
                const alias = aliasMap.get(property.id) || `/properties/${property.slug}`;
                const term = property.nodeTerms[0]?.term;

                return (
                  <article key={property.id} className="card">
                    <div className="card-img">
                      <img
                        src={property.imageUrl || '/images/property-placeholder.jpg'}
                        alt={property.title}
                        loading="lazy"
                      />
                    </div>
                    <div className="card-body">
                      <div className="card-date">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </div>
                      {term && (
                        <span className="card-tag">
                          {term.name}
                        </span>
                      )}
                      <h3 className="card-title">
                        <a href={alias}>{property.title}</a>
                      </h3>
                      <div className="card-text">
                        <p>
                          {property.summary
                            ? stripHtmlTags(property.summary).substring(0, 180)
                            : 'No description available'}...
                        </p>
                      </div>
                      <div className="card-actions">
                        <a href={alias} className="read-more-btn">
                          Read more
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <nav className="pagination" aria-label="Properties pagination">
              {paginationLinks.map((link) => (
                <a
                  key={link.page}
                  href={`?page=${link.page}${selectedTerm ? `&filter=${selectedTerm.slug}` : ''}`}
                  className={`pagination-link ${link.active ? 'active' : ''}`}
                  aria-current={link.active ? 'page' : undefined}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </>
        ) : (
          <div className="empty-state">
            <p>No properties found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Global Styles

**File**: `app/globals.css` (excerpts)

```css
/* Typography */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Open Sans', 'Gotham A', 'Gotham B', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #0d121f;
  background-color: #fff;
}

/* Color Palette */
:root {
  --primary-navy: #002664;
  --secondary-red: #d7153a;
  --accent-green: #25d366;
  --background-light: #e5e9ef;
  --background-neutral: #f8f9fb;
  --text-primary: #0d121f;
  --text-secondary: #4a4e57;
}

/* Layout Utilities */
.page-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

@media (max-width: 900px) {
  .page-container {
    padding: 0 1rem;
  }
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-radius: 0.25rem;
  border: 1px solid transparent;
  padding: 0.5rem 1.25rem;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #0d121f;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-primary {
  color: #fff;
  background-color: #002664;
  border-color: #002664;
}

.btn-primary:hover {
  background-color: #00173e;
  border-color: #001331;
  color: #fff;
}

.btn-secondary {
  color: #fff;
  background-color: #d7153a;
  border-color: #d7153a;
}

.btn-secondary:hover {
  background-color: #b41231;
  border-color: #a9102d;
  color: #fff;
}

/* Card Components */
.card-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.card {
  background-color: #fff;
  border: 1px solid #dcdddf;
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-img img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.card-title a {
  color: #0d121f;
  text-decoration: none;
}

.card-title a:hover {
  color: #002664;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    padding: 1.25rem;
  }
}
```

### 6. HTML Utilities

**File**: `lib/html.ts`

```typescript
/**
 * HTML utility functions for content processing
 */

const LEGACY_MEDIA_ORIGIN = (process.env.LEGACY_MEDIA_ORIGIN || '').replace(/\/$/, '');
const LEGACY_ORIGIN = (process.env.LEGACY_ORIGIN || '').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export function sanitizeHtml(html: string): string {
  let transformed = html;

  // Rewrite legacy file URLs so downloads come from the current host
  transformed = rewriteLegacyOrigins(transformed);

  // Basic sanitization - in production, use a library like DOMPurify
  // For now, just return as-is since content comes from trusted CMS
  return transformed;
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

export function extractFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? stripHtmlTags(match[1]) : '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteLegacyOrigins(html: string): string {
  const origins = [LEGACY_MEDIA_ORIGIN, LEGACY_ORIGIN].filter(Boolean);

  if (origins.length === 0) {
    return html;
  }

  const replacement = SITE_URL || '';

  return origins.reduce((acc, origin) => {
    const pattern = new RegExp(escapeRegExp(origin), 'g');
    return acc.replace(pattern, replacement);
  }, html);
}
```

---

## Backend Development Guide

This section provides comprehensive backend documentation with code examples.

### 1. Database Connection & Prisma Client

**File**: `lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Reuse the same instance during hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

**Key Features**:
- Singleton pattern for Prisma client
- Conditional logging based on environment
- Hot-reload protection in development
- Type-safe database access

### 2. Content Resolution System

**File**: `lib/resolve.ts`

```typescript
import { notFound, permanentRedirect } from 'next/navigation';
import prisma from './db';

// Type definitions for resolved content
export interface ResolvedNode {
  type: 'node';
  node: {
    id: number;
    nid: number;
    type: string;
    title: string;
    slug: string;
    langcode: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    summary: string | null;
    bodyHtml: string | null;
    author: string | null;
    imageUrl: string | null;
    jsonLd: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalPath: string | null;
    robots: string | null;
    hreflangLinks: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterCard: string | null;
  };
  terms: Array<{
    id: number;
    tid: number;
    vocabulary: string;
    name: string;
    slug: string;
  }>;
}

export interface ResolvedTerm {
  type: 'term';
  term: {
    id: number;
    tid: number;
    vocabulary: string;
    name: string;
    slug: string;
    langcode: string;
    descriptionHtml: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  nodes: Array<{
    id: number;
    nid: number;
    type: string;
    title: string;
    slug: string;
    summary: string | null;
    imageUrl: string | null;
    createdAt: Date;
  }>;
  page: number;
  totalPages: number;
}

export interface ResolvedStatic {
  type: 'static';
  content: string;
}

export type ResolvedContent = ResolvedNode | ResolvedTerm | ResolvedStatic;

/**
 * Normalize path by removing trailing slash (except for root)
 */
function normalizePath(path: string): string {
  let normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

/**
 * Main resolver function - maps URL paths to content
 */
export async function resolveByPath(
  path: string,
  searchParams: Record<string, string | string[] | undefined> = {},
  lang?: string
): Promise<ResolvedContent> {
  const normalizedPath = normalizePath(path);
  const langcode = lang || 'en';

  // Step 1: Lookup URL alias
  const alias = await prisma.urlAlias.findFirst({
    where: {
      sourcePath: normalizedPath,
      langcode,
    },
  });

  // Handle 404
  if (!alias) {
    await logRoute(normalizedPath);
    notFound();
  }

  // Handle redirects (301)
  if (alias.status === 301 && alias.redirectTo) {
    permanentRedirect(alias.redirectTo);
  }

  // Handle 410 Gone
  if (alias.status === 410) {
    notFound();
  }

  // Resolve based on target type
  if (alias.targetType === 'node' && alias.targetId) {
    return await resolveNode(alias.targetId);
  }

  if (alias.targetType === 'term' && alias.targetId) {
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 0;
    return await resolveTerm(alias.targetId, page);
  }

  // Static content or other types
  notFound();
}

/**
 * Resolve a Drupal node by ID
 */
async function resolveNode(nodeId: number): Promise<ResolvedNode> {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      nodeTerms: {
        include: {
          term: true,
        },
      },
    },
  });

  // Check if node exists and is published
  if (!node || !node.published) {
    notFound();
  }

  // Transform node data
  return {
    type: 'node',
    node: {
      id: node.id,
      nid: node.nid,
      type: node.type,
      title: node.title,
      slug: node.slug,
      langcode: node.langcode,
      published: node.published,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      summary: node.summary,
      bodyHtml: node.bodyHtml,
      author: node.author,
      imageUrl: node.imageUrl,
      jsonLd: node.jsonLd,
      metaTitle: node.metaTitle,
      metaDescription: node.metaDescription,
      canonicalPath: node.canonicalPath,
      robots: node.robots,
      hreflangLinks: node.hreflangLinks,
      ogTitle: node.ogTitle,
      ogDescription: node.ogDescription,
      ogImage: node.ogImage,
      twitterCard: node.twitterCard,
    },
    terms: node.nodeTerms.map((nt) => ({
      id: nt.term.id,
      tid: nt.term.tid,
      vocabulary: nt.term.vocabulary,
      name: nt.term.name,
      slug: nt.term.slug,
    })),
  };
}

/**
 * Resolve a taxonomy term with paginated nodes
 */
async function resolveTerm(termId: number, page: number = 0): Promise<ResolvedTerm> {
  const term = await prisma.taxonomyTerm.findUnique({
    where: { id: termId },
  });

  if (!term) {
    notFound();
  }

  const perPage = 20;
  const skip = page * perPage;

  // Fetch nodes and count in parallel
  const [nodes, totalCount] = await Promise.all([
    prisma.node.findMany({
      where: {
        published: true,
        nodeTerms: {
          some: {
            termId: term.id,
          },
        },
      },
      select: {
        id: true,
        nid: true,
        type: true,
        title: true,
        slug: true,
        summary: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: perPage,
    }),
    prisma.node.count({
      where: {
        published: true,
        nodeTerms: {
          some: {
            termId: term.id,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return {
    type: 'term',
    term: {
      id: term.id,
      tid: term.tid,
      vocabulary: term.vocabulary,
      name: term.name,
      slug: term.slug,
      langcode: term.langcode,
      descriptionHtml: term.descriptionHtml,
      metaTitle: term.metaTitle,
      metaDescription: term.metaDescription,
    },
    nodes,
    page,
    totalPages,
  };
}

/**
 * Log 404 routes for analytics
 */
async function logRoute(path: string): Promise<void> {
  try {
    await prisma.routeLog.create({
      data: {
        path,
        referer: null,
        userAgent: null,
      },
    });
  } catch (error) {
    console.error('Failed to log route:', error);
  }
}
```

### 3. Database Schema

**File**: `prisma/schema.prisma`

```prisma
// Prisma schema for Next.js CMS preserving Drupal SEO

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// URL Aliases - Maps Drupal-friendly URLs to content
model UrlAlias {
  id          Int      @id @default(autoincrement())
  sourcePath  String   @unique @map("source_path") @db.VarChar(767)
  targetType  String   @map("target_type") @db.VarChar(50) // node|term|view|static
  targetId    Int?     @map("target_id")
  langcode    String   @default("en") @db.VarChar(12)
  status      Int      @default(200) // 200, 301, 410
  redirectTo  String?  @map("redirect_to") @db.VarChar(1000)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([targetType, targetId])
  @@index([langcode])
  @@map("url_aliases")
}

// Main content nodes (properties, news, pages)
model Node {
  id              Int            @id @default(autoincrement())
  nid             Int            @unique
  type            String         @db.VarChar(50)
  title           String         @db.VarChar(255)
  slug            String         @db.VarChar(255)
  langcode        String         @default("en") @db.VarChar(12)
  published       Boolean        @default(true)
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  summary         String?        @db.Text
  bodyHtml        String?        @map("body_html") @db.LongText
  author          String?        @db.VarChar(255)
  imageUrl        String?        @map("image_url") @db.VarChar(2048)

  // SEO fields
  jsonLd          String?        @map("jsonld") @db.Text
  metaTitle       String?        @map("meta_title") @db.VarChar(255)
  metaDescription String?        @map("meta_description") @db.Text
  canonicalPath   String?        @map("canonical_path") @db.VarChar(2048)
  robots          String?        @db.VarChar(100)
  hreflangLinks   String?        @map("hreflang_links") @db.Text
  ogTitle         String?        @map("og_title") @db.VarChar(255)
  ogDescription   String?        @map("og_description") @db.Text
  ogImage         String?        @map("og_image") @db.VarChar(2048)
  twitterCard     String?        @map("twitter_card") @db.VarChar(50)

  // Relationships
  nodeTerms       NodeTerm[]

  // Indexes for performance
  @@index([type])
  @@index([published])
  @@index([langcode])
  @@index([slug])
  @@map("nodes")
}

// Taxonomy terms for categorization
model TaxonomyTerm {
  id              Int         @id @default(autoincrement())
  tid             Int         @unique
  vocabulary      String      @db.VarChar(50)
  name            String      @db.VarChar(255)
  slug            String      @db.VarChar(255)
  langcode        String      @default("en") @db.VarChar(12)
  descriptionHtml String?     @map("description_html") @db.Text
  metaTitle       String?     @map("meta_title") @db.VarChar(255)
  metaDescription String?     @map("meta_description") @db.Text
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relationships
  nodeTerms       NodeTerm[]

  @@index([vocabulary])
  @@index([langcode])
  @@map("taxonomy_terms")
}

// Many-to-many relationship between nodes and terms
model NodeTerm {
  id     Int          @id @default(autoincrement())
  nodeId Int          @map("node_id")
  termId Int          @map("term_id")

  node   Node         @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  term   TaxonomyTerm @relation(fields: [termId], references: [id], onDelete: Cascade)

  @@unique([nodeId, termId])
  @@index([termId])
  @@map("node_terms")
}

// Route logging for 404 tracking
model RouteLog {
  id        Int      @id @default(autoincrement())
  path      String   @db.VarChar(767)
  referer   String?  @db.Text
  userAgent String?  @map("user_agent") @db.Text
  timestamp DateTime @default(now())

  @@index([path])
  @@index([timestamp])
  @@map("route_logs")
}

// Site configuration
model SiteConfig {
  id    Int    @id @default(autoincrement())
  key   String @unique @db.VarChar(100)
  value String @db.Text

  @@map("site_config")
}
```

### 4. Backend Query Examples

#### Fetch Recent Properties with Pagination

```typescript
import prisma from '@/lib/db';

async function getRecentProperties(page: number = 0) {
  const PROPERTIES_PER_PAGE = 20;
  const skip = page * PROPERTIES_PER_PAGE;

  const [properties, totalCount] = await Promise.all([
    prisma.node.findMany({
      where: {
        published: true,
        type: 'property',
      },
      include: {
        nodeTerms: {
          include: {
            term: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: PROPERTIES_PER_PAGE,
    }),
    prisma.node.count({
      where: {
        published: true,
        type: 'property',
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PROPERTIES_PER_PAGE);

  return {
    properties,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
```

#### Search Nodes by Term

```typescript
async function searchPropertiesByTerm(termSlug: string) {
  const properties = await prisma.node.findMany({
    where: {
      published: true,
      type: 'property',
      nodeTerms: {
        some: {
          term: {
            vocabulary: 'property',
            slug: termSlug,
          },
        },
      },
    },
    include: {
      nodeTerms: {
        where: {
          term: {
            vocabulary: 'property',
          },
        },
        select: {
          term: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return properties;
}
```

#### Get URL Alias

```typescript
async function getNodeAlias(nodeId: number) {
  const alias = await prisma.urlAlias.findFirst({
    where: {
      targetType: 'node',
      targetId: nodeId,
    },
    select: {
      sourcePath: true,
    },
  });

  return alias?.sourcePath || null;
}
```

#### Log 404 Routes

```typescript
async function log404Route(path: string, referer?: string, userAgent?: string) {
  await prisma.routeLog.create({
    data: {
      path,
      referer: referer || null,
      userAgent: userAgent || null,
    },
  });
}
```

### 5. Environment Variables

**File**: `.env.example`

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/arora_realtech"

# Optional: Legacy Drupal URLs for media rewriting
LEGACY_MEDIA_ORIGIN="https://legacy-site.com/sites/default/files"
LEGACY_ORIGIN="https://legacy-site.com"

# Site URL for canonical URLs and media rewriting
NEXT_PUBLIC_SITE_URL="https://www.arorarealtech.com"

# Optional: For production email or integrations
SMTP_HOST="smtp.example.com"
SMTP_USER="noreply@arorarealtech.com"
SMTP_PASS="your-email-password"

# Analytics (optional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Development settings
NODE_ENV="development"
```

### 6. Prisma Migrations

**Creating a new migration:**

```bash
# Create migration from schema changes
npx prisma migrate dev --name your_migration_name

# Generate Prisma client after schema changes
npx prisma generate

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### 7. Database Performance Optimization

#### Indexes Configuration

The schema includes strategic indexes for optimal query performance:

- **Node queries**: Indexes on `type`, `published`, `slug`
- **Taxonomy queries**: Indexes on `vocabulary`, `langcode`
- **Alias lookups**: Index on `sourcePath` (unique)
- **Many-to-many joins**: Indexes on `nodeId` and `termId`

#### Query Optimization Tips

1. **Use `select` to limit returned fields**

```typescript
// Good: Only fetch needed fields
const nodes = await prisma.node.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    published: true,
  },
});

// Avoid: Fetching all fields unnecessarily
const nodes = await prisma.node.findMany();
```

2. **Use `include` sparingly**

```typescript
// Good: Include only when you need the related data
const node = await prisma.node.findUnique({
  where: { id: 1 },
  include: {
    nodeTerms: {
      include: {
        term: true,
      },
    },
  },
});
```

3. **Use `where` clauses for filtering**

```typescript
// Good: Filter at database level
const publishedNodes = await prisma.node.findMany({
  where: {
    published: true,
    type: 'property',
  },
});
```

4. **Use `skip` and `take` for pagination**

```typescript
// Good: Efficient pagination
const page = 5;
const PER_PAGE = 20;
const nodes = await prisma.node.findMany({
  skip: page * PER_PAGE,
  take: PER_PAGE,
});
```

---

## Future Enhancements

1. **Image Optimisation** – Replace `<img>` with `next/image` for compressed, responsive assets and to resolve lint warnings.
2. **Search Integration** – Implement API route to forward queries to Drupal (if still in use) or new search index.
3. **CMS-backed copy** – Move hard-coded arrays (about text, services list) into a CMS or database table for non-technical editing.
4. **Sitemap automation** – Expand `/sitemap.xml` generation to include taxonomy and static pages dynamically.
5. **Analytics & Tagging** – Integrate GA4/Tag Manager scripts once tracking plan defined.
6. **Accessibility audit** – Validate contrast ratios, focus management for menus, ARIA roles in placeholders.
7. **Automation** – Set up CI to run lint + Playwright on pull requests, ensuring regressions are caught early.

---

### Support Contacts
- **Engineering lead**: _[Add name/email]_
- **Design/UX**: _[Add name/email]_
- **Content updates**: _[Add name/email]_

This document should equip the client and their teams with full insight into how each part of the migrated site works, how to update it, and where to extend it in the future. For live walkthroughs or onboarding sessions, please schedule via the support contacts above.

