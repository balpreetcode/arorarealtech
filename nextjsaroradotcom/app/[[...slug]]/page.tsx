import { resolveByPath } from '@/lib/resolve';
import type { ResolvedNode, ResolvedTerm } from '@/lib/resolve';
import { sanitizeHtml, stripHtmlTags } from '@/lib/html';
import prisma from '@/lib/db';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = resolvedParams.slug || [];
  const path = '/' + slug.join('/');

  // Handle homepage
  if (path === '/') {
    return <HomePage />;
  }

  const content = await resolveByPath(path, resolvedSearchParams);

  if (content.type === 'node') {
    return <NodePage content={content} path={path} />;
  } else if (content.type === 'term') {
    return <TermPage content={content} />;
  }

  return <div>Content not found</div>;
}

async function HomePage() {
  // Get recent published nodes
  const recentNodes = await prisma.node.findMany({
    where: {
      published: true,
      type: 'property',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
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

  // Get URL aliases for these nodes
  const nodeIds = recentNodes.map((n) => n.id);
  const aliases = await prisma.urlAlias.findMany({
    where: {
      targetId: { in: nodeIds },
      targetType: 'node',
    },
    select: {
      targetId: true,
      sourcePath: true,
    },
  });

  const aliasMap = new Map(aliases.map((a) => [a.targetId, a.sourcePath]));

  // Default placeholder images for properties
  const placeholderImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
  ];

  const newsNodes = await prisma.node.findMany({
    where: {
      published: true,
      type: 'news',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  const newsAliases = newsNodes.length
    ? await prisma.urlAlias.findMany({
        where: {
          targetId: { in: newsNodes.map((n) => n.id) },
          targetType: 'node',
        },
        select: {
          targetId: true,
          sourcePath: true,
        },
      })
    : [];

  const newsAliasMap = new Map(newsAliases.map((item) => [item.targetId, item.sourcePath]));

  const aboutParagraphs = [
    'Arora Realtech is a leading Real Estate Consultancy Organization in Gurugram, serving its clients for over two decades under the leadership of Dr. Arun Arora.',
    'We provide smarter, faster and reliable solutions for your property needs across residential, commercial, industrial and institutional segments.'
  ];

  const buyerMessage =
    'If you are a potential buyer then we support your efforts right from identification to acquisition of a specific property of your choice according to your budget and need.';

  const sellerMessage =
    'If you are a potential seller, we help you get the best price for your property and assure you of the transparency and safety of the deal.';

  const businessServices = [
    'Sale & Purchase of Plots – Residential, Commercial, Agricultural and Industrial',
    'Sale and Purchase of Apartments',
    'Renting – Residential, Commercial & Industrial',
    'Pre-rented Property – Investment & Ready Income',
    'Construction Services',
    'Interior Designing & Architectural Services',
    'Home Loans',
  ];

  return (
    <div className="home-wrapper">
      <section className="hero-banner legacy-hero">
        <div className="hero-image">
          <img src="/images/home/gurugram-hero.jpg" alt="Gurugram city skyline" />
        </div>
      </section>

      <section className="hero-cta-band">
        <div className="page-container hero-cta-inner">
          <p className="hero-band-text">
            Helping Buyers, Sellers &amp; Investors make a Right Decision when it comes to Properties in Gurugram
          </p>
          <a className="btn btn-light hero-band-btn" href="/about-us">
            Read more
          </a>
        </div>
      </section>

      <div className="home-content">
        <section className="about-highlight">
          <div className="about-highlight-image">
            <img src="/images/home/neon.jpg" alt="Modern kitchen interior" />
          </div>
          <div className="page-container about-highlight-body">
            <span className="about-eyebrow">About us</span>
            <h2 className="about-title">Who we are</h2>
            <p>{aboutParagraphs[0]}</p>
          </div>
        </section>
        <div className="page-container">

        <section className="home-section">
          <header className="section-header">
            <h2 className="hometitle">Recent Properties</h2>
          </header>

          <div className="card-grid">
            {recentNodes.map((node, index) => {
              const url = aliasMap.get(node.id) || `/${node.slug}`;
              const imageUrl = node.imageUrl || placeholderImages[index % placeholderImages.length];
              const formattedDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(node.createdAt);
              const propertyTerm = node.nodeTerms[0]?.term?.name ?? 'Property';
              const summary =
                node.summary && node.summary.length > 180 ? `${node.summary.slice(0, 180)}...` : node.summary;

              return (
                <article key={node.id} className="card">
                  <div className="card-img">
                    <img src={imageUrl} alt={node.title} />
                  </div>
                  <div className="card-body">
                    <strong className="card-date">{formattedDate}</strong>
                    <h3 className="card-title">
                      <a href={url}>{node.title}</a>
                    </h3>
                    {summary && <p className="card-text">{summary}</p>}
                    <div className="card-actions">
                      <a className="btn btn-sm btn-outline-primary" href={url}>
                        Read more
                      </a>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="card-tag">{propertyTerm}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {recentNodes.length === 0 && (
            <p className="empty-state">No properties available at the moment.</p>
          )}

          <div className="section-cta">
            <a className="btn btn-primary" href="/property">
              See more properties <span aria-hidden="true" className="arrow">›</span>
            </a>
          </div>
        </section>

        <section className="home-section">
          <header className="section-header">
            <h2 className="hometitle">News</h2>
          </header>

          <div className="card-grid">
            {newsNodes.map((newsItem, index) => {
              const url = newsAliasMap.get(newsItem.id) || `/${newsItem.slug}`;
              const imageUrl = newsItem.imageUrl || placeholderImages[(index + 1) % placeholderImages.length];
              const formattedDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(newsItem.createdAt);

              return (
                <article key={newsItem.id} className="card">
                  <div className="card-img">
                    <img src={imageUrl} alt={newsItem.title} />
                  </div>
                  <div className="card-body">
                    <strong className="card-date">{formattedDate}</strong>
                    <h3 className="card-title">
                      <a href={url}>{newsItem.title}</a>
                    </h3>
                    {newsItem.summary && (
                      <div
                        className="card-text"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(newsItem.summary) }}
                      />
                    )}
                    <div className="card-actions">
                      <a className="btn btn-sm btn-outline-primary" href={url}>
                        Read more
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {newsNodes.length === 0 && <p className="empty-state">News updates are coming soon.</p>}

          <div className="section-cta">
            <a className="btn btn-primary" href="/news">
              Read more News <span aria-hidden="true" className="arrow">›</span>
            </a>
          </div>
        </section>

        <section className="teaser-section">
          <div className="teaser">
            <div className="teaser-image">
              <img src="/images/home/documents.jpg" alt="Business documents on a desk" />
            </div>
            <div className="teaser-body">
              <span className="teaser-eyebrow">Our Business</span>
              <h2>Expertise in Gurugram Market</h2>
              <ul className="teaser-list">
                {businessServices.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              <a className="btn btn-primary" href="/about-us">Read more About us</a>
            </div>
          </div>
        </section>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <a href="/" aria-label="Arora Real Tech home">
              <img src="/logo.svg" alt="Arora Real Tech logo" />
            </a>
          </div>
          <div className="footer-links">
            <h3>Need to get in touch?</h3>
            <ul>
              <li>
                <a href="https://www.facebook.com/Arora-Realtech-165127780320836/" target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/arun-arora-6baaa224/" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:info@arorarealtech.com">info@arorarealtech.com</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Arora Real Tech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function NodePage({ content, path }: { content: ResolvedNode; path: string }) {
  const { node, terms } = content;

  if (node.type === 'property') {
    return <PropertyDetailPage node={node} terms={terms} path={path} />;
  }

  return <DefaultNodePage node={node} terms={terms} path={path} />;
}

function TermPage({ content }: { content: ResolvedTerm }) {
  const { term, nodes, page, totalPages } = content;

  return (
    <div>
      <header>
        <h1>{term.name}</h1>
        {term.descriptionHtml && (
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(term.descriptionHtml) }}
          />
        )}
      </header>

      <div className="node-list">
        {nodes.map((node) => (
          <article key={node.id}>
            <h2>
              <a href={`/${node.slug}`}>{node.title}</a>
            </h2>
            {node.imageUrl && (
              <img src={node.imageUrl} alt={node.title} style={{ maxWidth: '200px' }} />
            )}
            {node.summary && <p>{node.summary}</p>}
            <time dateTime={node.createdAt.toISOString()}>
              {new Date(node.createdAt).toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="pagination">
          {page > 0 && (
            <a href={`/${term.slug}?page=${page - 1}`}>Previous</a>
          )}
          <span>
            Page {page + 1} of {totalPages}
          </span>
          {page < totalPages - 1 && (
            <a href={`/${term.slug}?page=${page + 1}`}>Next</a>
          )}
        </nav>
      )}
    </div>
  );
}

function DefaultNodePage({
  node,
  terms,
  path,
}: {
  node: ResolvedNode['node'];
  terms: ResolvedNode['terms'];
  path: string;
}) {
  if (node.type === 'page' || node.type === 'homepage') {
    return <StaticPage node={node} path={path} />;
  }

  return (
    <article className="default-node">
      <header className="default-node-header">
        <h1>{node.title}</h1>
        <div className="default-node-meta">
          {node.author && <span>By {node.author}</span>}
          {node.createdAt && (
            <time dateTime={node.createdAt.toISOString()}>
              {new Intl.DateTimeFormat('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(node.createdAt)}
            </time>
          )}
        </div>
      </header>

      {node.imageUrl && (
        <figure className="default-node-figure">
          <img src={node.imageUrl} alt={node.title} />
        </figure>
      )}

      {node.summary && (
        <p className="default-node-summary">{node.summary}</p>
      )}

      {node.bodyHtml && (
        <div
          className="default-node-body"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(node.bodyHtml) }}
        />
      )}

      {terms.length > 0 && (
        <footer className="default-node-tags">
          <h2>Tags</h2>
          <ul>
            {terms.map((term) => (
              <li key={term.id}>{term.name}</li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}

function StaticPage({ node, path }: { node: ResolvedNode['node']; path: string }) {
  const isAbout = path === '/about-us' || node.slug === 'about-us';
  const isContact = path === '/contact-us' || node.slug === 'contact-us';

  const heroOverrides: Record<string, string> = {
    'about-us': '/sites/default/files/2019-10/chutter.jpg',
    'contact-us': '/sites/default/files/2019-10/neon.jpg',
  };

  const fallbackHero = '/images/home/gurugram-hero.jpg';
  const heroImage = heroOverrides[node.slug] || node.imageUrl || fallbackHero;
  const heroUrl = toMediaUrl(heroImage);

  const summaryText = node.summary ? stripHtmlTags(node.summary).replace(/\s+/g, ' ').trim() : '';
  const aboutHeroSubtitle =
    'We are next generation Real Estate Consultancy Organization, with more than two decades of expertise and experience in serving our clients in Buying & Selling of Properties in Gurugram. We promise to assist you in getting the Best Deal. Call us Now.';
  const heroSubtitle = isAbout
    ? aboutHeroSubtitle
    : isContact
    ? 'Reach out to us'
    : summaryText;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: node.title },
  ];

  return (
    <div className="page-shell">
      <section className="banner banner-slim">
        <div className="banner-img">
          <img src={heroUrl} alt={node.title} />
        </div>
        <div className="banner-overlay banner-overlay-opaque">
          <div className="page-container">
            <h1>{node.title}</h1>
            {heroSubtitle && <p className="body-m">{heroSubtitle}</p>}
            {isAbout && (
              <a className="btn btn-light" href="/property">
                View Exclusive Listed Properties
              </a>
            )}
          </div>
        </div>
      </section>

      <nav className="breadcrumb-wrapper" aria-label="You are here">
        <div className="page-container">
          <ol className="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label} className={index === breadcrumbs.length - 1 ? 'active' : ''}>
                {crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span>{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <div className="page-container content-shell">
        <div className="content-narrow">
          {node.bodyHtml && (
            <div
              className="rich-body"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(node.bodyHtml) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyDetailPage({
  node,
  terms,
  path,
}: {
  node: ResolvedNode['node'];
  terms: ResolvedNode['terms'];
  path: string;
}) {
  const primaryTerm =
    terms.find((term) => term.vocabulary === 'property') ?? terms[0] ?? null;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(primaryTerm
      ? [{ label: primaryTerm.name, href: `/${primaryTerm.slug}` }]
      : []),
    { label: node.title },
  ];

  const heroImage =
    node.imageUrl ||
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80';

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(node.createdAt);

  const location = inferLocation(node, path);
  const listingId = node.nid ? `#${node.nid}` : node.slug;
  const contactPhoneDisplay = '+91 98115 86101';
  const contactPhoneLink = 'tel:+919811586101';
  const whatsappHref = `https://wa.me/919811586101?text=${encodeURIComponent(
    `I am inquiring about the property listing "${node.title}"`
  )}`;
  const emailHref = `mailto:info@arorarealtech.com?subject=${encodeURIComponent(
    `Property enquiry: ${node.title}`
  )}`;

  return (
    <div className="property-detail-wrapper">
      <section
        className="property-hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="property-hero-overlay">
          {primaryTerm && <span className="property-hero-pill">{primaryTerm.name}</span>}
          <h1>{node.title}</h1>
          <div className="property-hero-meta">
            <span>Listed on {formattedDate}</span>
            <span>Listing ID {listingId}</span>
          </div>
        </div>
      </section>

      <nav className="property-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          {breadcrumbs.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="property-detail-grid">
        <div className="property-detail-main">
          {node.imageUrl && (
            <figure className="property-detail-figure">
              <img src={node.imageUrl} alt={node.title} />
            </figure>
          )}

          {node.summary && (
            <p className="property-detail-summary">{node.summary}</p>
          )}

          {node.bodyHtml && (
            <div
              className="property-detail-body"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(node.bodyHtml) }}
            />
          )}
        </div>

        <aside className="property-detail-sidebar">
          <div className="property-info-card">
            <h2>Property Details</h2>
            <ul>
              <li>
                <span className="label">Location</span>
                <span>{location}</span>
              </li>
              <li>
                <span className="label">Type</span>
                <span>{primaryTerm ? primaryTerm.name : 'Property'}</span>
              </li>
              <li>
                <span className="label">Listing ID</span>
                <span>{listingId}</span>
              </li>
              <li>
                <span className="label">Published</span>
                <span>{formattedDate}</span>
              </li>
            </ul>
          </div>

          <div className="property-contact-card">
            <h2>Contact the Dealer</h2>
            <img
              src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80"
              alt="Arun Arora"
            />
            <p className="property-contact-name">Arun Arora</p>
            <a className="property-contact-phone" href={contactPhoneLink}>
              Call {contactPhoneDisplay}
            </a>
            <a
              className="property-contact-action whatsapp"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
            <a className="property-contact-action" href={emailHref}>
              Email the Dealer
            </a>
          </div>

          {terms.length > 0 && (
            <div className="property-tags-card">
              <h3>Property Tags</h3>
              <ul>
                {terms.map((term) => (
                  <li key={term.id}>{term.name}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function toMediaUrl(url: string | null): string {
  if (!url) {
    return '/images/home/gurugram-hero.jpg';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${normalized}`;
}

function inferLocation(node: ResolvedNode['node'], path: string) {
  const candidates = [
    node.title,
    node.summary ?? '',
    node.metaDescription ?? '',
    path.replace(/[-_/]+/g, ' '),
  ];

  for (const text of candidates) {
    const match = text.match(/\bin\s+([A-Za-z\s]+?)(?:\(|,|\.|$)/i);
    if (match) {
      return match[1].split('(')[0].trim();
    }
  }

  return 'Gurugram';
}
