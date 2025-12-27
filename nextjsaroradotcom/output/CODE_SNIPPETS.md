# Navigation Code Snippets Reference

## Quick Copy-Paste Examples from Arora Real Tech Navigation

---

## 1. Main Navigation Links Configuration

**File:** `/components/NavHeader.tsx`

```typescript
const PRIMARY_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/properties', label: 'PROPERTIES' },
  { href: '/maps', label: 'GURUGRAM MAPS' },
  { href: '/news', label: 'NEWS' },
  {
    href: 'https://www.google.com/search?q=arora+realtech&rlz=1C1SQJL_enIN911IN911&oq=arora+realtech&aqs=chrome..69i57j69i60l3.6043j0j15&sourceid=chrome&ie=UTF-8#lrd=0x390d18c35a5291c5:0x3f9f69280634fa4b,1,,,',
    label: 'CUSTOMER REVIEWS',
    external: true,
  },
  { href: '/about-us', label: 'ABOUT US' },
  { href: '/contact-us', label: 'CONTACT US' },
];
```

---

## 2. Responsive Navigation Menu

**File:** `/components/NavHeader.tsx`

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

---

## 3. Mobile Menu Behavior

**File:** `/components/NavHeader.tsx`

```typescript
// Close menu on route change
useEffect(() => {
  setMenuOpen(false);
}, [pathname]);

// Close menu on resize to desktop
useEffect(() => {
  const listener = () => {
    if (window.innerWidth >= 1024) {
      setMenuOpen(false);
    }
  };

  window.addEventListener('resize', listener);
  return () => window.removeEventListener('resize', listener);
}, []);
```

---

## 4. Admin Navigation Links

**File:** `/app/admin/(dashboard)/layout.tsx`

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

---

## 5. Property Filters with Dynamic Routing

**File:** `/app/components/PropertyFilters.tsx`

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

---

## 6. Filter Button Component

**File:** `/app/components/PropertyFilters.tsx`

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

---

## 7. Pagination Navigation

**File:** `/app/properties/page.tsx`

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

---

## 8. Pagination Builder Function

**File:** `/app/properties/page.tsx`

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

  const items: PaginationItem[] = [];

  if (currentPage > 0) {
    items.push({
      type: 'control',
      key: 'prev',
      label: 'Previous',
      href: createHref(currentPage - 1),
    });
  }

  for (let page = 0; page < totalPages; page += 1) {
    items.push({
      type: 'page',
      page,
      label: (page + 1).toString(),
      href: createHref(page),
      isActive: page === currentPage,
    });
  }

  if (currentPage < totalPages - 1) {
    items.push({
      type: 'control',
      key: 'next',
      label: 'Next',
      href: createHref(currentPage + 1),
    });
  }

  return items;
}
```

---

## 9. Dynamic Links with Database URLs

**File:** `/app/properties/page.tsx`

```typescript
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

const aliasMap = new Map(aliases.map((alias) => [alias.targetId, alias.sourcePath]));

// Usage in JSX
const url = aliasMap.get(property.id) || `/${property.slug}`;
<a href={url}>{property.title}</a>
```

---

## 10. Property Card Links

**File:** `/app/properties/page.tsx`

```jsx
<article key={property.id} className="property-card">
  <div className="property-content">
    <h3 className="property-title">
      <a href={url}>{property.title}</a>
    </h3>
    {summaryText && summaryText.trim().length > 0 && (
      <p className="property-description">
        {summaryText}
        {summaryTruncated ? '...' : ''}
      </p>
    )}
    <div className="property-footer">
      <a href={url} className="read-more-btn">
        View details
      </a>
      <span className="property-tag">{propertyTerm.toUpperCase()}</span>
    </div>
  </div>
</article>
```

---

## 11. News Card Links

**File:** `/app/news/page.tsx`

```jsx
<article key={newsItem.id} className="news-card">
  <div className="news-content">
    <h2 className="news-title">
      <a href={url}>{newsItem.title}</a>
    </h2>
    <time dateTime={newsItem.createdAt.toISOString()} className="news-date">
      {new Date(newsItem.createdAt).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}
    </time>
    {snippet && snippet.trim().length > 0 && (
      <p className="news-summary">
        {snippet}
        {truncated ? '...' : ''}
      </p>
    )}
    <a href={url} className="read-more-btn">
      Read article
    </a>
  </div>
</article>
```

---

## 12. Top Bar Navigation

**File:** `/app/layout.tsx`

```jsx
<div className="top-bar">
  <div className="top-bar-container">
    <ul className="top-links">
      <li><a href="/websites">Useful Websites</a></li>
      <li><a href="/maps">Gurgaon Maps</a></li>
      <li><a href="/important-documents">Frequently Used Documents</a></li>
    </ul>
    <div className="top-actions">
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
    </div>
  </div>
</div>
```

---

## 13. SEO Navigation Elements

**File:** `/app/[[...slug]]/head.tsx`

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

## 14. Breadcrumb Navigation

**File:** `/app/[[...slug]]/page.tsx`

```jsx
<nav className="property-breadcrumbs" aria-label="Breadcrumb">
  {breadcrumbs.map((breadcrumb, index) => (
    <span key={breadcrumb.href}>
      {index > 0 && ' > '}
      {index === breadcrumbs.length - 1 ? (
        <span>{breadcrumb.label}</span>
      ) : (
        <a href={breadcrumb.href}>{breadcrumb.label}</a>
      )}
    </span>
  ))}
</nav>
```

---

## 15. Login Redirect (Authentication)

**File:** `/app/admin/(dashboard)/layout.tsx`

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!isValidAdminSession(sessionCookie?.value)) {
    redirect('/admin/login');
  }

  return (
    // ... rest of layout
  );
}
```

---

## 16. Server Action for Logout

**File:** `/app/admin/(dashboard)/layout.tsx`

```typescript
async function logout() {
  'use server';

  const cookieStore = cookies();
  cookieStore.delete({
    name: ADMIN_COOKIE_NAME,
    path: '/admin',
  });

  redirect('/admin/login');
}

// Usage in JSX
<form action={logout}>
  <button type="submit">Log out</button>
</form>
```

---

## 17. Query Parameter Building Pattern

**File:** `/app/components/PropertyFilters.tsx`

```typescript
const buildHref = (slug: string | null) => {
  const params = new URLSearchParams(searchParams.toString());
  
  // Clear page when filter changes
  params.delete('page');
  
  // Update filter
  if (slug === null) {
    params.delete('filter');
  } else {
    params.set('filter', slug);
  }
  
  // Build final URL
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};
```

---

## 18. Next.js Hooks Usage

**File:** `/app/components/PropertyFilters.tsx`

```typescript
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function PropertyFilters({ filters, currentFilter }: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Use these hooks for navigation logic
}
```

---

## 19. Navigation Configuration (next.config.js)

**File:** `/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,

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
  },

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
    ];
  },
};

export default nextConfig;
```

---

## 20. Hero Section Navigation Buttons

**File:** `/app/[[...slug]]/page.tsx`

```jsx
<section className="hero-section">
  <div className="hero-content">
    <h1>Welcome to Arora Real Tech</h1>
    <p>Find your dream property in Gurugram</p>
    <div className="hero-actions">
      <a className="hero-btn primary" href="tel:+919811586101">
        Call +91 98115 86101
      </a>
      <a className="hero-btn secondary" href="/properties">
        Explore Properties
      </a>
    </div>
  </div>
</section>
```

---

