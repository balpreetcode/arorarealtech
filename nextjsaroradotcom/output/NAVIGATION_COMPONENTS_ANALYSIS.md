# Next.js Navigation Components Analysis
## Project: Arora Real Tech

---

## Overview
This document provides a comprehensive analysis of all navigation components, Link implementations, and routing configurations found in the Next.js codebase.

---

## 1. Primary Navigation Component

### File: `/components/NavHeader.tsx`

**Type:** Client Component (`'use client'`)

**Purpose:** Main navigation header with hamburger menu support

**Key Features:**
- Responsive navigation with mobile menu toggle
- Uses standard HTML `<a>` tags (not Next.js Link component)
- Pathname-based active state detection
- Auto-collapse menu on route change
- Auto-collapse menu on window resize (1024px breakpoint)

**Navigation Links Configuration:**
```typescript
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
```

**JSX Structure:**
```jsx
<nav className="nav-header">
  <div className="nav-container">
    <a href="/" className="nav-logo">
      Arora Real Tech
    </a>
    <button
      type="button"
      className="nav-toggle"
      aria-expanded={menuOpen}
      aria-controls="primary-navigation"
      onClick={() => setMenuOpen((open) => !open)}
    >
      <span className="sr-only">Toggle navigation</span>
      <span aria-hidden="true" className={`nav-toggle-bar ${menuOpen ? 'open' : ''}`} />
    </button>
    <ul
      id="primary-navigation"
      className={`nav-menu ${menuOpen ? 'open' : ''}`}
    >
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
</nav>
```

**Hooks Used:**
- `useEffect()` - For pathname tracking and resize listener
- `usePathname()` - To detect route changes and close menu
- `useState()` - To manage menu open/closed state

---

## 2. Root Layout Navigation

### File: `/app/layout.tsx`

**Type:** Server Component (Root Layout)

**Features:**
- Top bar with utility links
- Social media links (Facebook, LinkedIn)
- WhatsApp and Phone contact buttons
- NavHeader component integration

**Top Bar Links:**
```jsx
<ul className="top-links">
  <li><a href="/websites">Useful Websites</a></li>
  <li><a href="/maps">Gurgaon Maps</a></li>
  <li><a href="/important-documents">Frequently Used Documents</a></li>
</ul>
```

**Social Links:**
```jsx
<ul className="top-social">
  <li>
    <a
      href="https://www.facebook.com/Arora-Realtech-165127780320836/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Facebook"
    >
      FB
    </a>
  </li>
  <li>
    <a
      href="https://www.linkedin.com/in/arun-arora-6baaa224/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LinkedIn"
    >
      IN
    </a>
  </li>
</ul>
```

**Action Buttons:**
```jsx
<a
  className="top-button whatsapp"
  href="https://wa.me/919811586101?text=I%27m%20inquiring%20about%20the%20property%20listing"
  target="_blank"
  rel="noopener noreferrer"
>
  Chat on WhatsApp
</a>
<a className="top-button phone" href="tel:+919811586101">
  Call Us
</a>
```

---

## 3. Admin Dashboard Navigation

### File: `/app/admin/(dashboard)/layout.tsx`

**Type:** Server Component with Authentication

**Features:**
- Sidebar navigation menu
- Protected routes (redirects to login if not authenticated)
- Uses Next.js `Link` component for navigation
- Logout functionality via server action

