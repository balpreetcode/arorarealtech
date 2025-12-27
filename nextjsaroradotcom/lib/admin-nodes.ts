import type { Prisma } from '@prisma/client';
import prisma from './db';

type NodeType = 'property' | 'news' | 'page';

export interface BaseNodeInput {
  title: string;
  slug?: string;
  summary?: string | null;
  bodyHtml?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalPath?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  robots?: string | null;
  published: boolean;
}

export interface CreateNodeInput extends BaseNodeInput {
  type: NodeType;
  termIds?: number[];
}

export interface UpdateNodeInput extends Partial<BaseNodeInput> {
  termIds?: number[];
}

export async function createNode(input: CreateNodeInput) {
  const slug = normalizeSlug(input.slug || input.title);
  const sourcePath = normalizePath(slug);

  return prisma.$transaction(async (tx) => {
    await assertAliasAvailable(tx, sourcePath);

    const nextNid = await getNextNid(tx);

    const node = await tx.node.create({
      data: {
        nid: nextNid,
        type: input.type,
        title: input.title.trim(),
        slug,
        summary: nullable(input.summary),
        bodyHtml: nullable(input.bodyHtml),
        imageUrl: nullable(input.imageUrl),
        author: nullable(input.author),
        metaTitle: nullable(input.metaTitle),
        metaDescription: nullable(input.metaDescription),
        canonicalPath: nullable(input.canonicalPath),
        ogTitle: nullable(input.ogTitle),
        ogDescription: nullable(input.ogDescription),
        ogImage: nullable(input.ogImage),
        robots: nullable(input.robots),
        published: input.published,
      },
    });

    await tx.urlAlias.create({
      data: {
        sourcePath,
        targetType: 'node',
        targetId: node.id,
        status: 200,
        langcode: 'en',
      },
    });

    if (input.termIds && input.termIds.length > 0) {
      await tx.nodeTerm.createMany({
        data: input.termIds.map((termId) => ({
          nodeId: node.id,
          termId,
        })),
      });
    }

    return node;
  });
}

export async function updateNode(nodeId: number, input: UpdateNodeInput) {
  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.summary !== undefined) updates.summary = nullable(input.summary);
  if (input.bodyHtml !== undefined) updates.bodyHtml = nullable(input.bodyHtml);
  if (input.imageUrl !== undefined) updates.imageUrl = nullable(input.imageUrl);
  if (input.author !== undefined) updates.author = nullable(input.author);
  if (input.metaTitle !== undefined) updates.metaTitle = nullable(input.metaTitle);
  if (input.metaDescription !== undefined) updates.metaDescription = nullable(input.metaDescription);
  if (input.canonicalPath !== undefined) updates.canonicalPath = nullable(input.canonicalPath);
  if (input.ogTitle !== undefined) updates.ogTitle = nullable(input.ogTitle);
  if (input.ogDescription !== undefined) updates.ogDescription = nullable(input.ogDescription);
  if (input.ogImage !== undefined) updates.ogImage = nullable(input.ogImage);
  if (input.robots !== undefined) updates.robots = nullable(input.robots);
  if (input.published !== undefined) updates.published = input.published;

  const normalizedSlug = input.slug !== undefined ? normalizeSlug(input.slug) : undefined;
  if (normalizedSlug !== undefined) {
    updates.slug = normalizedSlug;
  }

  return prisma.$transaction(async (tx) => {
    if (normalizedSlug !== undefined) {
      const sourcePath = normalizePath(normalizedSlug);
      await assertAliasAvailable(tx, sourcePath, nodeId);
      await tx.urlAlias.deleteMany({
        where: {
          targetType: 'node',
          targetId: nodeId,
        },
      });
      await tx.urlAlias.create({
        data: {
          sourcePath,
          targetType: 'node',
          targetId: nodeId,
          status: 200,
          langcode: 'en',
        },
      });
    }

    const node = await tx.node.update({
      where: { id: nodeId },
      data: updates,
    });

    if (input.slug !== undefined && !updates.slug) {
      const normalized = normalizeSlug(input.slug);
      const sourcePath = normalizePath(normalized);

      await tx.urlAlias.deleteMany({
        where: {
          targetType: 'node',
          targetId: nodeId,
        },
      });

      await tx.urlAlias.create({
        data: {
          sourcePath,
          targetType: 'node',
          targetId: nodeId,
          status: 200,
          langcode: 'en',
        },
      });

      await tx.node.update({
        where: { id: nodeId },
        data: { slug: normalized },
      });
    }

    if (input.termIds) {
      await tx.nodeTerm.deleteMany({ where: { nodeId } });
      if (input.termIds.length > 0) {
        await tx.nodeTerm.createMany({
          data: input.termIds.map((termId) => ({
            nodeId,
            termId,
          })),
        });
      }
    }

    return node;
  });
}

export async function deleteNode(nodeId: number) {
  await prisma.$transaction(async (tx) => {
    await tx.nodeTerm.deleteMany({ where: { nodeId } });
    await tx.urlAlias.deleteMany({
      where: {
        targetType: 'node',
        targetId: nodeId,
      },
    });
    await tx.node.delete({ where: { id: nodeId } });
  });
}

function nullable<T>(value: T | null | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? (trimmed as T) : null;
  }
  return value as T;
}

function normalizeSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || cryptoRandomSlug();
}

function normalizePath(slug: string): string {
  return slug.startsWith('/') ? slug : `/${slug}`;
}

async function assertAliasAvailable(
  tx: Prisma.TransactionClient,
  sourcePath: string,
  nodeIdToIgnore?: number
) {
  const existing = await tx.urlAlias.findFirst({
    where: {
      sourcePath,
      NOT: nodeIdToIgnore
        ? {
            targetId: nodeIdToIgnore,
            targetType: 'node',
          }
        : undefined,
    },
  });

  if (existing) {
    throw new Error(`Path "${sourcePath}" is already assigned to another piece of content.`);
  }
}

async function getNextNid(tx: Prisma.TransactionClient): Promise<number> {
  const result = await tx.node.aggregate({
    _max: { nid: true },
  });

  return (result._max.nid || 0) + 1;
}

function cryptoRandomSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}
