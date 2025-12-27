import prisma from '@/lib/db';
import { stripHtmlTags } from '@/lib/html';

export const revalidate = 1800;

const NEWS_PER_PAGE = 12;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage =
    typeof resolvedSearchParams.page === 'string'
      ? Math.max(0, Number.parseInt(resolvedSearchParams.page, 10) || 0)
      : 0;

  const totalCount = await prisma.node.count({
    where: { published: true, type: 'news' },
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / NEWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);

  const newsNodes = await prisma.node.findMany({
    where: { published: true, type: 'news' },
    orderBy: { createdAt: 'desc' },
    skip: safePage * NEWS_PER_PAGE,
    take: NEWS_PER_PAGE,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      bodyHtml: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  const nodeIds = newsNodes.map((node) => node.id);
  const aliases = nodeIds.length
    ? await prisma.urlAlias.findMany({
        where: {
          targetType: 'node',
          targetId: { in: nodeIds },
        },
        select: {
          targetId: true,
          sourcePath: true,
        },
      })
    : [];

  const aliasMap = new Map(aliases.map((alias) => [alias.targetId, alias.sourcePath]));

  const placeholderImages = [
    'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=400',
    'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=400',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  ];

  const pagination = buildPagination({
    basePath: '/news',
    currentPage: safePage,
    totalPages,
  });

  return (
    <div className="page-wrapper">
      <header className="page-hero">
        <h1>News &amp; Policy Updates</h1>
        <p>
          Stay informed with the latest policy changes, infrastructure updates and market
          insights impacting real estate investors in Gurugram.
        </p>
      </header>

      <section className="news-grid-section">
        <div className="news-grid">
          {newsNodes.map((newsItem, index) => {
            const url = aliasMap.get(newsItem.id) || `/${newsItem.slug}`;
            const imageUrl =
              newsItem.imageUrl || placeholderImages[index % placeholderImages.length];
            const snippetSource = newsItem.summary
              ? newsItem.summary
              : newsItem.bodyHtml
              ? stripHtmlTags(newsItem.bodyHtml)
              : '';
            const snippet = snippetSource ? snippetSource.slice(0, 200) : null;
            const truncated = snippetSource.length > 200;

            return (
              <article key={newsItem.id} className="news-card">
                <div className="news-image-wrapper">
                  <img src={imageUrl} alt={newsItem.title} />
                </div>
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
            );
          })}
        </div>

        {newsNodes.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No news articles available right now. Please check back later.
          </p>
        )}
      </section>

      {pagination.length > 0 && (
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
      )}
    </div>
  );
}

interface PaginationInput {
  basePath: string;
  currentPage: number;
  totalPages: number;
}

type PaginationItem =
  | {
      type: 'page';
      page: number;
      label: string;
      href: string;
      isActive: boolean;
    }
  | {
      type: 'control';
      key: 'prev' | 'next';
      label: string;
      href: string;
    };

function buildPagination(input: PaginationInput): PaginationItem[] {
  const { basePath, currentPage, totalPages } = input;

  if (totalPages <= 1) {
    return [];
  }

  const createHref = (page: number) => {
    if (page <= 0) {
      return basePath;
    }
    const params = new URLSearchParams({ page: page.toString() });
    return `${basePath}?${params.toString()}`;
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
