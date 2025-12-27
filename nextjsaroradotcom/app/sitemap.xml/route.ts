import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://api31.winds-os.com';

  // Get all URL aliases with status 200
  const aliases = await prisma.urlAlias.findMany({
    where: {
      status: 200,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Get node data for lastmod
  const nodeIds = aliases
    .filter((a) => a.targetType === 'node' && a.targetId)
    .map((a) => a.targetId!);

  const nodes = await prisma.node.findMany({
    where: {
      id: { in: nodeIds },
      published: true,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${aliases
  .map((alias) => {
    const url = `${baseUrl}${alias.sourcePath}`;
    let lastmod = alias.updatedAt.toISOString();
    let priority = '0.5';
    let changefreq = 'weekly';

    if (alias.targetType === 'node' && alias.targetId) {
      const node = nodeMap.get(alias.targetId);
      if (node) {
        lastmod = node.updatedAt.toISOString();
        priority = '0.8';
        changefreq = 'monthly';
      }
    }

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
