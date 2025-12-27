import type { ResolvedNode, ResolvedTerm } from './resolve';

export interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  hreflangLinks?: Array<{ lang: string; url: string }>;
  openGraph: {
    title: string;
    description: string;
    image?: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image?: string;
  };
  jsonLd?: object;
}

export function buildSEOMetadata(
  content: ResolvedNode | ResolvedTerm,
  baseUrl: string
): SEOMetadata {
  if (content.type === 'node') {
    return buildNodeSEO(content, baseUrl);
  } else {
    return buildTermSEO(content, baseUrl);
  }
}

function buildNodeSEO(content: ResolvedNode, baseUrl: string): SEOMetadata {
  const { node } = content;

  const title = node.metaTitle || node.title;
  const description = node.metaDescription || node.summary || '';
  const canonical = node.canonicalPath
    ? `${baseUrl}${node.canonicalPath}`
    : `${baseUrl}/${node.slug}`;

  // Parse hreflang links
  let hreflangLinks: Array<{ lang: string; url: string }> = [];
  if (node.hreflangLinks) {
    try {
      hreflangLinks = JSON.parse(node.hreflangLinks);
    } catch (e) {
      console.error('Failed to parse hreflang links:', e);
    }
  }

  // Parse JSON-LD
  let jsonLd: object | undefined;
  if (node.jsonLd) {
    try {
      jsonLd = JSON.parse(node.jsonLd);
    } catch (e) {
      // Generate default Article schema
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: node.title,
        description: node.summary || '',
        datePublished: node.createdAt.toISOString(),
        dateModified: node.updatedAt.toISOString(),
        author: node.author ? {
          '@type': 'Person',
          name: node.author,
        } : undefined,
        image: node.imageUrl || undefined,
      };
    }
  }

  return {
    title,
    description,
    canonical,
    robots: node.robots || undefined,
    hreflangLinks: hreflangLinks.length > 0 ? hreflangLinks : undefined,
    openGraph: {
      title: node.ogTitle || title,
      description: node.ogDescription || description,
      image: node.ogImage || node.imageUrl || undefined,
      type: 'article',
    },
    twitter: {
      card: node.twitterCard || 'summary_large_image',
      title: node.ogTitle || title,
      description: node.ogDescription || description,
      image: node.ogImage || node.imageUrl || undefined,
    },
    jsonLd,
  };
}

function buildTermSEO(content: ResolvedTerm, baseUrl: string): SEOMetadata {
  const { term, page, totalPages } = content;

  const title = term.metaTitle || `${term.name} - ${term.vocabulary}`;
  const description = term.metaDescription || term.descriptionHtml || '';
  const canonical = page === 0
    ? `${baseUrl}/${term.slug}`
    : `${baseUrl}/${term.slug}?page=${page}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: term.name,
    description: description,
  };

  return {
    title,
    description,
    canonical,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    jsonLd,
  };
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
