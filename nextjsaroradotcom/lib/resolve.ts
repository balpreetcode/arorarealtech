import { notFound, permanentRedirect } from 'next/navigation';
import prisma from './db';

export interface ResolvedNode {
  type: 'node';
  node: {
    id: number;
    nid: number;
    type: string;
    title: string;
    slug: string;
    langcode: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    summary: string | null;
    bodyHtml: string | null;
    author: string | null;
    imageUrl: string | null;
    jsonLd: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalPath: string | null;
    robots: string | null;
    hreflangLinks: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterCard: string | null;
  };
  terms: Array<{
    id: number;
    tid: number;
    vocabulary: string;
    name: string;
    slug: string;
  }>;
}

export interface ResolvedTerm {
  type: 'term';
  term: {
    id: number;
    tid: number;
    vocabulary: string;
    name: string;
    slug: string;
    langcode: string;
    descriptionHtml: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  nodes: Array<{
    id: number;
    nid: number;
    type: string;
    title: string;
    slug: string;
    summary: string | null;
    imageUrl: string | null;
    createdAt: Date;
  }>;
  page: number;
  totalPages: number;
}

export interface ResolvedStatic {
  type: 'static';
  content: string;
}

export type ResolvedContent = ResolvedNode | ResolvedTerm | ResolvedStatic;

function normalizePath(path: string): string {
  // Remove trailing slash if present (matching Next.js trailingSlash: false)
  let normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

export async function resolveByPath(
  path: string,
  searchParams: Record<string, string | string[] | undefined> = {},
  lang?: string
): Promise<ResolvedContent> {
  const normalizedPath = normalizePath(path);
  const langcode = lang || 'en';

  // Lookup URL alias
  const alias = await prisma.urlAlias.findFirst({
    where: {
      sourcePath: normalizedPath,
      langcode,
    },
  });

  if (!alias) {
    // Log 404
    await logRoute(normalizedPath);
    notFound();
  }

  // Handle redirects
  if (alias.status === 301 && alias.redirectTo) {
    permanentRedirect(alias.redirectTo);
  }

  // Handle 410 Gone
  if (alias.status === 410) {
    notFound();
  }

  // Resolve based on target type
  if (alias.targetType === 'node' && alias.targetId) {
    return await resolveNode(alias.targetId);
  }

  if (alias.targetType === 'term' && alias.targetId) {
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 0;
    return await resolveTerm(alias.targetId, page);
  }

  // Static content or other types
  notFound();
}

async function resolveNode(nodeId: number): Promise<ResolvedNode> {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      nodeTerms: {
        include: {
          term: true,
        },
      },
    },
  });

  if (!node || !node.published) {
    notFound();
  }

  return {
    type: 'node',
    node: {
      id: node.id,
      nid: node.nid,
      type: node.type,
      title: node.title,
      slug: node.slug,
      langcode: node.langcode,
      published: node.published,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      summary: node.summary,
      bodyHtml: node.bodyHtml,
      author: node.author,
      imageUrl: node.imageUrl,
      jsonLd: node.jsonLd,
      metaTitle: node.metaTitle,
      metaDescription: node.metaDescription,
      canonicalPath: node.canonicalPath,
      robots: node.robots,
      hreflangLinks: node.hreflangLinks,
      ogTitle: node.ogTitle,
      ogDescription: node.ogDescription,
      ogImage: node.ogImage,
      twitterCard: node.twitterCard,
    },
    terms: node.nodeTerms.map((nt) => ({
      id: nt.term.id,
      tid: nt.term.tid,
      vocabulary: nt.term.vocabulary,
      name: nt.term.name,
      slug: nt.term.slug,
    })),
  };
}

async function resolveTerm(termId: number, page: number = 0): Promise<ResolvedTerm> {
  const term = await prisma.taxonomyTerm.findUnique({
    where: { id: termId },
  });

  if (!term) {
    notFound();
  }

  const perPage = 20;
  const skip = page * perPage;

  const [nodes, totalCount] = await Promise.all([
    prisma.node.findMany({
      where: {
        published: true,
        nodeTerms: {
          some: {
            termId: term.id,
          },
        },
      },
      select: {
        id: true,
        nid: true,
        type: true,
        title: true,
        slug: true,
        summary: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: perPage,
    }),
    prisma.node.count({
      where: {
        published: true,
        nodeTerms: {
          some: {
            termId: term.id,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return {
    type: 'term',
    term: {
      id: term.id,
      tid: term.tid,
      vocabulary: term.vocabulary,
      name: term.name,
      slug: term.slug,
      langcode: term.langcode,
      descriptionHtml: term.descriptionHtml,
      metaTitle: term.metaTitle,
      metaDescription: term.metaDescription,
    },
    nodes,
    page,
    totalPages,
  };
}

async function logRoute(path: string): Promise<void> {
  try {
    await prisma.routeLog.create({
      data: {
        path,
        referer: null,
        userAgent: null,
      },
    });
  } catch (error) {
    console.error('Failed to log route:', error);
  }
}
