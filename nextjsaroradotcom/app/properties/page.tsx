import PropertyFilters from '../components/PropertyFilters';
import prisma from '@/lib/db';
import { stripHtmlTags } from '@/lib/html';
import type { Prisma } from '@prisma/client';

export const revalidate = 3600;

const PROPERTIES_PER_PAGE = 18;
const PROPERTY_BASE_PATH = '/property';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertiesPage({
  searchParams,
  basePath = PROPERTY_BASE_PATH,
}: PageProps & { basePath?: string }) {
  const resolvedSearchParams = await searchParams;

  const filterSlug =
    typeof resolvedSearchParams.filter === 'string'
      ? resolvedSearchParams.filter.toLowerCase()
      : null;
  const currentPage =
    typeof resolvedSearchParams.page === 'string'
      ? Math.max(0, Number.parseInt(resolvedSearchParams.page, 10) || 0)
      : 0;

  const propertyTerms = await prisma.taxonomyTerm.findMany({
    where: { vocabulary: 'property' },
    orderBy: { name: 'asc' },
    select: { tid: true, name: true, slug: true },
  });

  const selectedTerm = filterSlug
    ? propertyTerms.find((term) => term.slug === filterSlug)
    : null;

  const whereClause: Prisma.NodeWhereInput = {
    published: true,
    type: 'property',
    ...(selectedTerm
      ? {
          nodeTerms: {
            some: {
              term: {
                vocabulary: 'property',
                slug: selectedTerm.slug,
              },
            },
          },
        }
      : {}),
  };

  const totalCount = await prisma.node.count({ where: whereClause });
  const totalPages = Math.max(1, Math.ceil(totalCount / PROPERTIES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);

  const properties = await prisma.node.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: safePage * PROPERTIES_PER_PAGE,
    take: PROPERTIES_PER_PAGE,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      bodyHtml: true,
      imageUrl: true,
      createdAt: true,
      nodeTerms: {
        where: {
          term: {
            vocabulary: 'property',
          },
        },
        select: {
          term: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

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

  const placeholderImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
  ];

  const pagination = buildPagination({
    basePath,
    currentPage: safePage,
    totalPages,
    filterSlug: selectedTerm?.slug ?? null,
  });

  return (
    <div className="page-wrapper property-page">
      <div className="page-container">
        <header className="property-page-hero">
          <h1>Properties</h1>
        </header>

        <section className="filters-section property-filter-section">
          <h2 className="visually-hidden">Filter properties by category</h2>
          <PropertyFilters
            filters={propertyTerms}
            currentFilter={selectedTerm?.slug ?? null}
            basePath={basePath}
          />
        </section>

        <section className="properties-grid-section">
          <div className="property-grid">
            {properties.map((property, index) => {
              const url = aliasMap.get(property.id) || `/${property.slug}`;
              const imageUrl =
                property.imageUrl || placeholderImages[index % placeholderImages.length];
              const propertyTerm = property.nodeTerms[0]?.term?.name ?? 'Property';
              const propertyTermSlug = property.nodeTerms[0]?.term?.slug ?? '';

              const summarySource = property.summary
                ? property.summary
                : property.bodyHtml
                ? stripHtmlTags(property.bodyHtml)
                : '';
              const summaryText = summarySource ? summarySource.slice(0, 180) : null;
              const summaryTruncated = summarySource.length > 180;

              const createdDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(property.createdAt);

              return (
                <article key={property.id} className="property-card">
                  <div className="property-card-img">
                    <img src={imageUrl} alt={property.title} />
                  </div>
                  <div className="property-card-body">
                    <strong className="property-card-date">{createdDate}</strong>
                    <h3 className="property-card-title">
                      <a href={url}>{property.title}</a>
                    </h3>
                    {summaryText && summaryText.trim().length > 0 && (
                      <p className="property-card-summary">
                        {summaryText}
                        {summaryTruncated ? '...' : ''}
                      </p>
                    )}
                    <div className="property-card-actions">
                      <a href={url} className="btn btn-sm btn-outline-primary">
                        Read more
                      </a>
                    </div>
                  </div>
                  <div className="property-card-footer">
                    <span className="property-card-tag-icon" aria-hidden="true">
                      #
                    </span>
                    {propertyTermSlug ? (
                      <a href={`/${propertyTermSlug}`}>{propertyTerm}</a>
                    ) : (
                      <span>{propertyTerm}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {properties.length === 0 && (
            <p className="property-empty-state">
              No properties available at the moment. Try removing filters or come back soon.
            </p>
          )}
        </section>

        {pagination.length > 0 && (
          <nav className="pagination property-pagination" aria-label="Pagination">
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
    </div>
  );
}

interface PaginationInput {
  basePath: string;
  currentPage: number;
  totalPages: number;
  filterSlug: string | null;
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
