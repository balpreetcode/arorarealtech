# Front-End Code Reference (Next.js & UI)

This document lists all significant front-end files, the key methods/functions they export, and a short description of their responsibilities. Use it as a quick lookup when navigating the project.

---

## App Router Files (`app/`)

### `app/layout.tsx`
- **`RootLayout({ children })`** – Wraps every page with HTML scaffolding, renders the utility bar and `<NavHeader />`, loads global styles.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="top-bar">
          <div className="page-container top-bar-container">
            <ul className="top-links">
              <li><a href="/websites">Useful Websites</a></li>
              <li><a href="/maps">Gurgaon Maps</a></li>
              <li><a href="/important-documents">Frequently Used Documents</a></li>
            </ul>
            <ul className="top-actions">
              <li>
                <a className="top-button whatsapp" href="https://wa.me/919811586101?text=I%27m%20inquiring%20about%20the%20property%20listing" target="_blank" rel="noopener noreferrer">
                  Chat on Whatsapp
                </a>
              </li>
              <li>
                <a className="top-button call" href="tel:+919811586101">Call us</a>
              </li>
            </ul>
          </div>
        </div>
        <NavHeader />
        {children}
      </body>
    </html>
  );
}
```

### `app/[[...slug]]/page.tsx`
- **`Page({ params, searchParams })`** – Catch-all route handler; delegates to `HomePage`, `NodePage`, or `TermPage` based on resolved slug.

```tsx
export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug || [];
  const path = '/' + slug.join('/');

  if (path === '/') {
    return <HomePage />;
  }

  const content = await resolveByPath(path, resolvedSearchParams);
  if (content.type === 'node') {
    return <NodePage content={content} path={path} />;
  }
  if (content.type === 'term') {
    return <TermPage content={content} />;
  }

  return <div>Content not found</div>;
}
```

- **`HomePage()`** – Renders the homepage sections (hero, about/values teasers, property cards, news cards, services, footer).

```tsx
async function HomePage() {
  const recentNodes = await prisma.node.findMany({ /* trimmed for brevity */ });
  const newsNodes = await prisma.node.findMany({ /* trimmed for brevity */ });

  const aboutParagraphs = [
    'Arora Realtech is a leading Real Estate Consultancy Organization in Gurugram, serving its clients for over two decades under the leadership of Dr. Arun Arora.',
    'We provide smarter, faster and reliable solutions for your property needs across residential, commercial, industrial and institutional segments.'
  ];

  return (
    <div className="home-wrapper">
      <section className="hero-banner">
        <div className="hero-image">
          <img src="/images/home/gurugram-hero.jpg" alt="Gurugram city skyline" />
        </div>
        <div className="hero-overlay">
          <div className="page-container">
            <div className="hero-card">
              <h1>Arora Realtech</h1>
              <p className="hero-tagline">
                Helping Buyers, Sellers &amp; Investors make a Right Decision when it comes to Properties in Gurugram
              </p>
              <a className="btn btn-light" href="/about-us">Read more</a>
            </div>
          </div>
        </div>
      </section>
      {/* additional sections trimmed for brevity */}
    </div>
  );
}
```

- **`NodePage({ content, path })`**, **`PropertyDetailPage`**, **`DefaultNodePage`**, and **`TermPage`** coordinate the rendering of node and taxonomy views.

```tsx
function NodePage({ content, path }: { content: ResolvedNode; path: string }) {
  const { node, terms } = content;
  if (node.type === 'property') {
    return <PropertyDetailPage node={node} terms={terms} path={path} />;
  }
  return <DefaultNodePage node={node} terms={terms} />;
}
```

### `app/news/page.tsx`
- **`NewsPage({ searchParams })`** – Paginated news listing (12 per page).
- **`buildPagination({ basePath, currentPage, totalPages })`** – Shared helper producing pagination link metadata.

```tsx
export default async function NewsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const currentPage = typeof resolved.page === 'string'
    ? Math.max(0, Number.parseInt(resolved.page, 10) || 0)
    : 0;

  const totalCount = await prisma.node.count({ where: { published: true, type: 'news' } });
  const totalPages = Math.max(1, Math.ceil(totalCount / NEWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);

  const newsNodes = await prisma.node.findMany({
    where: { published: true, type: 'news' },
    orderBy: { createdAt: 'desc' },
    skip: safePage * NEWS_PER_PAGE,
    take: NEWS_PER_PAGE,
    select: { id: true, title: true, slug: true, summary: true, bodyHtml: true, imageUrl: true, createdAt: true }
  });

  return (
    <div className="page-wrapper">
      {/* render cards */}
    </div>
  );
}
```

### `app/properties/page.tsx`
- **`PropertiesPage({ searchParams })`** – Paginated property listing (12 per page) with taxonomy tags and summaries.
- **`buildPagination(...)`** – Same helper pattern as in news listing.

```tsx
export default async function PropertiesPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const currentPage = typeof resolved.page === 'string'
    ? Math.max(0, Number.parseInt(resolved.page, 10) || 0)
    : 0;

  const totalCount = await prisma.node.count({ where: { published: true, type: 'property' } });
  const totalPages = Math.max(1, Math.ceil(totalCount / PROPERTIES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);

  const properties = await prisma.node.findMany({
    where: { published: true, type: 'property' },
    orderBy: { createdAt: 'desc' },
    skip: safePage * PROPERTIES_PER_PAGE,
    take: PROPERTIES_PER_PAGE,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      imageUrl: true,
      createdAt: true,
      nodeTerms: {
        select: { term: { select: { name: true, slug: true } } }
      }
    }
  });

  return (
    <div className="page-wrapper">
      {/* render property cards */}
    </div>
  );
}
```

### `app/not-found.tsx`
- **`NotFound()`** – Custom 404 page prompting navigation back to the main menu.

### `app/rss.xml`, `app/sitemap.xml`, `app/robots.txt`
- Export functions that generate respective SEO XML/text outputs (static or dynamic as needed).

---

## Components (`components/`)

### `components/NavHeader.tsx`
- **`PRIMARY_LINKS`** – Array describing menu link labels/URLs.
- **`NavHeader()`** – Renders the navigation system: desktop logo + search + menu, CTA buttons, mobile drawer with toggled state managed via React hooks.

```tsx
const PRIMARY_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/properties', label: 'PROPERTIES' },
  { href: '/maps', label: 'GURUGRAM MAPS' },
  { href: '/news', label: 'NEWS' },
  {
    href: 'https://www.google.com/search?q=arora+realtech&…',
    label: 'CUSTOMER REVIEWS',
    external: true,
  },
  { href: '/about-us', label: 'ABOUT US' },
  { href: '/contact-us', label: 'CONTACT US' },
];

