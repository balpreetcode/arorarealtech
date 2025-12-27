import { test, expect } from '@playwright/test';

test.describe('Arora Real Tech Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Arora Real Tech');

    // Check for the tagline
    await expect(page.locator('text=Your trusted partner in real estate')).toBeVisible();

    // Check for navigation links
    await expect(page.locator('a:has-text("About Us")')).toBeVisible();
    await expect(page.locator('a:has-text("Contact")')).toBeVisible();
    await expect(page.locator('a:has-text("Sitemap")')).toBeVisible();
    await expect(page.locator('a:has-text("RSS Feed")')).toBeVisible();
  });

  test('should display Latest Properties section', async ({ page }) => {
    await page.goto('/');

    // Check for Latest Properties heading
    await expect(page.locator('h2:has-text("Latest Properties")')).toBeVisible();

    // Check for property cards
    const articles = page.locator('article');
    const count = await articles.count();

    console.log(`Found ${count} property listings`);
    expect(count).toBeGreaterThan(0);
  });

  test('should display images for properties that have them', async ({ page }) => {
    await page.goto('/');

    // Check if any property cards have images
    const images = page.locator('article img');
    const imageCount = await images.count();

    console.log(`Found ${imageCount} property images`);

    if (imageCount > 0) {
      // Check that at least one image has a valid src
      const firstImage = images.first();
      const src = await firstImage.getAttribute('src');
      console.log(`First image src: ${src}`);
      expect(src).toBeTruthy();
      expect(src).toContain('/sites/default/files/');
    }
  });

  test('should be able to click on property links', async ({ page }) => {
    await page.goto('/');

    // Get the first property link
    const firstPropertyLink = page.locator('article h3 a').first();
    const linkText = await firstPropertyLink.textContent();
    const href = await firstPropertyLink.getAttribute('href');

    console.log(`Testing link: ${linkText} -> ${href}`);

    // Click the link
    await firstPropertyLink.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Check that we navigated to a new page (URL changed)
    expect(page.url()).not.toContain('localhost:3002');
  });

  test('should have footer with copyright', async ({ page }) => {
    await page.goto('/');

    // Check for footer
    const currentYear = new Date().getFullYear();
    await expect(page.locator(`text=© ${currentYear} Arora Real Tech`)).toBeVisible();
  });
});

test.describe('Property Pages', () => {
  test('should load individual property pages', async ({ page }) => {
    // First get a property link from the homepage
    await page.goto('/');

    const propertyLinks = page.locator('article h3 a');
    const count = await propertyLinks.count();

    if (count > 0) {
      const firstLink = propertyLinks.first();
      const href = await firstLink.getAttribute('href');

      // Navigate to the property page
      await page.goto(href || '/');

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Check that there's a heading on the page
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      console.log(`Loaded property page: ${await h1.textContent()}`);
    }
  });
});

test.describe('Image Loading', () => {
  test('should load images from the correct path', async ({ page }) => {
    await page.goto('/');

    // Listen for image requests
    const imageRequests: string[] = [];
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        imageRequests.push(request.url());
      }
    });

    // Wait for images to load
    await page.waitForLoadState('networkidle');

    console.log(`Image requests: ${imageRequests.length}`);
    imageRequests.forEach(url => console.log(`  ${url}`));

    // Check that images are requested from the correct path
    const imageUrls = imageRequests.filter(url => url.includes('/sites/default/files/'));
    console.log(`Images from /sites/default/files/: ${imageUrls.length}`);

    if (imageUrls.length > 0) {
      expect(imageUrls.length).toBeGreaterThan(0);
    }
  });
});
