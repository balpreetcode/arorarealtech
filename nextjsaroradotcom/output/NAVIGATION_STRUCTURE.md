# Navigation Structure Diagram
## Arora Real Tech - Next.js Navigation Flow

---

## Site Navigation Hierarchy

```
ROOT LAYOUT (app/layout.tsx)

TOP BAR (Server Component)
  Useful Websites --> /websites
  Gurgaon Maps --> /maps
  Frequently Used Documents --> /important-documents
  
  SOCIAL & ACTION BUTTONS
    Facebook (external)
    LinkedIn (external)
    WhatsApp (external) --> https://wa.me/...
    Call Us --> tel:+919811586101

NAV HEADER (components/NavHeader.tsx - Client Component)
  LOGO --> /
  
  PRIMARY MENU (responsive, hamburger on mobile)
    HOME --> /
    PROPERTIES --> /properties
    GURUGRAM MAPS --> /maps
    NEWS --> /news
    CUSTOMER REVIEWS --> https://www.google.com/search?... (external)
    ABOUT US --> /about-us
    CONTACT US --> /contact-us

PAGE CONTENT

HOMEPAGE (app/[[...slug]]/page.tsx)
  HERO SECTION
    Call Button --> tel:+919811586101
    Explore Properties --> /properties
  
  FEATURED PROPERTIES SECTION
    Property Card Links --> /{property-url}
    Read More --> /{property-url}
  
  NEWS SECTION
    News Card Links --> /{news-url}
    Read More --> /{news-url}
    View All News --> /news
  
  FOOTER
    Logo --> /
    Facebook --> https://... (external)
    LinkedIn --> https://... (external)
    Email --> mailto:info@arorarealtech.com

PROPERTIES PAGE (app/properties/page.tsx)
  PROPERTY FILTERS (app/components/PropertyFilters.tsx - Client Component)
    - Any - (Reset Filter)
    Filter: Plots --> ?filter=plots
    Filter: Apartments --> ?filter=apartments
    Filter: Commercial --> ?filter=commercial
  
  PROPERTY GRID
    Property Card Links --> /{property-url}
    View Details --> /{property-url}
  
  PAGINATION NAVIGATION
    Previous --> /properties?page=0&filter=...
    Page 1 --> /properties?page=0&filter=...
    Page 2 --> /properties?page=1&filter=...
    Page 3 --> /properties?page=2&filter=...
    Next --> /properties?page=2&filter=...

NEWS PAGE (app/news/page.tsx)
  NEWS GRID
    News Card Links --> /{news-url}
    Read Article --> /{news-url}
  
  PAGINATION NAVIGATION
    Previous --> /news?page=0
    Page 1 --> /news?page=0
    Page 2 --> /news?page=1
    Next --> /news?page=1

DYNAMIC CONTENT PAGES (app/[[...slug]]/page.tsx)
  /properties/{slug}
  /news/{slug}
  /about-us
  /contact-us
  /websites
  /maps
  /important-documents

ADMIN AREA (Protected Routes)
  ADMIN LAYOUT (app/admin/(dashboard)/layout.tsx - Server Component)
    HEADER
      Logout Button (Server Action)
    
    SIDEBAR NAVIGATION (Next.js Link components)
      Dashboard Overview --> /admin
      Manage Properties --> /admin/properties
      Manage News --> /admin/news
      Manage Maps Page --> /admin/maps
      Edit About Us --> /admin/pages/about-us
      Edit Contact Us --> /admin/pages/contact-us
      Edit Useful Websites --> /admin/pages/list-of-useful-websites
```

---

## Route Tree Structure

app/
  layout.tsx                          (ROOT LAYOUT - Server)
    NavHeader.tsx (imported)          (Client Component)

  properties/
    page.tsx                          (PROPERTIES LIST - Server)
    [slug]/                           (Individual property)

  news/
    page.tsx                          (NEWS LIST - Server)
    [slug]/                           (Individual news item)

  [[...slug]]/
    page.tsx                          (CATCH-ALL DYNAMIC ROUTES - Server)
    head.tsx                          (SEO HEAD - Canonical & hreflang)

  admin/
    (auth)/
      login/
        page.tsx                      (LOGIN - No auth required)
    
    (dashboard)/
      layout.tsx                      (PROTECTED LAYOUT - Server)
      page.tsx                        (DASHBOARD OVERVIEW)
      properties/
        page.tsx                      (MANAGE PROPERTIES)
        new/page.tsx                  (NEW PROPERTY)
        [id]/page.tsx                 (EDIT PROPERTY)
      news/
        page.tsx                      (MANAGE NEWS)
        new/page.tsx                  (NEW NEWS ITEM)
        [id]/page.tsx                 (EDIT NEWS ITEM)
      maps/
        page.tsx                      (MANAGE MAPS)
      pages/
        [slug]/page.tsx               (EDIT STATIC PAGES)

  components/
    PropertyFilters.tsx               (CLIENT COMPONENT)

---

## Link Implementation Patterns

### 1. Standard HTML Anchor Tags (Most Common)
Used in: NavHeader, Root Layout, Properties Page, News Page, Dynamic Pages

Pattern:
  <a href="/path">Label</a>
  <a href={dynamicUrl}>Label</a>
  <a href={`/path?param=${value}`}>Label</a>

Benefits:
  - Server-side rendering friendly
  - Better for SEO (crawlable by default)
  - No additional JavaScript overhead

### 2. Next.js Link Component
Used in: Admin Dashboard Layout (protected area only)

Pattern:
  import Link from 'next/link';
  <Link href="/admin/properties">Manage Properties</Link>

Benefits:
  - Optimized for admin routes
  - Protected by authentication check
  - Cleaner API for Next.js developers

### 3. Programmatic Navigation
Used in: PropertyFilters Component

Pattern:
  import { useRouter } from 'next/navigation';
  const router = useRouter();
  const handleFilterClick = (slug) => { router.push(buildHref(slug)); };
  <button onClick={() => handleFilterClick(slug)}>Filter</button>

Benefits:
  - Complex query parameter management
  - Dynamic href construction
  - React state integration

---

## Query Parameter Patterns

Properties Page Filtering & Pagination:
  Base: /properties
  With Filter: /properties?filter=apartments
  With Page: /properties?page=1
  With Both: /properties?filter=apartments&page=1
  Reset Filter: /properties (removes ?filter)
  First Page: /properties (removes ?page)

News Page Pagination:
  Base: /news
  With Page: /news?page=1
  Next Page: /news?page=2

Dynamic Category Pages:
  Base: /{category-slug}
  With Page: /{category-slug}?page=1
  Next Page: /{category-slug}?page=2

---

## Mobile Navigation Behavior

Desktop (>= 1024px):
  - NavHeader always expanded
  - All menu items visible
  - Hamburger button hidden

Mobile (< 1024px):
  - NavHeader collapsed by default
  - Hamburger button visible
  - Menu expands on button click
  - Menu collapses on:
    - Route change (usePathname)
    - Window resize to >= 1024px

---

## Summary of Navigation Methods

HTML <a> tags:     ~40+ instances    Public pages        Standard navigation
Next.js Link:      ~7 instances      Admin area          Protected routes
router.push():     1 instance        PropertyFilters     Dynamic filtering
<form action={}:   1 instance        Admin logout        Server action

