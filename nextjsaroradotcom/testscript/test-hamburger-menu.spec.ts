import { test, expect } from '@playwright/test';

test.describe('Hamburger Menu Navigation', () => {
  // Using production URL as per user instructions
  const BASE_URL = 'https://arorarealtech.com';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  });

  test('should open hamburger menu on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for navigation to load
    await page.waitForSelector('.nav-toggle', { timeout: 10000 });

    // Verify hamburger button is visible
    const toggleVisible = await page.locator('.nav-toggle').isVisible();
    expect(toggleVisible).toBe(true);

    // Click hamburger toggle
    await page.click('.nav-toggle');

    // Wait a bit for animation
    await page.waitForTimeout(300);

    // Verify menu is visible
    const menu = page.locator('.nav-menu.open');
    await expect(menu).toBeVisible();

    // Verify menu has pointer-events enabled
    const pointerEvents = await menu.evaluate((el) =>
      window.getComputedStyle(el).pointerEvents
    );
    expect(pointerEvents).toBe('auto');
  });

  test('should navigate to HOME when clicked in hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Click on HOME link
    await page.click('.nav-menu.open a[href="/"]');

    // Verify navigation occurred
    await page.waitForURL(BASE_URL + '/', { timeout: 15000 });
    expect(page.url()).toBe(BASE_URL + '/');
  });

  test('should navigate to PROPERTIES when clicked in hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Click on PROPERTIES link
    await page.click('.nav-menu.open a[href="/properties"]');

    // Verify navigation occurred
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/properties');
  });

  test('should navigate to GURUGRAM MAPS when clicked in hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Click on MAPS link
    await page.click('.nav-menu.open a[href="/maps"]');

    // Verify navigation occurred
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/maps');
  });

  test('should navigate to NEWS when clicked in hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Click on NEWS link
    await page.click('.nav-menu.open a[href="/news"]');

    // Verify navigation occurred
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/news');
  });

  test('should navigate to ABOUT US when clicked in hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Click on ABOUT US link
    await page.click('.nav-menu.open a[href="/about-us"]');

    // Verify navigation occurred
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/about-us');
  });

  test('should navigate to CONTACT US when clicked in hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Click on CONTACT US link
    await page.click('.nav-menu.open a[href="/contact-us"]');

    // Verify navigation occurred
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/contact-us');
  });

  test('should open CUSTOMER REVIEWS in new tab', async ({ context, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);

    // Listen for new page/tab
    const pagePromise = context.waitForEvent('page');

    // Click on CUSTOMER REVIEWS link
    await page.click('.nav-menu.open a:has-text("CUSTOMER REVIEWS")');

    // Verify new tab opened
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('google.com');
  });

  test('should close menu after clicking a link', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open menu
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-menu.open')).toBeVisible();

    // Click on a link
    await page.click('.nav-menu.open a[href="/properties"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Menu should be closed (no .open class)
    const menuOpen = await page.locator('.nav-menu.open').count();
    expect(menuOpen).toBe(0);
  });

  test('should toggle menu open and close', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Initially closed
    let menuOpen = await page.locator('.nav-menu.open').count();
    expect(menuOpen).toBe(0);

    // Click to open
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-menu.open')).toBeVisible();

    // Click to close
    await page.click('.nav-toggle');
    await page.waitForTimeout(300);
    menuOpen = await page.locator('.nav-menu.open').count();
    expect(menuOpen).toBe(0);
  });

  test('should not show hamburger menu on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Hamburger toggle should not be visible on desktop
    const toggleVisible = await page.locator('.nav-toggle').isVisible();
    expect(toggleVisible).toBe(false);

    // Menu should be visible without toggle on desktop
    const menuVisible = await page.locator('.nav-menu').isVisible();
    expect(menuVisible).toBe(true);
  });
});
