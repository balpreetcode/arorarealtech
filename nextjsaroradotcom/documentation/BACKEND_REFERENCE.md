# Backend Services & Logic Reference

This guide lists server-side files, functions, and responsibilities so backend developers and operators can quickly locate relevant logic.

---

## Core Server Files

### `lib/db.ts`
- **`prisma`** – Singleton Prisma Client instance. Ensures a single connection pool is reused across hot reloads (via `globalThis.prisma` guard) to avoid exhausting database connections.

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### `lib/resolve.ts`
- **`resolveByPath(path: string, searchParams)`** – Main resolver that normalises paths, checks aliases, fetches nodes/terms, and returns discriminated data structures.
- **`resolveNodeBySlug(slug: string)`** – Helper to fetch node by Drupal slug if alias not found.
- **`resolveTermBySlug(slug: string, searchParams)`** – Fetches taxonomy term and paginated node listings.
- **`buildBreadcrumbs(node, path)`** – Generates breadcrumb arrays for property detail pages.
- **`inferLocation(node, path)`** – Derives a location string from node metadata or path segments.

```ts
export async function resolveByPath(path: string, searchParams: Record<string, unknown>) {
  const normalised = path === '' ? '/' : path;
  if (normalised === '/') {
    return { type: 'home' } as const;
  }

  const alias = await prisma.urlAlias.findUnique({ where: { sourcePath: normalised } });

  if (alias?.targetType === 'node') {
    const node = await resolveNodeBySlug(alias.targetId);
    return { type: 'node', node, terms: await fetchTerms(node.id) } as const;
  }

  if (alias?.targetType === 'term') {
    const term = await resolveTermBySlug(alias.targetId, searchParams);
    return { type: 'term', ...term } as const;
  }

  const slug = normalised.replace(/^\//, '');
  const node = await prisma.node.findUnique({ where: { slug } });
  if (node) {
    return { type: 'node', node, terms: await fetchTerms(node.id) } as const;
  }

  throw new Error(`Unable to resolve path: ${normalised}`);
}
```

```ts
async function resolveTermBySlug(id: number, searchParams: Record<string, unknown>) {
  const currentPage =
    typeof searchParams.page === 'string'
      ? Math.max(0, Number.parseInt(searchParams.page, 10) || 0)
      : 0;

  const term = await prisma.taxonomyTerm.findUnique({ where: { id } });
  if (!term) {
    throw new Error(`Term ${id} not found`);
  }

  const totalCount = await prisma.nodeTerm.count({
    where: { termId: term.id, node: { published: true } },
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / TERM_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);

  const nodes = await prisma.node.findMany({
    where: {
      published: true,
      nodeTerms: { some: { termId: term.id } },
    },
    orderBy: { createdAt: 'desc' },
    skip: safePage * TERM_PAGE_SIZE,
    take: TERM_PAGE_SIZE,
  });

  return { term, nodes, page: safePage, totalPages };
}
```

These functions abstract the legacy Drupal routing semantics so the UI layer simply consumes structured data.

### `lib/html.ts`
- **`sanitizeHtml(html: string)`** – Uses DOMPurify (server-safe) to clean HTML before rendering. Protects against script injection from migrated content.

```ts
import createDOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return createDOMPurify().sanitize(html, {
    USE_PROFILES: { html: true },
  });
}
```

### `app/api/*` (placeholder)
- Currently no custom API routes exist. Future endpoints (e.g., search, revalidation) should live under `app/api/…`.

---

## Page-Level Server Logic (App Router)

### `app/[[...slug]]/page.tsx`
- Server component that resolves route data on the server before rendering. Registers `export const revalidate = 3600` for ISR.

### `app/news/page.tsx`, `app/properties/page.tsx`
- Both pages run server-side Prisma queries (using cached client) to fetch paginated lists and build pagination metadata.

### `app/rss.xml`, `app/sitemap.xml`, `app/robots.txt`
- Exported functions that run at build time or on demand to serve static XML/text responses. They can be updated to pull dynamic data from Prisma if required.

---

## Auxiliary Scripts & Utilities

### Prisma CLI
- `npx prisma migrate dev --name <migration>` – Create new migrations during development.
- `npx prisma migrate deploy` – Apply migrations in staging/production environments.
- `npx prisma studio` – UI explorer for database tables; useful for quick content checks (use read-only credentials in production).

### Seeding (optional)
- Add `prisma/seed.ts` if system needs automated bootstrap data (currently not committed, but supported by Prisma).

---

## Operational Concerns

- **Database connections**: Ensure `DATABASE_URL` points to managed SQL instance. Use connection pooling if DB provider requires.
- **Error handling**: Resolver functions throw typed errors when content is missing; upstream code converts to 404 response.
- **Caching**: ISR handles most caching. Additional caching (Redis, edge caching) can be added later if needed.
- **Logging**: Currently minimal; integrate Sentry/Logtail in `lib/resolve.ts` and API routes for production visibility.

---

This reference should be updated whenever new backend utilities, API routes, or cron jobs are added to the project.
