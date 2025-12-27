#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

interface SEOData {
  url: string;
  status: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1: string | null;
  hasJsonLd: boolean;
  error?: string;
}

interface DiffResult {
  url: string;
  legacy: SEOData;
  next: SEOData;
  differences: string[];
  severity: 'ok' | 'warning' | 'error';
}

async function main() {
  console.log('🔍 Starting SEO parity check...\n');

  const legacyOrigin = process.env.LEGACY_ORIGIN || 'https://api31.winds-os.com';
  const nextOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://api31.winds-os.com';

  // Read URLs from CSV
  const urlsPath = path.join(process.cwd(), 'data', 'urls.csv');
  const urlsContent = await fs.readFile(urlsPath, 'utf-8');
  const urls = urlsContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  console.log(`Found ${urls.length} URLs to check\n`);

  const results: DiffResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Checking ${url}...`);

    const legacyData = await fetchSEOData(legacyOrigin + url);
    const nextData = await fetchSEOData(nextOrigin + url);

    const diff = compareSEOData(url, legacyData, nextData);
    results.push(diff);

    if (diff.severity === 'error') {
      console.log(`  ❌ ${diff.differences.length} error(s)`);
    } else if (diff.severity === 'warning') {
      console.log(`  ⚠️  ${diff.differences.length} warning(s)`);
    } else {
      console.log(`  ✅ No issues`);
    }
  }

  // Write reports
  await fs.mkdir('reports', { recursive: true });

  const jsonPath = path.join(process.cwd(), 'reports', 'seo-diff.json');
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  const mdPath = path.join(process.cwd(), 'reports', 'seo-diff.md');
  const mdContent = generateMarkdownReport(results);
  await fs.writeFile(mdPath, mdContent);

  console.log(`\n📊 Reports generated:`);
  console.log(`  - ${jsonPath}`);
  console.log(`  - ${mdPath}`);

  // Check for hard regressions
  const errors = results.filter((r) => r.severity === 'error');
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} URL(s) have hard regressions`);
    process.exit(1);
  } else {
    console.log(`\n✅ All URLs passed SEO parity check`);
  }
}

async function fetchSEOData(url: string): Promise<SEOData> {
  try {
    const response = await fetch(url);
    const status = response.status;

    if (status !== 200) {
      return {
        url,
        status,
        title: null,
        metaDescription: null,
        canonical: null,
        h1: null,
        hasJsonLd: false,
        error: `HTTP ${status}`,
      };
    }

    const html = await response.text();

    return {
      url,
      status,
      title: extractTitle(html),
      metaDescription: extractMetaDescription(html),
      canonical: extractCanonical(html),
      h1: extractH1(html),
      hasJsonLd: html.includes('application/ld+json'),
    };
  } catch (error) {
    return {
      url,
      status: 0,
      title: null,
      metaDescription: null,
      canonical: null,
      h1: null,
      hasJsonLd: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractMetaDescription(html: string): string | null {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  return match ? match[1].trim() : null;
}

function extractCanonical(html: string): string | null {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  return match ? match[1].trim() : null;
}

function extractH1(html: string): string | null {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (!match) return null;
  return match[1].replace(/<[^>]*>/g, '').trim();
}

function compareSEOData(url: string, legacy: SEOData, next: SEOData): DiffResult {
  const differences: string[] = [];
  let severity: 'ok' | 'warning' | 'error' = 'ok';

  // Status code
  if (legacy.status !== next.status) {
    differences.push(`Status: ${legacy.status} → ${next.status}`);
    severity = 'error';
  }

  // Title
  if (legacy.title !== next.title) {
    if (!next.title) {
      differences.push(`Title missing in new site`);
      severity = 'error';
    } else {
      differences.push(`Title: "${legacy.title}" → "${next.title}"`);
      if (severity !== 'error') severity = 'warning';
    }
  }

  // Meta description
  if (legacy.metaDescription !== next.metaDescription) {
    if (!next.metaDescription && legacy.metaDescription) {
      differences.push(`Meta description missing in new site`);
      severity = 'error';
    } else {
      differences.push(`Meta description changed`);
      if (severity !== 'error') severity = 'warning';
    }
  }

  // Canonical
  if (legacy.canonical && !next.canonical) {
    differences.push(`Canonical URL missing in new site`);
    severity = 'error';
  } else if (legacy.canonical !== next.canonical) {
    differences.push(`Canonical: "${legacy.canonical}" → "${next.canonical}"`);
    if (severity !== 'error') severity = 'warning';
  }

  // H1
  if (legacy.h1 !== next.h1) {
    if (!next.h1 && legacy.h1) {
      differences.push(`H1 missing in new site`);
      if (severity !== 'error') severity = 'warning';
    } else {
      differences.push(`H1: "${legacy.h1}" → "${next.h1}"`);
      if (severity !== 'error') severity = 'warning';
    }
  }

  // JSON-LD
  if (legacy.hasJsonLd && !next.hasJsonLd) {
    differences.push(`JSON-LD missing in new site`);
    if (severity !== 'error') severity = 'warning';
  }

  return {
    url,
    legacy,
    next,
    differences,
    severity,
  };
}

function generateMarkdownReport(results: DiffResult[]): string {
  const errors = results.filter((r) => r.severity === 'error');
  const warnings = results.filter((r) => r.severity === 'warning');
  const ok = results.filter((r) => r.severity === 'ok');

  let md = `# SEO Parity Check Report

Generated: ${new Date().toISOString()}

## Summary

- ✅ OK: ${ok.length}
- ⚠️  Warnings: ${warnings.length}
- ❌ Errors: ${errors.length}

---

`;

  if (errors.length > 0) {
    md += `## ❌ Errors (${errors.length})\n\n`;
    for (const result of errors) {
      md += formatResult(result);
    }
  }

  if (warnings.length > 0) {
    md += `## ⚠️  Warnings (${warnings.length})\n\n`;
    for (const result of warnings) {
      md += formatResult(result);
    }
  }

  if (ok.length > 0) {
    md += `## ✅ OK (${ok.length})\n\n`;
    for (const result of ok) {
      md += `- ${result.url}\n`;
    }
  }

  return md;
}

function formatResult(result: DiffResult): string {
  let md = `### ${result.url}\n\n`;

  if (result.differences.length > 0) {
    md += `**Differences:**\n\n`;
    for (const diff of result.differences) {
      md += `- ${diff}\n`;
    }
    md += '\n';
  }

  md += `**Legacy:**\n`;
  md += `- Status: ${result.legacy.status}\n`;
  md += `- Title: ${result.legacy.title || '(none)'}\n`;
  md += `- Canonical: ${result.legacy.canonical || '(none)'}\n`;
  md += `- JSON-LD: ${result.legacy.hasJsonLd ? 'Yes' : 'No'}\n\n`;

  md += `**Next:**\n`;
  md += `- Status: ${result.next.status}\n`;
  md += `- Title: ${result.next.title || '(none)'}\n`;
  md += `- Canonical: ${result.next.canonical || '(none)'}\n`;
  md += `- JSON-LD: ${result.next.hasJsonLd ? 'Yes' : 'No'}\n\n`;

  md += '---\n\n';

  return md;
}

main().catch(console.error);
