import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { updateNode } from '@/lib/admin-nodes';
import { PropertyForm } from '../PropertyForm';
import { isRedirectError } from '@/lib/next-utils';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function updateProperty(formData: FormData) {
  'use server';

  const nodeId = Number(formData.get('nodeId'));
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const summary = String(formData.get('summary') || '').trim();
  const bodyHtml = String(formData.get('bodyHtml') || '');
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const published = formData.get('published') !== 'draft';
  const termIds = formData
    .getAll('termIds')
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0) as number[];

  if (!Number.isFinite(nodeId) || nodeId <= 0) {
    redirect('/admin/properties');
  }

  if (!title) {
    redirect(`/admin/properties/${nodeId}?error=Title%20is%20required`);
  }

  try {
    await updateNode(nodeId, {
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
    if (slug) {
      revalidatePath(`/${slug}`);
    }

    redirect(`/admin/properties/${nodeId}?saved=1`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Failed to update property:', error);
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : 'Unexpected%20error';
    redirect(`/admin/properties/${nodeId}?error=${message}`);
  }
}

export default async function EditPropertyPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const nodeId = Number(id);

  if (!Number.isFinite(nodeId)) {
    notFound();
  }

  const [property, terms] = await Promise.all([
    prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        nodeTerms: {
          include: {
            term: true,
          },
        },
      },
    }),
    prisma.taxonomyTerm.findMany({
      where: { vocabulary: 'property' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!property || property.type !== 'property') {
    notFound();
  }

  const selectedTermIds = property.nodeTerms.map((item) => item.termId);
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
        <h2 style={{ marginBottom: '0.5rem' }}>Edit Property</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Update the property content and metadata. Changes go live as soon as you save.
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
          {created ? 'Property created successfully.' : 'Changes saved.'}
        </div>
      )}

      <PropertyForm
        action={updateProperty}
        initialValues={{
          title: property.title,
          slug: property.slug,
          summary: property.summary,
          bodyHtml: property.bodyHtml,
          imageUrl: property.imageUrl,
          published: property.published,
          termIds: selectedTermIds,
        }}
        terms={terms}
        submitLabel="Save changes"
        cancelHref="/admin/properties"
        errorMessage={errorMessage}
      >
        <input type="hidden" name="nodeId" value={property.id} />
      </PropertyForm>
    </div>
  );
}
