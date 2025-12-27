import type { CSSProperties } from 'react';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { createNode, updateNode } from '@/lib/admin-nodes';
import { isRedirectError } from '@/lib/next-utils';

const SUPPORTED_PAGES: Record<string, string> = {
  'about-us': 'About Us',
  'contact-us': 'Contact Us',
  'list-of-useful-websites': 'Useful Websites',
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function saveStaticPage(formData: FormData) {
  'use server';

  const nodeId = Number(formData.get('nodeId'));
  const slug = String(formData.get('slug') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const bodyHtml = String(formData.get('bodyHtml') || '');
  const published = formData.get('published') !== 'draft';

  if (!slug || !SUPPORTED_PAGES[slug]) {
    redirect('/admin');
  }

  if (!title) {
    redirect(`/admin/pages/${slug}?error=Title%20is%20required`);
  }

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
      revalidatePath(`/${slug}`);
      redirect(`/admin/pages/${slug}?saved=1`);
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
      revalidatePath(`/${slug}`);
      redirect(`/admin/pages/${slug}?created=1`);
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Failed to save static page:', error);
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : 'Unexpected%20error';
    redirect(`/admin/pages/${slug}?error=${message}`);
  }
}

export default async function StaticPageEditor({ params, searchParams }: PageProps) {
  const { slug } = await params;

  if (!SUPPORTED_PAGES[slug]) {
    notFound();
  }

  const pageNode = await prisma.node.findFirst({
    where: {
      slug,
      type: 'page',
    },
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
        <h2 style={{ marginBottom: '0.5rem' }}>Edit {SUPPORTED_PAGES[slug]}</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Adjust the rich content shown on the <strong>/{slug}</strong> page.
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
          {created ? 'Page created successfully.' : 'Changes saved.'}
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

      <form action={saveStaticPage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff', border: '1px solid #cbd5f5', borderRadius: '8px', padding: '1.5rem' }}>
        {pageNode && <input type="hidden" name="nodeId" value={pageNode.id} />}
        <input type="hidden" name="slug" value={slug} />

        <label style={labelStyle}>
          Title
          <input
            type="text"
            name="title"
            defaultValue={pageNode?.title || SUPPORTED_PAGES[slug]}
            required
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Summary
          <textarea
            name="summary"
            defaultValue={pageNode?.summary || ''}
            rows={3}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          Page HTML
          <textarea
            name="bodyHtml"
            defaultValue={pageNode?.bodyHtml || ''}
            rows={18}
            style={textareaStyle}
          />
          <span style={helperTextStyle}>
            Use HTML markup to structure the content. Links and media embedded with Drupal URLs are automatically rewritten.
          </span>
        </label>

        <label style={labelStyle}>
          Status
          <select
            name="published"
            defaultValue={pageNode?.published === false ? 'draft' : 'published'}
            style={inputStyle}
          >
            <option value="published">Published (visible)</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" style={primaryButtonStyle}>
            {pageNode ? 'Save changes' : 'Create page'}
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
