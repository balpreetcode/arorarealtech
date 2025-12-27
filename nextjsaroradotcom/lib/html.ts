/**
 * HTML utility functions
 */

const LEGACY_MEDIA_ORIGIN = (process.env.LEGACY_MEDIA_ORIGIN || '').replace(/\/$/, '');
const LEGACY_ORIGIN = (process.env.LEGACY_ORIGIN || '').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export function sanitizeHtml(html: string): string {
  let transformed = html;

  // Rewrite legacy file URLs so downloads come from the current host.
  transformed = rewriteLegacyOrigins(transformed);

  // Basic sanitization - in production, use a library like DOMPurify
  // For now, just return as-is since content comes from trusted CMS
  return transformed;
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

export function extractFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? stripHtmlTags(match[1]) : '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteLegacyOrigins(html: string): string {
  const origins = [LEGACY_MEDIA_ORIGIN, LEGACY_ORIGIN].filter(Boolean);

  if (origins.length === 0) {
    return html;
  }

  const replacement = SITE_URL || '';

  return origins.reduce((acc, origin) => {
    const pattern = new RegExp(escapeRegExp(origin), 'g');
    return acc.replace(pattern, replacement);
  }, html);
}
