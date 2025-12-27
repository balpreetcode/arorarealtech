import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OLD_SITE = 'https://arorarealtech.com';
const NEW_SITE = 'https://api31.winds-os.com';
const OUTPUT_DIR = './output';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const comparisonData: any[] = [];

test.describe('Visual UI Comparison', () => {

  test('Capture Homepage Screenshots', async ({ page }) => {
    // New Site
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(NEW_SITE, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-new-homepage-full.png'), fullPage: true });

    // Old Site
    await page.goto(OLD_SITE, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-old-homepage-full.png'), fullPage: true });

    console.log('✓ Homepage screenshots captured');
  });

  test('Capture Properties Page Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // New Site
    await page.goto(NEW_SITE + '/properties', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-new-properties.png'), fullPage: true });

    // Old Site
    try {
      await page.goto(OLD_SITE + '/properties', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02-old-properties.png'), fullPage: true });
      console.log('✓ Properties page screenshots captured');
    } catch (e) {
      console.log('⚠ Could not capture old site properties page');
    }
  });

  test('Capture Maps Page Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // New Site
    await page.goto(NEW_SITE + '/maps', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-new-maps.png'), fullPage: true });

    // Old Site
    try {
      await page.goto(OLD_SITE + '/maps', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: path.join(OUTPUT_DIR, '03-old-maps.png'), fullPage: true });
      console.log('✓ Maps page screenshots captured');
    } catch (e) {
      console.log('⚠ Could not capture old site maps page');
    }
  });

  test('Capture News Page Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // New Site
    await page.goto(NEW_SITE + '/news', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-new-news.png'), fullPage: true });

    // Old Site
    try {
      await page.goto(OLD_SITE + '/news', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: path.join(OUTPUT_DIR, '04-old-news.png'), fullPage: true });
      console.log('✓ News page screenshots captured');
    } catch (e) {
      console.log('⚠ Could not capture old site news page');
    }
  });

  test('Capture About Us Page Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // New Site
    await page.goto(NEW_SITE + '/about-us', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-new-about.png'), fullPage: true });

    // Old Site
    try {
      await page.goto(OLD_SITE + '/about-us', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: path.join(OUTPUT_DIR, '05-old-about.png'), fullPage: true });
      console.log('✓ About Us page screenshots captured');
    } catch (e) {
      console.log('⚠ Could not capture old site about page');
    }
  });

  test('Capture Contact Us Page Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // New Site
    await page.goto(NEW_SITE + '/contact-us', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-new-contact.png'), fullPage: true });

    // Old Site
    try {
      await page.goto(OLD_SITE + '/contact-us', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: path.join(OUTPUT_DIR, '06-old-contact.png'), fullPage: true });
      console.log('✓ Contact Us page screenshots captured');
    } catch (e) {
      console.log('⚠ Could not capture old site contact page');
    }
  });

  test('Analyze Homepage Elements', async ({ page }) => {
    await page.goto(NEW_SITE, { waitUntil: 'networkidle' });

    // Top Bar Elements
    const topBarChecks = [
      { name: 'Useful Websites Link', selector: 'a[href="/websites"]', section: 'TOP BAR' },
      { name: 'Gurgaon Maps Link', selector: 'a[href="/maps"]', section: 'TOP BAR' },
      { name: 'Important Documents Link', selector: 'a[href="/important-documents"]', section: 'TOP BAR' },
      { name: 'Facebook Icon', selector: 'a[href*="facebook"]', section: 'TOP BAR' },
      { name: 'LinkedIn Icon', selector: 'a[href*="linkedin"]', section: 'TOP BAR' },
      { name: 'WhatsApp Button', selector: 'a[href*="wa.me"]', section: 'TOP BAR' },
      { name: 'Phone Button', selector: 'a[href*="tel:"]', section: 'TOP BAR' },
    ];

    for (const check of topBarChecks) {
      try {
        const element = page.locator(check.selector).first();
        const isVisible = await element.isVisible({ timeout: 5000 });
        comparisonData.push({
          section: check.section,
          component: check.name,
          status: isVisible ? 'Found' : 'Not Found',
          selector: check.selector
        });
      } catch (e) {
        comparisonData.push({
          section: check.section,
          component: check.name,
          status: 'Not Found',
          selector: check.selector
        });
      }
    }

    // Navigation Links
    const navLinks = [
      { name: 'HOME', href: '/' },
      { name: 'PROPERTIES', href: '/properties' },
      { name: 'GURUGRAM MAPS', href: '/maps' },
      { name: 'NEWS', href: '/news' },
      { name: 'ABOUT US', href: '/about-us' },
      { name: 'CONTACT US', href: '/contact-us' }
    ];

    for (const link of navLinks) {
      try {
        const element = page.locator(`a[href="${link.href}"]`).first();
        const isVisible = await element.isVisible({ timeout: 5000 });
        comparisonData.push({
          section: 'NAVIGATION',
          component: `${link.name} Link`,
          status: isVisible ? 'Found' : 'Not Found',
          href: link.href
        });
      } catch (e) {
        comparisonData.push({
          section: 'NAVIGATION',
          component: `${link.name} Link`,
          status: 'Not Found',
          href: link.href
        });
      }
    }

    // Hero Section
    try {
      const heroTagline = await page.getByText(/Serving Gurugram for 20\+ Years/i).first().isVisible({ timeout: 5000 });
      comparisonData.push({ section: 'HERO SECTION', component: 'Tagline', status: heroTagline ? 'Found' : 'Not Found' });
    } catch (e) {
      comparisonData.push({ section: 'HERO SECTION', component: 'Tagline', status: 'Not Found' });
    }

    try {
      const mainTitle = await page.getByText(/Helping Buyers, Sellers & Investors/i).first().isVisible({ timeout: 5000 });
      comparisonData.push({ section: 'HERO SECTION', component: 'Main Title', status: mainTitle ? 'Found' : 'Not Found' });
    } catch (e) {
      comparisonData.push({ section: 'HERO SECTION', component: 'Main Title', status: 'Not Found' });
    }

    // Save analysis
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'element-analysis.json'),
      JSON.stringify(comparisonData, null, 2)
    );

    console.log('✓ Element analysis complete');
    console.log(`Total elements checked: ${comparisonData.length}`);
  });
});
