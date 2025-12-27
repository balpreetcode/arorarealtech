import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { createNode } from '@/lib/admin-nodes';
import { PropertyForm } from '../PropertyForm';
import { isRedirectError } from '@/lib/next-utils';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function createProperty(formData: FormData) {
  'use server';

  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const bodyHtml = String(formData.get('bodyHtml') || '');
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const published = formData.get('published') !== 'draft';
  const termIds = formData.getAll('termIds').map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0) as number[];

  if (!title) {
    redirect('/admin/properties/new?error=Title%20is%20required');
  }

  try {
    const node = await createNode({
      type: 'property',
      title,
      slug: slug || undefined,
      summary: summary || null,
      bodyHtml: bodyHtml || null,
      imageUrl: imageUrl || null,
      published,
      termIds,
    });

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath('/property');
    revalidatePath(`/${node.slug}`);

    redirect(`/admin/properties/${node.id}?created=1`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Failed to create property:', error);
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : 'Unexpected%20error';
    redirect(`/admin/properties/new?error=${message}`);
  }
}

export default async function NewPropertyPage({ searchParams }: PageProps) {
  const terms = await prisma.taxonomyTerm.findMany({
    where: { vocabulary: 'property' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  const resolvedParams = await searchParams;
  const errorMessage = typeof resolvedParams.error === 'string' ? decodeURIComponent(resolvedParams.error) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h2 style={{ marginBottom: '0.5rem' }}>Add Property</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Provide the property details exactly as you’d like them to appear on the site.
        </p>
      </header>

      <PropertyForm
        action={createProperty}
        submitLabel="Create property"
        cancelHref="/admin/properties"
        terms={terms}
        errorMessage={errorMessage}
      />
    </div>
  );
}
