# Port Configuration Summary

## Current Configuration

### Frontend (Next.js)
- **Port**: 5031
- **URL**: http://localhost:5031

### Backend API
The Next.js application includes API routes that run on the same port (5031). Next.js combines frontend and backend in a single server.

---

## Environment Configuration

Updated `.env` file:
```env
PORT=5031
NEXT_PUBLIC_SITE_URL=http://localhost:5031
```

Updated `package.json` scripts:
```json
"dev": "PORT=5031 next dev",
"start": "PORT=5031 next start"
```

---

## Working URLs

### Main Application
- **Homepage**: http://localhost:5031/
- **Properties**: http://localhost:5031/properties
- **About**: http://localhost:5031/about-us
- **Contact**: http://localhost:5031/contact-us

### SEO & Feeds
- **Sitemap**: http://localhost:5031/sitemap.xml
- **Robots**: http://localhost:5031/robots.txt
- **RSS Feed**: http://localhost:5031/rss.xml

### API Routes (Built into Next.js)
All API functionality is handled by Next.js route handlers:
- Sitemap generation: `/sitemap.xml/route.ts`
- RSS feed: `/rss.xml/route.ts`
- Robots.txt: `/robots.txt/route.ts`

---

## Architecture

Next.js uses a **unified architecture** where:
- Frontend pages render at `/app/[route]/page.tsx`
- API routes handle at `/app/[route]/route.ts`
- Both run on the same port (5031)
- Database queries happen server-side via Prisma

This means:
- **No separate backend server needed** (port 5032 not required)
- All 5,953 property pages are server-rendered
- API routes like sitemap, RSS are integrated
- Database operations happen in server components

---

## Starting the Application

```bash
# Development mode
cd nextjsaroradotcom
npm run dev
# Runs on http://localhost:5031

# Production mode
npm run build
npm start
# Also runs on http://localhost:5031
```

---

## Database Connection

The application connects directly to MySQL:
- **Database**: nextcms
- **Host**: 127.0.0.1:3306
- **Connection**: Via Prisma ORM

All database queries happen server-side in:
- Page components (for rendering)
- API route handlers (for sitemap, RSS, etc.)

---

## Note on Port 5032

Port 5032 is **not needed** for this application because:
1. Next.js provides built-in API routes
2. All backend logic is integrated in the same server
3. Database queries are server-side only
4. No separate REST API server is required

If you need a separate REST API on port 5032 for external clients, we can create one, but the current Next.js app is fully functional without it.

---

## Verification

Test the application:
```bash
# Homepage
curl http://localhost:5031/

# Sitemap (5,964 URLs)
curl http://localhost:5031/sitemap.xml

# RSS feed
curl http://localhost:5031/rss.xml

# Sample property
curl http://localhost:5031/residencial-plot-for-sale-in-huda-sector-46-gurugram-263-sq-yd-10-marla
```

---

**Status**: ✅ Application running on port 5031
**Database**: ✅ Connected to MySQL (nextcms)
**Properties**: ✅ 5,953 nodes imported
**Media Files**: ✅ Serving from Drupal directory

All systems operational! 🚀
