import type { CSSProperties } from 'react';
import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [propertyCount, newsCount, mapsNode, recentNews, recentProperties] = await Promise.all([
    prisma.node.count({ where: { type: 'property' } }),
    prisma.node.count({ where: { type: 'news' } }),
    prisma.node.findFirst({ where: { slug: 'maps' }, select: { id: true, updatedAt: true } }),
    prisma.node.findMany({
      where: { type: 'news' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, updatedAt: true, published: true },
    }),
    prisma.node.findMany({
      where: { type: 'property' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, updatedAt: true, published: true },
    }),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Content Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <DashboardCard
            title="Properties"
            count={propertyCount}
            href="/admin/properties"
            description="Create, edit or remove property listings across Gurugram."
          />
          <DashboardCard
            title="News"
            count={newsCount}
            href="/admin/news"
            description="Publish the latest updates, policy changes and announcements."
          />
          <DashboardCard
            title="Maps Page"
            count={mapsNode ? 1 : 0}
            href="/admin/maps"
            description="Update download links or details on the Gurugram maps page."
          />
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div style={panelStyle}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Properties</h3>
          <ul style={listStyle}>
            {recentProperties.map((property) => (
              <li key={property.id} style={listItemStyle}>
                <div>
                  <strong>{property.title}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Updated {new Date(property.updatedAt).toLocaleString()} &middot;{' '}
                    {property.published ? 'Published' : 'Draft'}
                  </div>
                </div>
                <Link href={`/admin/properties/${property.id}`} style={inlineLinkStyle}>
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div style={panelStyle}>
          <h3 style={{ marginBottom: '1rem' }}>Recent News</h3>
          <ul style={listStyle}>
            {recentNews.map((news) => (
              <li key={news.id} style={listItemStyle}>
                <div>
                  <strong>{news.title}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Updated {new Date(news.updatedAt).toLocaleString()} &middot;{' '}
                    {news.published ? 'Published' : 'Draft'}
                  </div>
                </div>
                <Link href={`/admin/news/${news.id}`} style={inlineLinkStyle}>
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  count,
  description,
  href,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #cbd5f5',
        backgroundColor: '#fff',
        textDecoration: 'none',
        color: '#0f172a',
      }}
    >
      <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{title}</h3>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{count}</div>
      <p style={{ margin: 0, color: '#475569' }}>{description}</p>
    </Link>
  );
}

const panelStyle: CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #cbd5f5',
  borderRadius: '8px',
  padding: '1.5rem',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const listItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
};

const inlineLinkStyle: CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 600,
};
