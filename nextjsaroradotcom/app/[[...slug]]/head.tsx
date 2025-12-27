import { resolveByPath } from '@/lib/resolve';
import { buildSEOMetadata } from '@/lib/seo';

interface HeadProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Head({ params, searchParams }: HeadProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = resolvedParams.slug || [];
  const path = '/' + slug.join('/');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://api31.winds-os.com';

  try {
    const content = await resolveByPath(path, resolvedSearchParams);

    if (content.type === 'static') {
      return (
        <>
          <title>Page</title>
          <meta name="description" content="Page content" />
        </>
      );
    }

    const seo = buildSEOMetadata(content, baseUrl);

    return (
      <>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />

        {seo.robots && <meta name="robots" content={seo.robots} />}

        {/* Open Graph */}
        <meta property="og:title" content={seo.openGraph.title} />
        <meta property="og:description" content={seo.openGraph.description} />
        <meta property="og:type" content={seo.openGraph.type} />
        {seo.openGraph.image && <meta property="og:image" content={seo.openGraph.image} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content={seo.twitter.card} />
        <meta name="twitter:title" content={seo.twitter.title} />
        <meta name="twitter:description" content={seo.twitter.description} />
        {seo.twitter.image && <meta name="twitter:image" content={seo.twitter.image} />}

        {/* Hreflang */}
        {seo.hreflangLinks?.map((link) => (
          <link
            key={link.lang}
            rel="alternate"
            hrefLang={link.lang}
            href={link.url}
          />
        ))}

        {/* JSON-LD */}
        {seo.jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(seo.jsonLd),
            }}
          />
        )}
      </>
    );
  } catch (error) {
    return (
      <>
        <title>Page Not Found</title>
        <meta name="robots" content="noindex, nofollow" />
      </>
    );
  }
}
