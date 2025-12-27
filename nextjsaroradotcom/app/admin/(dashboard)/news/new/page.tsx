import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNode } from '@/lib/admin-nodes';
import { NewsForm } from '../NewsForm';
import { isRedirectError } from '@/lib/next-utils';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function createNews(formData: FormData) {
  'use server';

  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const bodyHtml = String(formData.get('bodyHtml') || '');
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const author = String(formData.get('author') || '').trim();
  const published = formData.get('published') !== 'draft';

  if (!title) {
    redirect('/admin/news/new?error=Title%20is%20required');
  }

  try {
    const node = await createNode({
      type: 'news',
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
    revalidatePath(`/${node.slug}`);

    redirect(`/admin/news/${node.id}?created=1`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Failed to create news article:', error);
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : 'Unexpected%20error';
    redirect(`/admin/news/new?error=${message}`);
  }
}

export default async function NewNewsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const errorMessage =
    typeof resolvedParams.error === 'string'
      ? decodeURIComponent(resolvedParams.error)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h2 style={{ marginBottom: '0.5rem' }}>Add News Article</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Share announcements, updates or policy changes relevant to Arora Real Tech clients.
        </p>
      </header>

      <NewsForm
        action={createNews}
        submitLabel="Create news article"
        cancelHref="/admin/news"
        errorMessage={errorMessage}
      />
    </div>
  );
}