export default function NavHeader(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
      {/* desktop row + nav menu + mobile drawer */}
    </header>
  );
}
```

(Additional components can be documented here as they are added.)

---

## Styling (`app/globals.css`)
- No JS methods, but critical CSS classes include:
  - `.top-bar`, `.top-links`, `.top-actions`
  - `.nav-header`, `.nav-main`, `.nav-menu`, `.mobile-menu`
  - `.hero-banner`, `.hero-card`, `.hero-divider`
  - `.teaser`, `.card`, `.card-date`, `.card-footer`
  - `.property-detail-*`, `.news-grid`, `.footer`

Refer to this file when adjusting layout, typography, or responsive behaviour.

---

## Additional Front-End Helpers

### `lib/html.ts`
- **`sanitizeHtml(html: string)`** – Cleans HTML strings prior to rendering with `dangerouslySetInnerHTML`.

### `lib/resolve.ts`
- **`resolveByPath(path: string, searchParams)`** – Resolves friendly URLs to Prisma-backed node/term data.
- **`inferLocation(node, path)`** – Best-effort location string for property detail sidebar.
- **`buildBreadcrumbs(node, path)`** – Constructs breadcrumb trails for property pages.

While technically shared utilities, they are tightly coupled with UI rendering logic and are often touched during front-end work.

---

Use this document alongside the detailed technical manual to trace where each section of the UI is implemented and which functions drive it. Update entries when new screens or components are introduced.
