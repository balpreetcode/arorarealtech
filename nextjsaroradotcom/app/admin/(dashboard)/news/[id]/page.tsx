import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { updateNode } from '@/lib/admin-nodes';
import { NewsForm } from '../NewsForm';
import { isRedirectError } from '@/lib/next-utils';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function updateNews(formData: FormData) {
  'use server';

  const nodeId = Number(formData.get('nodeId'));
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const bodyHtml = String(formData.get('bodyHtml') || '');
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const author = String(formData.get('author') || '').trim();
  const published = formData.get('published') !== 'draft';

  if (!Number.isFinite(nodeId) || nodeId <= 0) {
    redirect('/admin/news');
  }

  if (!title) {
    redirect(`/admin/news/${nodeId}?error=Title%20is%20required`);
  }

  try {
    await updateNode(nodeId, {
      title,
      slug: slug || undefined,
      summary: summary || null,
      bodyHtml: bodyHtml || null,
      imageUrl: imageUrl || null,
      author: author || null,
      published,
    });

    revalidatePath('/');
    revalidatePath('/news');
    if (slug) {
      revalidatePath(`/${slug}`);
    }

    redirect(`/admin/news/${nodeId}?saved=1`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Failed to update news article:', error);
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : 'Unexpected%20error';
    redirect(`/admin/news/${nodeId}?error=${message}`);
  }
}

export default async function EditNewsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const nodeId = Number(id);

  if (!Number.isFinite(nodeId)) {
    notFound();
  }

  const article = await prisma.node.findUnique({
    where: { id: nodeId },
  });

  if (!article || article.type !== 'news') {
    notFound();
  }

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
        <h2 style={{ marginBottom: '0.5rem' }}>Edit News Article</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Keep your news content accurate and up-to-date for site visitors.
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
          {created ? 'News article created successfully.' : 'Changes saved.'}
        </div>
      )}

      <NewsForm
        action={updateNews}
        initialValues={{
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          bodyHtml: article.bodyHtml,
          imageUrl: article.imageUrl,
          author: article.author,
          published: article.published,
        }}
        submitLabel="Save changes"
        cancelHref="/admin/news"
        errorMessage={errorMessage}
      >
        <input type="hidden" name="nodeId" value={article.id} />
      </NewsForm>
    </div>
  );
}