**Navigation Links:**
```jsx
<nav style={{ width: '220px', borderRight: '1px solid #e2e8f0', padding: '1.5rem 1rem' }}>
  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <li>
      <Link href="/admin" style={linkStyle}>
        Dashboard Overview
      </Link>
    </li>
    <li>
      <Link href="/admin/properties" style={linkStyle}>
        Manage Properties
      </Link>
    </li>
    <li>
      <Link href="/admin/news" style={linkStyle}>
        Manage News
      </Link>
    </li>
    <li>
      <Link href="/admin/maps" style={linkStyle}>
        Manage Maps Page
      </Link>
    </li>
    <li>
      <Link href="/admin/pages/about-us" style={linkStyle}>
        Edit About Us
      </Link>
    </li>
    <li>
      <Link href="/admin/pages/contact-us" style={linkStyle}>
        Edit Contact Us
      </Link>
    </li>
    <li>
      <Link href="/admin/pages/list-of-useful-websites" style={linkStyle}>
        Edit Useful Websites
      </Link>
    </li>
  </ul>
</nav>
```

**Admin Routes:**
- `/admin` - Dashboard Overview
- `/admin/properties` - Manage Properties
- `/admin/news` - Manage News
- `/admin/maps` - Manage Maps Page
- `/admin/pages/about-us` - Edit About Us
- `/admin/pages/contact-us` - Edit Contact Us
- `/admin/pages/list-of-useful-websites` - Edit Useful Websites

---

## 4. Property Filters Component

### File: `/app/components/PropertyFilters.tsx`

**Type:** Client Component (`'use client'`)

**Purpose:** Interactive filter buttons for property listings

**Key Features:**
- Uses `useRouter()` for client-side navigation
- Manages query parameters with `URLSearchParams`
- Builds href dynamically based on current filter
- Button-based navigation (not traditional links)

**Implementation:**
```jsx
<div className="filter-container">
  <button
    className={`filter-btn ${currentFilter === null ? 'active' : ''}`}
    type="button"
    aria-pressed={currentFilter === null}
    onClick={() => handleFilterClick(null)}
  >
    - Any -
  </button>
  {filters.map((filter) => (
    <button
      key={filter.slug}
      className={`filter-btn ${currentFilter === filter.slug ? 'active' : ''}`}
      type="button"
      aria-pressed={currentFilter === filter.slug}
      onClick={() => handleFilterClick(filter.slug)}
    >
      {filter.name}
    </button>
  ))}
</div>
```

**Routing Logic:**
```typescript
const buildHref = (slug: string | null) => {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('page');
  
  if (slug === null) {
    params.delete('filter');
  } else {
    params.set('filter', slug);
  }
  
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const handleFilterClick = (slug: string | null) => {
  if (slug === currentFilter || (slug === null && currentFilter === null)) {
    return;
  }
  router.push(buildHref(slug));
};
```

**Navigation Hooks:**
- `useRouter()` - For programmatic navigation
- `useSearchParams()` - To read current query parameters
- `usePathname()` - To get current pathname

---

## 5. Page-Level Navigation

### A. Properties Page (`/app/properties/page.tsx`)

**Navigation Elements:**
1. **Property Cards Links:**
```jsx
<a href={url}>{property.title}</a>
<a href={url} className="read-more-btn">
  View details
</a>
```

2. **Pagination Navigation:**
```jsx
<nav className="pagination">
  {pagination.map((item) =>
    item.type === 'page' ? (
      <a
        key={item.page}
        href={item.href}
        className={`pagination-link ${item.isActive ? 'active' : ''}`}
        aria-current={item.isActive ? 'page' : undefined}
      >
        {item.label}
      </a>
    ) : (
      <a key={item.key} href={item.href} className="pagination-link">
        {item.label}
      </a>
    )
  )}
</nav>
```

**Pagination Builder Logic:**
```typescript
function buildPagination(input: PaginationInput): PaginationItem[] {
  const { basePath, currentPage, totalPages, filterSlug } = input;

  if (totalPages <= 1) {
    return [];
  }

  const params = new URLSearchParams();
  if (filterSlug) {
    params.set('filter', filterSlug);
  }

  const createHref = (page: number) => {
    const searchParams = new URLSearchParams(params);
    if (page > 0) {
      searchParams.set('page', page.toString());
    } else {
      searchParams.delete('page');
    }
    const query = searchParams.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  // Returns items with type: 'page' | 'control'
}
```

