import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { stripHtmlTags } from '@/lib/html';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://api31.winds-os.com';

  // Get recent published articles
  const nodes = await prisma.node.findMany({
    where: {
      published: true,
      type: 'article',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    include: {
      nodeTerms: {
        include: {
          term: true,
        },
      },
    },
  });

  const rssItems = nodes.map((node) => {
    const link = `${baseUrl}/${node.slug}`;
    const description = node.summary || stripHtmlTags(node.bodyHtml || '').substring(0, 200);
    const categories = node.nodeTerms.map((nt) => nt.term.name);

    return `    <item>
      <title>${escapeXml(node.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${node.createdAt.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      ${categories.map((cat) => `<category>${escapeXml(cat)}</category>`).join('\n      ')}
    </item>`;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Arora Real Tech</title>
    <link>${baseUrl}</link>
    <description>Latest articles from Arora Real Tech</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${rssItems.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
