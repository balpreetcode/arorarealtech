# Setup Guide

Complete step-by-step setup instructions for the Next.js CMS migration project.

## 1. Initial Setup

### Install Dependencies

```bash
cd nextjsaroradotcom
npm install
```

### Install Playwright Browsers (for testing)

```bash
npx playwright install chromium
```

## 2. Environment Configuration

### Create .env file

```bash
cp .env.example .env
```

### Configure Environment Variables

Edit `.env` with your settings:

```env
# Next.js App Configuration
NEXT_PUBLIC_SITE_URL=https://api31.winds-os.com
NODE_ENV=development

# New MySQL Database
DATABASE_URL="mysql://user:pass@localhost:3306/nextcms"

# Legacy Drupal Database (for import only)
DRUPAL_DB_URL="mysql://drupal_user:drupal_pass@drupal-host:3306/drupal"
DRUPAL_VERSION=8  # Set to 7 for Drupal 7, or 8 for Drupal 8/9/10

# Media Files Proxy
LEGACY_MEDIA_ORIGIN=https://api31.winds-os.com

# SEO Diff Origin
LEGACY_ORIGIN=https://api31.winds-os.com
```

## 3. Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start MySQL container
docker compose up -d mysql

# Wait for MySQL to be ready (check with)
docker compose logs mysql

# The database will be created automatically
```

### Option B: Using Existing MySQL

1. Create database:
```sql
CREATE DATABASE nextcms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Create user:
```sql
CREATE USER 'user'@'%' IDENTIFIED BY 'pass';
GRANT ALL PRIVILEGES ON nextcms.* TO 'user'@'%';
FLUSH PRIVILEGES;
```

3. Update `DATABASE_URL` in `.env`

## 4. Initialize Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

This creates all tables:
- url_aliases
- nodes
- taxonomy_terms
- node_terms
- route_logs
- site_config

## 5. Import Data from Drupal

### Verify Drupal Database Access

Test connection:
```bash
mysql -h drupal-host -u drupal_user -p drupal
```

### Configure DRUPAL_VERSION

Make sure `DRUPAL_VERSION` in `.env` matches your Drupal version:
- `7` for Drupal 7
- `8` for Drupal 8, 9, or 10

### Run Import

```bash
npm run import:drupal
```

This will:
1. Import taxonomy terms
2. Import nodes (pages, articles, etc.)
3. Import node-term relationships
4. Import URL aliases
5. Create default aliases for nodes

**Expected Output:**
```
🚀 Starting Drupal 8 import...

📁 Importing taxonomy terms...
Found 25 terms
Imported 25/25 terms

📄 Importing nodes...
Found 150 nodes
Imported 150/150 nodes

🔗 Importing node-term relationships...
Found 200 node-term relationships
Imported 200/200 relationships

🔗 Importing URL aliases...
Found 150 URL aliases
Imported 150/150 aliases

🔗 Creating default aliases for nodes...
Created default aliases for 150 nodes

✅ Import completed successfully!
```

## 6. Development Server

### Start Next.js Development Server

```bash
npm run dev
```

The app will be available at the URL configured in `NEXT_PUBLIC_SITE_URL` (default: https://api31.winds-os.com).

### Test Key Routes

- Homepage: `https://api31.winds-os.com/`
- Sitemap: `https://api31.winds-os.com/sitemap.xml`
- Robots: `https://api31.winds-os.com/robots.txt`
- RSS: `https://api31.winds-os.com/rss.xml`
- Sample page: `https://api31.winds-os.com/about` (if imported)

## 7. SEO Parity Check

### Create URL List

Edit `data/urls.csv` with actual URLs from your site:

```csv
/about
/contact
/blog/my-article
/products/widget-1
```

### Run SEO Diff

```bash
npm run seo:diff
```

### Review Reports

Check generated reports:
- `reports/seo-diff.json` - JSON format
- `reports/seo-diff.md` - Markdown format

**The script will:**
- Fetch each URL from both legacy and new sites
- Compare status codes, titles, meta descriptions, canonicals, H1s, and JSON-LD
- Report differences
- Exit with error if critical regressions found

## 8. Run Tests

### E2E Tests

```bash
npm run test:e2e
```

Tests include:
- Sitemap and robots.txt accessibility
- 404 page handling
- Media file proxy
- RSS feed validity

### View Test Report

```bash
npx playwright show-report
```

## 9. Production Build

### Build Application

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Or Deploy with Docker

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f app

# The app will be available on port 3000
```

## 10. Verification Checklist

- [ ] Database created and schema initialized
- [ ] Drupal data imported successfully
- [ ] Development server runs without errors
- [ ] Sitemap.xml shows all URLs
- [ ] Robots.txt accessible
- [ ] RSS feed shows articles
- [ ] SEO diff shows no critical regressions
- [ ] E2E tests pass
- [ ] 404 pages log to RouteLog table
- [ ] Media files proxy works

## 11. Docker Production Deployment

### Build and Start

```bash
docker compose up -d
```

### Initialize Database (First Time)

```bash
# Push schema
docker compose exec app npx prisma db push

# Import Drupal data
docker compose exec app npm run import:drupal
```

### View Logs

```bash
docker compose logs -f app
```

### Restart Services

```bash
docker compose restart app
```

## Troubleshooting

### Port Already in Use

If port 3000 is in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

### Database Connection Failed

1. Check DATABASE_URL format
2. Verify MySQL is running
3. Test connection with mysql CLI
4. Check firewall rules

### Import Script Fails

1. Verify DRUPAL_DB_URL
2. Check DRUPAL_VERSION setting
3. Ensure Drupal DB is accessible
4. Check Drupal table structure

### Docker Issues

```bash
# Stop all containers
docker compose down

# Remove volumes (caution: deletes data)
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

## Next Steps

1. Customize the design in `app/[[...slug]]/page.tsx`
2. Add custom CSS/styling
3. Configure custom metadata fields
4. Set up CI/CD pipeline
5. Configure production hosting
6. Set up monitoring and analytics
7. Schedule regular SEO audits

## Support

For issues, check:
- README.md for general documentation
- prisma/schema.prisma for database structure
- .env.example for configuration options
