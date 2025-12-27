# Next.js CMS - Drupal Migration

A production-ready Next.js application that preserves 1:1 SEO and URL behavior from an existing Drupal site.

## Features

- ✅ Next.js 14+ with App Router and TypeScript
- ✅ MySQL database with Prisma ORM
- ✅ Exact URL preservation from Drupal (via URL alias table)
- ✅ Complete SEO metadata (title, description, canonical, OpenGraph, Twitter, JSON-LD)
- ✅ Drupal importer (supports both Drupal 7 and 8/9+)
- ✅ SEO parity checker
- ✅ Docker setup
- ✅ Playwright E2E tests
- ✅ Media file proxy/rewrite
- ✅ Sitemap, robots.txt, RSS feed

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for containerized setup)
- Access to Drupal MySQL database (for import)

## Quick Start

### 1. Clone and Install

```bash
cd nextjsaroradotcom
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Next app
NEXT_PUBLIC_SITE_URL=https://api31.winds-os.com
NODE_ENV=development

# New MySQL
DATABASE_URL="mysql://user:pass@localhost:3306/nextcms"

# Legacy Drupal DB (read-only for import)
DRUPAL_DB_URL="mysql://drupal_user:drupal_pass@legacy-db:3306/drupal"
DRUPAL_VERSION=8  # or 7

# Media proxy origin
LEGACY_MEDIA_ORIGIN=https://api31.winds-os.com

# SEO Diff settings
LEGACY_ORIGIN=https://api31.winds-os.com
```

### 3. Start Database

**Using Docker:**

```bash
docker compose up -d mysql
```

**Or use your own MySQL server.**

### 4. Initialize Database

```bash
npm run prisma:push
```

This creates all tables in your MySQL database.

### 5. Import from Drupal

```bash
npm run import:drupal
```

This imports:
- Taxonomy terms
- Nodes (pages, articles, etc.)
- Node-term relationships
- URL aliases

### 6. Run Development Server

```bash
npm run dev
```

Visit https://api31.winds-os.com (or your configured URL)

### 7. Build for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Build and run with Docker Compose

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

The app will be available on port 3000.

### Initialize database in Docker

```bash
# Enter the app container
docker compose exec app sh

# Run migrations (if needed)
npx prisma migrate deploy

# Or push schema
npx prisma db push
```

### Import Drupal data in Docker

```bash
# Make sure DRUPAL_DB_URL points to accessible database
docker compose exec app npm run import:drupal
```

## Scripts

### Import from Drupal

```bash
npm run import:drupal
```

Imports all data from legacy Drupal database.

### SEO Parity Check

```bash
npm run seo:diff
```

Compares SEO metadata between legacy site and new Next.js site for URLs in `data/urls.csv`.

Generates reports:
- `reports/seo-diff.json` - Machine-readable JSON
- `reports/seo-diff.md` - Human-readable markdown

### Export URLs

```bash
npm run urls:export
```

Exports all URLs to `output/urls.txt`.

### Run Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run tests
npm run test:e2e

# Run tests in UI mode
npx playwright test --ui
```

## Project Structure

```
nextjsaroradotcom/
├── app/
│   ├── [[...slug]]/         # Catch-all route
│   │   ├── page.tsx          # Page component
│   │   └── head.tsx          # SEO metadata
│   ├── sitemap.xml/          # Sitemap route
│   ├── robots.txt/           # Robots.txt route
│   ├── rss.xml/              # RSS feed route
│   ├── layout.tsx            # Root layout
│   └── not-found.tsx         # 404 page
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── resolve.ts            # Path resolution
│   ├── seo.ts                # SEO metadata builder
│   └── html.ts               # HTML utilities
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   ├── import-drupal.ts      # Drupal importer
│   ├── seo-diff.ts           # SEO parity checker
│   └── export-urls.ts        # URL exporter
├── tests/
│   └── e2e.spec.ts           # E2E tests
├── data/
│   └── urls.csv              # URLs for SEO checking
├── output/                   # Script outputs
├── reports/                  # Generated reports
└── docker-compose.yml        # Docker configuration
```

## Database Schema

### UrlAlias
Maps incoming paths to content (preserving Drupal URL structure).

### Node
Content pages (articles, pages, etc.) with full SEO metadata.

### TaxonomyTerm
Categories, tags, and other taxonomy.

### NodeTerm
Many-to-many relationship between nodes and terms.

### RouteLog
Captures 404 requests for analysis.

### SiteConfig
Site-wide configuration settings.

## SEO Features

### Preserved from Drupal:
- ✅ Exact URL paths (via URL alias table)
- ✅ Status codes (200, 301, 410)
- ✅ Meta title and description
- ✅ Canonical URLs
- ✅ Robots meta tags
- ✅ Hreflang links
- ✅ OpenGraph tags
- ✅ Twitter Card tags
- ✅ JSON-LD structured data
- ✅ Pagination query params (`?page=N`)
- ✅ Sitemap with lastmod, priority, changefreq
- ✅ RSS feed

### Media Files
Legacy media files (`/sites/default/files/*`) are proxied to the original Drupal site via Next.js rewrites.

## Configuration

### Trailing Slash Policy
Set in `next.config.js`:
```js
trailingSlash: false  // Match your Drupal configuration
```

### ISR (Incremental Static Regeneration)
Pages revalidate every hour by default:
```ts
export const revalidate = 3600;
```

### Cache Headers
- HTML: `no-cache`
- Static assets: `max-age=31536000`
- Media files: `max-age=31536000`

## Testing

### E2E Tests (Playwright)

Tests cover:
- Sitemap and robots.txt accessibility
- 404 page behavior
- Media file proxy
- RSS feed validity
- Node page rendering (when data available)

Run tests:
```bash
npm run test:e2e
```

### SEO Parity Tests

Create `data/urls.csv` with URLs to test:
```csv
/about
/contact
/blog/my-article
/products/widget-1
```

Run comparison:
```bash
npm run seo:diff
```

Review reports in `reports/` directory.

## Troubleshooting

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Database Connection Issues
- Check `DATABASE_URL` in `.env`
- Ensure MySQL is running
- Verify credentials and database exists

### Import Fails
- Check `DRUPAL_DB_URL` and `DRUPAL_VERSION`
- Ensure Drupal database is accessible
- Check Drupal database table structure matches expected version

### Docker Issues
```bash
# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Deploy using Docker or your preferred hosting platform

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Import Drupal data (one-time):
```bash
npm run import:drupal
```

6. Verify SEO parity:
```bash
npm run seo:diff
```

## License

Private project for Arora Real Tech.

## Support

For issues and questions, contact the development team.
