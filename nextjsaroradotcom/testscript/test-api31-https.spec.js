import { test, expect } from '@playwright/test';

test.describe('API31 HTTPS Tests', () => {
  test('should access api31 over HTTPS', async ({ page }) => {
    // Navigate to the HTTPS endpoint
    const response = await page.goto('https://api31.winds-os.com');

    // Verify the response is successful
    expect(response.status()).toBe(200);

    // Verify it's using HTTPS
    expect(page.url()).toContain('https://');

    console.log('✓ API31 is successfully running over HTTPS');
  });

  test('should redirect HTTP to HTTPS', async ({ page }) => {
    // Try accessing via HTTP
    const response = await page.goto('http://api31.winds-os.com');

    // Should be redirected to HTTPS
    expect(page.url()).toContain('https://');

    console.log('✓ HTTP successfully redirects to HTTPS');
  });

  test('should have valid SSL certificate', async ({ page, context }) => {
    // Navigate to HTTPS endpoint
    await page.goto('https://api31.winds-os.com');

    // If we get here without SSL errors, the certificate is valid
    expect(page.url()).toBe('https://api31.winds-os.com/');

    console.log('✓ SSL certificate is valid for api31.winds-os.com');
  });

  test('should serve content securely', async ({ page }) => {
    await page.goto('https://api31.winds-os.com');

    // Verify the page loaded
    const content = await page.content();
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);

    console.log('✓ Content served successfully over HTTPS');
  });
});
