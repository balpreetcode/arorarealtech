# Navigation Quick Reference Guide
## Arora Real Tech - Next.js Navigation

---

## File Locations

| Component | File Path | Type |
|-----------|-----------|------|
| Main Navigation | /components/NavHeader.tsx | Client Component |
| Root Layout | /app/layout.tsx | Server Component |
| Admin Navigation | /app/admin/(dashboard)/layout.tsx | Server Component |
| Property Filters | /app/components/PropertyFilters.tsx | Client Component |
| Properties Page | /app/properties/page.tsx | Server Component |
| News Page | /app/news/page.tsx | Server Component |
| Dynamic Pages | /app/[[...slug]]/page.tsx | Server Component |
| Routing Config | /next.config.js | Config File |

---

## Primary Navigation Links

```
HOME                   /
PROPERTIES            /properties
GURUGRAM MAPS         /maps
NEWS                  /news
CUSTOMER REVIEWS      https://www.google.com/search?q=... (external)
ABOUT US              /about-us
CONTACT US            /contact-us
```

---

## Admin Routes (Protected)

```
Dashboard Overview       /admin
Manage Properties       /admin/properties
Manage News            /admin/news
Manage Maps Page       /admin/maps
Edit About Us          /admin/pages/about-us
Edit Contact Us        /admin/pages/contact-us
Edit Useful Websites   /admin/pages/list-of-useful-websites
```

---

## Link Types Used

### HTML Anchor Tags (40+ instances)
- Standard HTML links using href attribute
- Used in public-facing pages
- Better for SEO crawlability

Examples:
```jsx
<a href="/properties">Properties</a>
<a href={dynamicUrl}>{title}</a>
<a href={`/properties?page=${page}`}>Next Page</a>
```

### Next.js Link Component (7 instances)
- Used only in admin protected area
- Imported from 'next/link'
- Optimized for internal navigation

Example:
```jsx
import Link from 'next/link';
<Link href="/admin/properties">Manage Properties</Link>
```

### Programmatic Navigation (1 instance)
- Used in PropertyFilters component
- Uses useRouter hook
- For dynamic parameter management

Example:
```jsx
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push(buildHref(slug));
```

---

## Query Parameters

### Property Filters
```
Filter by type:        ?filter=apartments
Filter by type:        ?filter=plots
Filter by type:        ?filter=commercial
```

### Pagination
```
Page number:           ?page=1
Page with filter:      ?filter=apartments&page=1
```

### Special Parameters
```
Search/filter reset:   Remove parameter from URL
```

---

## Component Hooks for Navigation

### NavHeader.tsx (Client Component)
- `usePathname()` - Detects route changes, closes mobile menu
- `useState()` - Manages menu open/closed state
- `useEffect()` - Handles pathname changes and window resize

### PropertyFilters.tsx (Client Component)
- `useRouter()` - For programmatic navigation
- `useSearchParams()` - Reads current query parameters
- `usePathname()` - Gets current pathname

---

## Navigation Features by Page

### Homepage (/)
- Hero section with call-to-action buttons
- Featured properties section with links
- Featured news section with links
- Footer with social links

### Properties Page (/properties)
- Property filter buttons (client-side)
- Property card grid with links
- Pagination navigation
- Filter state persists across pages

### News Page (/news)
- News article grid
- Article links
- Pagination navigation

### Dynamic Pages (/[slug], /about-us, etc.)
- Breadcrumb navigation
- Internal content links
- Social media links

### Admin Area (/admin/*)
- Sidebar navigation with all admin sections
- Logout button (server action)
- Authentication check on load

---

## Accessibility Features

| Feature | Element | Implementation |
|---------|---------|-----------------|
| Menu Toggle | NavHeader | aria-expanded, aria-controls |
| Screen Reader | NavHeader | sr-only text |
| Current Page | Pagination | aria-current="page" |
| Button State | Filters | aria-pressed |
| Social Links | Footer | aria-label |
| External Links | All | rel="noopener noreferrer" |
| Breadcrumbs | Dynamic Pages | aria-label="Breadcrumb" |
| Semantic Nav | All sections | <nav> with aria-label |

---

## Mobile Navigation Behavior

**Breakpoint:** 1024px

**Desktop (>= 1024px):**
- Navigation always visible
- Hamburger menu hidden
- All menu items expanded