---

### B. News Page (`/app/news/page.tsx`)

**Navigation Elements:**
1. **News Item Links:**
```jsx
<a href={url}>{newsItem.title}</a>
<a href={url} className="read-more-btn">
  Read article
</a>
```

2. **Pagination Navigation:**
```jsx
<nav className="pagination">
  {pagination.map((item) =>
    item.type === 'page' ? (
      <a
        key={item.page}
        href={item.href}
        className={`pagination-link ${item.isActive ? 'page' : ''}`}
        aria-current={item.isActive ? 'page' : undefined}
      >
        {item.label}
      </a>
    ) : (
      <a key={item.key} href={item.href} className="pagination-link">
        {item.label}
      </a>
    )
  )}
</nav>
```

---

### C. Dynamic Slug Page (`/app/[[...slug]]/page.tsx`)

**Navigation Elements:**
1. **Hero Section Buttons:**
```jsx
<a className="hero-btn primary" href="tel:+919811586101">
  Call +91 98115 86101
</a>
<a className="hero-btn secondary" href="/properties">
  Explore Properties
</a>
```

2. **Featured Properties Links:**
```jsx
<a href={url}>{node.title}</a>
<a href={url} className="read-more-btn">
  Read more
</a>
```

3. **View All News Link:**
```jsx
<a className="section-link" href="/news">
  View all news
</a>
```

4. **Breadcrumb Navigation:**
```jsx
<nav className="property-breadcrumbs" aria-label="Breadcrumb">
  {/* Breadcrumb items with href attributes */}
</nav>
```

5. **Category Pagination:**
```jsx
<a href={`/${term.slug}?page=${page - 1}`}>Previous</a>
<a href={`/${term.slug}?page=${page + 1}`}>Next</a>
```

6. **Footer Social Links:**
```jsx
<a href="/" aria-label="Arora Real Tech home">
  {/* Logo */}
</a>
<a href="https://www.facebook.com/Arora-Realtech-165127780320836/" 
   target="_blank" rel="noopener noreferrer">
  {/* Facebook */}
</a>
<a href="https://www.linkedin.com/in/arun-arora-6baaa224/" 
   target="_blank" rel="noopener noreferrer">
  LinkedIn
</a>
<a href="mailto:info@arorarealtech.com">
  info@arorarealtech.com
</a>
```

---

## 6. Routing Configuration

### File: `/next.config.js`

**Routing Features:**

1. **Rewrites Configuration:**
```javascript
async rewrites() {
  const legacyOrigin = process.env.LEGACY_MEDIA_ORIGIN || '';

  if (!legacyOrigin) {
    return [];
  }

  return [
    {
      source: '/sites/default/files/:path*',
      destination: `${legacyOrigin}/sites/default/files/:path*`,
    },
  ];
}
```

