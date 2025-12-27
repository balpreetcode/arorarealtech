import { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.keys === 'string' ? params.keys : '';

  return {
    title: query ? `Search results for "${query}" - Arora Real Tech` : 'Search - Arora Real Tech',
    description: 'Search properties, news, and content on Arora Real Tech',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.keys === 'string' ? params.keys.trim() : '';

  let results: Array<{
    id: number;
    title: string;
    summary: string | null;
    type: string;
    slug: string;
    url: string;
  }> = [];

  if (query && query.length >= 2) {
    const searchTerm = `%${query}%`;

    // Search in nodes (properties, news, pages)
    const nodes = await prisma.node.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query } },
          { summary: { contains: query } },
          { bodyHtml: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        type: true,
        slug: true,
      },
      take: 50,
    });

    results = nodes.map((node) => {
      let url = '/';

      if (node.type === 'plots') {
        url = `/plots/${node.slug}`;
      } else if (node.type === 'news') {
        url = `/news/${node.slug}`;
      } else {
        url = `/${node.slug}`;
      }

      return {
        id: node.id,
        title: node.title,
        summary: node.summary,
        type: node.type,
        slug: node.slug,
        url,
      };
    });
  }

  return (
    <div className="page-container">
      <div className="content-section">
        <header className="page-header">
          <h1>Search Results</h1>
          {query && (
            <p className="search-query">
              {results.length > 0
                ? `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                : `No results found for "${query}"`}
            </p>
          )}
          {!query && (
            <p className="search-query">Please enter a search term</p>
          )}
        </header>

        {query && query.length < 2 && (
          <div className="search-notice">
            <p>Search term must be at least 2 characters long</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-results">
            {results.map((result) => (
              <article key={result.id} className="search-result-item">
                <h2>
                  <Link href={result.url}>{result.title}</Link>
                </h2>
                {result.summary && (
                  <p className="search-result-summary">{result.summary}</p>
                )}
                <div className="search-result-meta">
                  <span className="search-result-type">
                    {result.type === 'plots' ? 'Property' : result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </span>
                  <span className="search-result-url">{result.url}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
