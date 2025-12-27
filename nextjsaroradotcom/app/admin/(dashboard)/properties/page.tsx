import type { CSSProperties } from 'react';
import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { deleteNode } from '@/lib/admin-nodes';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function deleteProperty(formData: FormData) {
  'use server';

  const nodeId = Number(formData.get('nodeId'));
  const returnTo = String(formData.get('returnTo') || '/admin/properties');

  if (!Number.isFinite(nodeId) || nodeId <= 0) {
    redirect(returnTo);
  }

  await deleteNode(nodeId);
  revalidatePath('/');
  revalidatePath('/properties');
  revalidatePath('/property');
  revalidatePath(returnTo);

  redirect(returnTo);
}

export default async function PropertiesAdminPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const searchTerm = typeof resolvedParams.search === 'string' ? resolvedParams.search.trim() : '';
  const pageParam = typeof resolvedParams.page === 'string' ? Number.parseInt(resolvedParams.page, 10) : 1;
  const publishedFilter = typeof resolvedParams.published === 'string' ? resolvedParams.published : 'all';

  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const whereClause: Prisma.NodeWhereInput = {
    type: 'property',
    ...(searchTerm
      ? {
          title: {
            contains: searchTerm,
          },
        }
      : {}),
    ...(publishedFilter === 'published'
      ? { published: true }
      : publishedFilter === 'draft'
      ? { published: false }
      : {}),
  };

  const [totalCount, properties] = await Promise.all([
    prisma.node.count({ where: whereClause }),
    prisma.node.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const query = new URLSearchParams();
  if (searchTerm) query.set('search', searchTerm);
  if (publishedFilter !== 'all') query.set('published', publishedFilter);

  const returnTo = `/admin/properties${query.toString() ? `?${query}` : ''}${currentPage > 1 ? (query.toString() ? '&' : '?') + `page=${currentPage}` : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Manage Properties</h2>
          <p style={{ margin: 0, color: '#475569' }}>Create, update, or remove property listings.</p>
        </div>
        <Link
          href="/admin/properties/new"
          style={{
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '0.65rem 1rem',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Add property
        </Link>
      </header>

      <form
        method="get"
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #cbd5f5',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.35rem', fontWeight: 600 }}>
          Search
          <input
            type="text"
            name="search"
            defaultValue={searchTerm}
            placeholder="Search by title..."
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5f5' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: 600 }}>
          Status
          <select
            name="published"
            defaultValue={publishedFilter}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5f5', minWidth: '160px' }}
          >
            <option value="all">All</option>
            <option value="published">Published only</option>
            <option value="draft">Draft only</option>
          </select>
        </label>
        <button
          type="submit"
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </form>

      <section>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ backgroundColor: '#e2e8f0', textAlign: 'left' }}>
            <tr>
              <th style={tableHeaderStyle}>Title</th>
              <th style={tableHeaderStyle}>Slug</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Updated</th>
              <th style={tableHeaderStyle}>Created</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={tableCellStyle}>
                  <div style={{ fontWeight: 600 }}>{property.title}</div>
                </td>
                <td style={tableCellStyle}>/{property.slug}</td>
                <td style={tableCellStyle}>{property.published ? 'Published' : 'Draft'}</td>
                <td style={tableCellStyle}>{new Date(property.updatedAt).toLocaleString()}</td>
                <td style={tableCellStyle}>{new Date(property.createdAt).toLocaleDateString()}</td>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/admin/properties/${property.id}`} style={actionLink}>
                      Edit
                    </Link>
                    <form action={deleteProperty}>
                      <input type="hidden" name="nodeId" value={property.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" style={deleteButtonStyle}>
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td style={{ padding: '1rem', textAlign: 'center' }} colSpan={6}>
                  No properties found. Adjust your filters or add a new property.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseQuery={Object.fromEntries(query)}
      />
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  baseQuery,
}: {
  currentPage: number;
  totalPages: number;
  baseQuery: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const prevQuery = new URLSearchParams(baseQuery);
  const nextQuery = new URLSearchParams(baseQuery);
  prevQuery.set('page', String(Math.max(1, currentPage - 1)));
  nextQuery.set('page', String(Math.min(totalPages, currentPage + 1)));

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
      <Link
        href={`/admin/properties?${prevQuery.toString()}`}
        style={{ ...actionLink, pointerEvents: currentPage === 1 ? 'none' : 'auto', opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        Previous
      </Link>
      <div style={{ alignSelf: 'center', fontWeight: 600 }}>
        Page {currentPage} of {totalPages}
      </div>
      <Link
        href={`/admin/properties?${nextQuery.toString()}`}
        style={{ ...actionLink, pointerEvents: currentPage === totalPages ? 'none' : 'auto', opacity: currentPage === totalPages ? 0.5 : 1 }}
      >
        Next
      </Link>
    </div>
  );
}

const tableHeaderStyle: CSSProperties = {
  padding: '0.75rem',
  fontWeight: 700,
  fontSize: '0.95rem',
};

const tableCellStyle: CSSProperties = {
  padding: '0.75rem',
  verticalAlign: 'top',
};

const actionLink: CSSProperties = {
  display: 'inline-block',
  padding: '0.4rem 0.75rem',
  backgroundColor: '#2563eb',
  color: '#fff',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 600,
};

const deleteButtonStyle: CSSProperties = {
  padding: '0.4rem 0.75rem',
  backgroundColor: '#b3261e',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
};
