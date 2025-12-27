import type { CSSProperties } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { createNode, updateNode } from '@/lib/admin-nodes';
import { isRedirectError } from '@/lib/next-utils';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function saveMapsPage(formData: FormData) {
  'use server';

  const nodeId = Number(formData.get('nodeId'));
  const title = String(formData.get('title') || '').trim() || 'Gurugram Maps';
  const slug = String(formData.get('slug') || '').trim() || 'maps';
  const summary = String(formData.get('summary') || '').trim();
  const bodyHtml = String(formData.get('bodyHtml') || '');
  const published = formData.get('published') !== 'draft';

  try {
    if (Number.isFinite(nodeId) && nodeId > 0) {
      await updateNode(nodeId, {
        title,
        slug,
        summary: summary || null,
        bodyHtml: bodyHtml || null,
        published,
      });
      revalidatePath('/');
      revalidatePath('/maps');
      redirect('/admin/maps?saved=1');
    } else {
      await createNode({
        type: 'page',
        title,
        slug,
        summary: summary || null,
        bodyHtml: bodyHtml || null,
        published,
      });
      revalidatePath('/');
      revalidatePath('/maps');
      redirect('/admin/maps?created=1');
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Failed to save maps page:', error);
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : 'Unexpected%20error';
    redirect(`/admin/maps?error=${message}`);
  }
}

export default async function MapsAdminPage({ searchParams }: PageProps) {
  const mapsNode = await prisma.node.findFirst({
    where: { slug: 'maps' },
  });

  const resolvedParams = await searchParams;
  const saved = resolvedParams.saved === '1';
  const created = resolvedParams.created === '1';
  const errorMessage =
    typeof resolvedParams.error === 'string'
      ? decodeURIComponent(resolvedParams.error)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h2 style={{ marginBottom: '0.5rem' }}>Manage Maps Page</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Update the downloadable maps list and supporting text shown on <strong>/maps</strong>.
          Use plain HTML to add or reorder map links.
        </p>
      </header>

      {(saved || created) && (
        <div
          style={{
            border: '1px solid #bbf7d0',
            backgroundColor: '#ecfdf5',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
          }}
        >
          {created ? 'Maps page created successfully.' : 'Maps page updated.'}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#b3261e',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            border: '1px solid #fca5a5',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form action={saveMapsPage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff', border: '1px solid #cbd5f5', borderRadius: '8px', padding: '1.5rem' }}>
        {mapsNode && <input type="hidden" name="nodeId" value={mapsNode.id} />}
        <label style={labelStyle}>
          Title
          <input
            type="text"
            name="title"
            defaultValue={mapsNode?.title || 'Gurugram Maps'}
            required
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Slug
          <input
            type="text"
            name="slug"
            defaultValue={mapsNode?.slug || 'maps'}
            required
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Summary
          <textarea
            name="summary"
            defaultValue={mapsNode?.summary || ''}
            rows={3}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          Page HTML
          <textarea
            name="bodyHtml"
            defaultValue={mapsNode?.bodyHtml || ''}
            rows={18}
            style={textareaStyle}
          />
          <span style={helperTextStyle}>
            Paste HTML that lists each downloadable map. Links should point to files under
            <code style={{ backgroundColor: '#e2e8f0', padding: '0 0.25rem', marginLeft: '0.25rem' }}>
              /sites/default/files/…
            </code>
            . The front-end rewrites them to the correct host automatically.
          </span>
        </label>

        <label style={labelStyle}>
          Status
          <select
            name="published"
            defaultValue={mapsNode?.published === false ? 'draft' : 'published'}
            style={inputStyle}
          >
            <option value="published">Published (visible)</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" style={primaryButtonStyle}>
            {mapsNode ? 'Save changes' : 'Create Maps page'}
          </button>
          <a href="/admin" style={secondaryButtonStyle}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  fontWeight: 600,
  color: '#0f172a',
};

const inputStyle: CSSProperties = {
  padding: '0.65rem',
  borderRadius: '4px',
  border: '1px solid #cbd5f5',
  fontWeight: 500,
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '160px',
  fontFamily: 'monospace',
};

const helperTextStyle: CSSProperties = {
  fontWeight: 400,
  fontSize: '0.85rem',
  color: '#475569',
};

const primaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#0f172a',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#e2e8f0',
  color: '#0f172a',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 600,
};