2. **Headers Configuration:**
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
    {
      source: '/sites/default/files/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

**Key Config Settings:**
- `output: 'standalone'` - Optimized for containerized deployment
- `trailingSlash: false` - URLs don't end with /
- `experimental.typedRoutes: false` - Typed routes disabled

---

## 7. Route Structure

### Public Routes:
- `/` - Homepage
- `/properties` - Properties listing page with filters & pagination
- `/news` - News listing page with pagination
- `/maps` - Gurugram Maps page
- `/websites` - Useful Websites
- `/important-documents` - Frequently Used Documents
- `/about-us` - About Us page
- `/contact-us` - Contact Us page
- `/[...slug]` - Dynamic catch-all for CMS content

### Admin Routes (Protected):
- `/admin/login` - Admin login page (no authentication required)
- `/admin` - Dashboard Overview
- `/admin/properties` - Manage Properties
- `/admin/news` - Manage News
- `/admin/maps` - Manage Maps Page
- `/admin/pages/about-us` - Edit About Us
- `/admin/pages/contact-us` - Edit Contact Us
- `/admin/pages/list-of-useful-websites` - Edit Useful Websites

---

## 8. Link Component Usage Summary

| Component | Link Type | Method | Notes |
|-----------|-----------|--------|-------|
| NavHeader | HTML `<a>` | Standard anchor tags | Client component, mobile-responsive |
| Root Layout | HTML `<a>` | Standard anchor tags | Server component |
| Admin Layout | Next.js `Link` | Next/link import | Protected routes with authentication |
| PropertyFilters | Programmatic | `router.push()` | Client-side routing with query params |
| Property Cards | HTML `<a>` | Standard anchor tags | Dynamic URLs from database aliases |
| News Cards | HTML `<a>` | Standard anchor tags | Dynamic URLs from database aliases |
| Pagination | HTML `<a>` | Standard anchor tags | Query parameter-based |
| Breadcrumbs | HTML `<a>` | Standard anchor tags | Dynamic based on content type |

---

## 9. Search Engine Optimization (SEO) Navigation

### File: `/app/[[...slug]]/head.tsx`

**SEO Links:**
```jsx
<link rel="canonical" href={seo.canonical} />
{seo.hreflangLinks?.map((link) => (
  <link
    key={link.lang}
    rel="alternate"
    hrefLang={link.lang}
    href={link.url}
  />
))}
```

---

## 10. Special Navigation Features

### 1. **Dynamic URL Resolution**
- Database-backed URL aliases map property/news IDs to custom paths
- Falls back to slug-based URLs if no alias exists
- Example: Property ID 123 might have alias `/gurugram-sector-45-plot`

### 2. **Query Parameter Handling**
- Filters: `?filter=apartment` (property type filter)
- Pagination: `?page=2` (page number)
- Combined: `?filter=apartment&page=2`

### 3. **Category Filtering**
- Properties filtered by taxonomy terms (Plots, Apartments, Commercial)
- Maintains filter state across pagination

### 4. **Mobile Responsive Navigation**
- Hamburger menu on screens < 1024px
- Auto-collapse on route change
- Auto-collapse on window resize

### 5. **Accessibility Features**
- `aria-label` attributes on social links
- `aria-expanded` and `aria-controls` on menu toggle
- `aria-pressed` on filter buttons
- `aria-current="page"` on active pagination links
- Breadcrumb with proper semantic markup

---

## Key Observations

1. **Mixed Link Strategies:**
   - Standard HTML `<a>` tags used in most components
   - Next.js `Link` only used in admin protected area
   - Client-side routing with `router.push()` in PropertyFilters

2. **No next/link in Public Facing Pages:**
   - Indicates use of standard HTML navigation for better crawlability
   - Or possibly intentional choice for SEO reasons

3. **Pathname-Based Detection:**
   - NavHeader uses `usePathname()` to detect active routes
   - No active state styling visible in code

4. **Query Parameter-Heavy Routing:**
   - Filters and pagination via URL search params
   - Enables bookmarkable filtered states

5. **Dynamic Content Routing:**
   - Uses catch-all route `[[...slug]]` for CMS content
   - Path-based resolution through database lookups

---

## Summary of Files

| File Path | Type | Purpose |
|-----------|------|---------|
| `/components/NavHeader.tsx` | Client Component | Main site navigation with mobile menu |
| `/app/layout.tsx` | Server Layout | Root layout with top bar & footer links |
| `/app/admin/(dashboard)/layout.tsx` | Server Layout | Admin sidebar navigation (protected) |
| `/app/components/PropertyFilters.tsx` | Client Component | Interactive filter controls |
| `/app/properties/page.tsx` | Server Component | Properties listing with pagination |
| `/app/news/page.tsx` | Server Component | News listing with pagination |
| `/app/[[...slug]]/page.tsx` | Server Component | Dynamic content pages & homepage |
| `/next.config.js` | Config | Routing rewrites & headers |

