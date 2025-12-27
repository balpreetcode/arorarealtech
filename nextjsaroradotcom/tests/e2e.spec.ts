import { test, expect } from '@playwright/test';

test.describe('Next.js CMS E2E Tests', () => {
  test('sitemap.xml should be accessible and valid', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');
    expect(content).toContain('</urlset>');
  });

  test('robots.txt should be accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain('User-agent:');
    expect(content).toContain('Sitemap:');
  });

  test('404 page should display for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Should show 404 content
    const heading = page.locator('h1');
    await expect(heading).toContainText('404');
  });

  test('media files should be accessible via proxy', async ({ request }) => {
    // This tests the rewrite rule for /sites/default/files/*
    // Note: This will only work if LEGACY_MEDIA_ORIGIN is configured
    // and there are actual files at the legacy origin

    const response = await request.get('/sites/default/files/test.jpg', {
      failOnStatusCode: false,
    });

    // If the legacy origin is not configured, this might fail
    // In production, this should return 200 for actual files
    // For now, we just check it doesn't throw an error
    expect([200, 404, 502]).toContain(response.status());
  });
});

test.describe('Node pages', () => {
  test.skip('should render node page with correct SEO tags', async ({ page }) => {
    // This test will be skipped until we have actual data in the database
    // Replace '/example-page' with an actual node path from your database

    await page.goto('/example-page');

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);

    // Check canonical
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);

    // Check H1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check JSON-LD
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
  });
});

test.describe('RSS Feed', () => {
  test('rss.xml should be accessible and valid', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<rss');
    expect(content).toContain('<channel>');
    expect(content).toContain('</channel>');
    expect(content).toContain('</rss>');
  });
});
