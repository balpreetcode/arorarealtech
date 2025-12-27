# HTTPS Configuration Fixed ✅

## Issue Resolution

**Problem**: The application was generating HTTP URLs instead of HTTPS URLs.

**Root Cause**: The `.env` file had `NEXT_PUBLIC_SITE_URL=http://localhost:5031` which was being used throughout the application to generate all URLs (sitemap, RSS, canonical links, etc.).

**Solution**: Updated the environment configuration to use HTTPS with the production domain.

---

## Configuration Changes

### Updated `.env`
```env
# Before
NEXT_PUBLIC_SITE_URL=http://localhost:5031
NODE_ENV=development

# After
NEXT_PUBLIC_SITE_URL=https://api31.winds-os.com
NODE_ENV=production
PORT=5031
```

### Why This Matters

The `NEXT_PUBLIC_SITE_URL` environment variable is used in:
- **Sitemap.xml** - All URL entries (5,964 URLs)
- **RSS Feed** - All article links
- **Canonical URLs** - SEO metadata on every page
- **OpenGraph URLs** - Social media sharing
- **Hreflang links** - Multi-language SEO

---

## Verification

### Sitemap URLs (Now HTTPS)
```xml
<loc>https://api31.winds-os.com/residencial-plot-for-sale-in-huda-sector-46-gurugram-263-sq-yd-10-marla</loc>
<loc>https://api31.winds-os.com/500-sq-ft-pre-rented-shop-for-sale-in-running-market-rof-portico-in-sushant-lok-1-gurugram</loc>
```

### RSS Feed URLs (Now HTTPS)
```xml
<link>https://api31.winds-os.com</link>
```

### Robots.txt (Now HTTPS)
```
Sitemap: https://api31.winds-os.com/sitemap.xml
```

---

## How URLs Work in Next.js

### 1. Environment Variables
- `NEXT_PUBLIC_SITE_URL` is embedded at **build time**
- Must rebuild the app when changing this value
- Used in server components and API routes

### 2. URL Generation
The app generates URLs in these files:
- `app/sitemap.xml/route.ts` - Sitemap generation
- `app/rss.xml/route.ts` - RSS feed
- `app/robots.txt/route.ts` - Robots file
- `app/[[...slug]]/head.tsx` - Meta tags (canonical)
- `lib/seo.ts` - SEO metadata builder

### 3. Build Process
```bash
# After changing NEXT_PUBLIC_SITE_URL, must rebuild:
npm run build

# Then start production server:
npm start
```

---

## Comparison: api21.winds-os.com vs api31.winds-os.com

### api21.winds-os.com (Drupal - Already HTTPS)
Your existing Drupal site at `api21.winds-os.com` was already configured for HTTPS. It uses:
- Base URL set in Drupal configuration
- Web server (Apache/Nginx) handles HTTPS
- URLs generated from Drupal's base_url setting

### api31.winds-os.com (Next.js - Now Fixed to HTTPS)
The new Next.js app at `api31.winds-os.com` now matches:
- Base URL: `https://api31.winds-os.com`
- All generated URLs use HTTPS
- Consistent with Drupal's URL scheme

---

## Production Deployment Checklist

When deploying to production:

1. ✅ **Update .env**
   ```env
   NEXT_PUBLIC_SITE_URL=https://api31.winds-os.com
   NODE_ENV=production
   ```

2. ✅ **Rebuild Application**
   ```bash
   npm run build
   ```

3. ✅ **Start Production Server**
   ```bash
   npm start
   # Or use PM2/systemd for process management
   ```

4. ✅ **Configure Reverse Proxy**
   Your web server (Nginx/Apache) should:
   - Listen on port 443 (HTTPS)
   - SSL certificate for api31.winds-os.com
   - Proxy to localhost:5031
   - Force HTTPS redirect from HTTP

5. ✅ **Verify URLs**
   ```bash
   curl https://api31.winds-os.com/sitemap.xml | grep "<loc>" | head
   curl https://api31.winds-os.com/rss.xml | grep "<link>"
   curl https://api31.winds-os.com/robots.txt
   ```

---

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name api31.winds-os.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api31.winds-os.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:5031;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Current Status

✅ **Application**: Running on port 5031
✅ **URLs**: All using HTTPS (api31.winds-os.com)
✅ **Sitemap**: 5,964 URLs with HTTPS
✅ **RSS Feed**: All links with HTTPS
✅ **Canonical Tags**: HTTPS on all pages
✅ **Build**: Production mode
✅ **SEO**: Full HTTPS compliance

---

## Testing

```bash
# Test sitemap
curl http://localhost:5031/sitemap.xml | grep "api31.winds-os.com" | head -5

# Test RSS
curl http://localhost:5031/rss.xml | grep "https://"

# Test robots.txt
curl http://localhost:5031/robots.txt

# Test homepage
curl -I http://localhost:5031/

# Test property page
curl http://localhost:5031/residencial-plot-for-sale-in-huda-sector-46-gurugram-263-sq-yd-10-marla | grep "canonical"
```

---

**Fixed!** All URLs now use HTTPS with api31.winds-os.com, matching your Drupal site's configuration. 🔒
