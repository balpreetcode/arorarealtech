# Quick Start Guide

**Complete command sequence to get your Next.js CMS running**

---

## Prerequisites Check

```bash
# Verify Node.js version (need 20+)
node --version

# Verify Docker (optional, for database)
docker --version
docker compose version
```

---

## Step-by-Step Execution

### 1️⃣ Install Dependencies (2-3 minutes)

```bash
cd /home/usr1/code/arorarealtech/nextjsaroradotcom
npm install
```

**Expected output:** Installation of ~500+ packages

---

### 2️⃣ Configure Environment (1 minute)

```bash
# Copy template
cp .env.example .env

# Edit with your settings
nano .env  # or vim .env or code .env
```

**Required settings:**
```env
DATABASE_URL="mysql://user:pass@localhost:3306/nextcms"
DRUPAL_DB_URL="mysql://drupal_user:drupal_pass@drupal-host:3306/drupal"
DRUPAL_VERSION=8
NEXT_PUBLIC_SITE_URL=https://api31.winds-os.com
```

---

### 3️⃣ Start MySQL Database (1 minute)

**Option A: Docker (Recommended)**
```bash
docker compose up -d mysql

# Wait for database to be ready (10-20 seconds)
docker compose logs mysql | grep "ready for connections"
```

**Option B: Existing MySQL**
```bash
# Create database manually
mysql -u root -p -e "CREATE DATABASE nextcms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### 4️⃣ Initialize Database Schema (30 seconds)

```bash
# Generate Prisma Client
npm run prisma:generate

# Create all tables
npm run prisma:push
```

**Expected output:**
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

---

### 5️⃣ Verify Setup (30 seconds)

```bash
npm run verify
```

**Expected output:**
```
✅ Database connected
✅ url_aliases table exists
✅ nodes table exists
⚠️  No nodes found - run: npm run import:drupal
```

---

### 6️⃣ Import Drupal Data (2-10 minutes, depends on data size)

```bash
npm run import:drupal
```

**Expected output:**
```
🚀 Starting Drupal 8 import...
📁 Importing taxonomy terms...
  Found 25 terms
  Imported 25/25 terms
📄 Importing nodes...
  Found 150 nodes
  Imported 150/150 nodes
🔗 Importing node-term relationships...
  Imported 200/200 relationships
🔗 Importing URL aliases...
  Imported 150/150 aliases
✅ Import completed successfully!
```

---

### 7️⃣ Start Development Server (instant)

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Ready in 2.5s
```

**Test in browser:**
- https://api31.winds-os.com/
- https://api31.winds-os.com/sitemap.xml
- https://api31.winds-os.com/robots.txt
- https://api31.winds-os.com/rss.xml

---

### 8️⃣ Run SEO Parity Check (1-2 minutes)

```bash
# First, add your URLs to data/urls.csv
# Then run:
npm run seo:diff
```

**Expected output:**
```
🔍 Starting SEO parity check...
Found 10 URLs to check
[1/10] Checking /about...
  ✅ No issues
[2/10] Checking /contact...
  ✅ No issues
...
✅ All URLs passed SEO parity check
```

**Check reports:**
```bash
cat reports/seo-diff.md
```

---

### 9️⃣ Run E2E Tests (1-2 minutes)

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run tests
npm run test:e2e
```

**Expected output:**
```
Running 5 tests using 1 worker
  ✓ sitemap.xml should be accessible
  ✓ robots.txt should be accessible
  ✓ 404 page displays correctly
  ...
  5 passed (2.3s)
```

---

### 🔟 Build for Production (2-3 minutes)

```bash
npm run build
```

**Expected output:**
```
Route (app)                              Size
┌ ○ /                                    142 B
├ ○ /[[...slug]]                         142 B
├ ○ /robots.txt                          0 B
├ ○ /rss.xml                            0 B
└ ○ /sitemap.xml                        0 B

✓ Compiled successfully
```

**Start production server:**
```bash
npm start
```

---

## 🐳 Docker Production Deployment

### Complete Docker Setup

```bash
# Build and start all services
docker compose up -d

# Wait for MySQL to be ready
docker compose logs -f mysql
# (Wait for "ready for connections")

# Initialize database
docker compose exec app npx prisma db push

# Import Drupal data
docker compose exec app npm run import:drupal

# Verify
docker compose exec app npm run verify

# View app logs
docker compose logs -f app
```

**Access app:** http://localhost:3000

---

## 📊 Verify Everything Works

### Checklist

```bash
# 1. Database connection
npm run verify
# Should show: ✅ Database connected

# 2. Data imported
npm run verify
# Should show: Nodes: 150, URL Aliases: 150

# 3. Sitemap accessible
curl https://api31.winds-os.com/sitemap.xml
# Should return XML

# 4. Robots.txt accessible
curl https://api31.winds-os.com/robots.txt
# Should return text

# 5. RSS feed accessible
curl https://api31.winds-os.com/rss.xml
# Should return XML

# 6. Sample page loads
curl https://api31.winds-os.com/about
# Should return HTML with title

# 7. 404 works
curl -I https://api31.winds-os.com/nonexistent
# Should return 404

# 8. SEO parity passes
npm run seo:diff
# Should show: ✅ All URLs passed

# 9. Tests pass
npm run test:e2e
# Should show: X passed
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Test MySQL connection
mysql -h localhost -u user -p
# If fails, check DATABASE_URL in .env
```

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Port 3000 Already in Use
```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
# Or use different port
PORT=3001 npm run dev
```

### Import Script Fails
```bash
# Check Drupal DB connection
mysql -h drupal-host -u drupal_user -p drupal
# Verify DRUPAL_VERSION in .env
# Check table structure matches Drupal version
```

### Docker Issues
```bash
# Reset everything
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## ⏱️ Total Time Estimate

- **First-time setup:** 15-30 minutes
- **Subsequent starts:** 1-2 minutes
- **Data import:** 5-15 minutes (depends on size)

---

## 🎯 Production Deployment Checklist

- [ ] Update .env with production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Configure NEXT_PUBLIC_SITE_URL with production domain
- [ ] Run `npm run build`
- [ ] Run `npm run import:drupal` (one-time)
- [ ] Run `npm run seo:diff` to verify parity
- [ ] Run `npm run test:e2e` to verify functionality
- [ ] Set up monitoring and logging
- [ ] Configure SSL/HTTPS
- [ ] Set up backup strategy for MySQL

---

## 📞 Support

**Files to check:**
- `README.md` - General documentation
- `SETUP.md` - Detailed setup instructions
- `PROJECT_SUMMARY.md` - Complete project overview

**Common commands:**
```bash
npm run verify          # Check setup status
npm run import:drupal   # Re-import Drupal data
npm run seo:diff        # Check SEO parity
npm run urls:export     # Export all URLs
```

---

**Ready to go!** 🚀

The application is fully implemented and ready for development, testing, and production deployment.