**Mobile (< 1024px):**
- Navigation hidden by default
- Hamburger menu visible and clickable
- Menu expands/collapses on toggle
- Menu auto-closes on:
  - Route change
  - Window resize to >= 1024px

---

## Routing Configuration (next.config.js)

### URL Rewrites
- `/sites/default/files/:path*` rewrites to legacy media origin
- Allows serving old media without changing structure

### Cache Headers
- Default: `no-cache, no-store, must-revalidate`
- Media files: `public, max-age=31536000, immutable`
- Static assets: `public, max-age=31536000, immutable`

### Other Settings
- `output: 'standalone'` - Container-optimized
- `trailingSlash: false` - No trailing slash on URLs
- `typedRoutes: false` - Disabled typed routing

---

## SEO Navigation Elements

### Canonical Links
```html
<link rel="canonical" href="https://..." />
```

### Language Alternatives (hreflang)
```html
<link rel="alternate" hrefLang="en" href="..." />
<link rel="alternate" hrefLang="hi" href="..." />
<link rel="alternate" hrefLang="x-default" href="..." />
```

### Breadcrumbs
- Displayed on category and detail pages
- Helps with SEO and user navigation

### Internal Links
- All internal links use relative URLs
- External links have target="_blank" and rel="noopener noreferrer"

---

## URL Alias Resolution

Database looks up custom URL aliases for properties and news items.

Flow:
```
1. User clicks link with ID
2. System checks url_alias table
3. If alias exists: Use custom URL
4. If no alias: Use slug-based URL
5. Render content
```

Example:
```
Property ID: 123
Slug: "gurugram-sector-45-plot"
Alias (if exists): "/sector-45-gurgaon"
Final URL: "/sector-45-gurgaon" (with alias)
           "/gurugram-sector-45-plot" (without alias)
```

---

## Common Navigation Patterns

### Creating Internal Links
```jsx
// Standard HTML
<a href="/properties">View Properties</a>

// With dynamic URL
<a href={`/${item.slug}`}>{item.title}</a>

// With query parameters
<a href={`/properties?filter=${filter}&page=${page}`}>Next</a>

// In admin area
import Link from 'next/link';
<Link href="/admin/properties">Manage</Link>
```

### Creating Filter Navigation
```jsx
// In PropertyFilters component
const handleFilterClick = (slug) => {
  const newHref = buildHref(slug);
  router.push(newHref);
};

<button onClick={() => handleFilterClick(slug)}>
  {filter.name}
</button>
```

### Creating Pagination Links
```jsx
// Standard pagination
const createHref = (page) => {
  const params = new URLSearchParams(currentParams);
  if (page > 0) {
    params.set('page', page);
  }
  return `${pathname}?${params.toString()}`;
};

<a href={createHref(nextPage)}>Next</a>
```

---

## Debugging Navigation Issues

### Check if using correct import
- Public pages: Use HTML `<a>` tags
- Admin pages: Use `import Link from 'next/link'`
- Dynamic routes: Use `useRouter()` for complex logic

### Mobile menu not closing
- Check if `usePathname()` hook is implemented
- Check window resize listener in useEffect

### Filters not working
- Check PropertyFilters component
- Verify useRouter is from 'next/navigation' not 'next/router'
- Check URLSearchParams construction

### Links not crawlable
- Ensure using HTML `<a>` tags with href
- Avoid using onClick handlers without href
- Use data attributes for styling, not JavaScript-only links

---

## Performance Considerations

1. **Link prefetching:**
   - Next.js Link component auto-prefetches
   - Standard `<a>` tags don't prefetch
   - Used in admin area where prefetch benefit is high

2. **Query parameters:**
   - Enables bookmarking filtered states
   - Better user experience for pagination
   - Easier debugging of user states

3. **Dynamic imports:**
   - All navigation components are eagerly loaded
   - No lazy loading of navigation

4. **Mobile optimization:**
   - Hamburger menu reduces initial render size
   - Menu state managed with useState
   - Lightweight CSS-based toggle

---

## Summary Statistics

- Total navigation links: ~50+ across all pages
- Navigation components: 4 main components
- Routes: 20+ public + 7 admin routes
- Query parameters: 3+ used (filter, page, etc.)
- Link types: 3 different implementation patterns
- Accessibility features: 8+ ARIA attributes

---

