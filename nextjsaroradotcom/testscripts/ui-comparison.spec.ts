import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ComparisonResult {
  section: string;
  component: string;
  oldSiteUrl: string;
  newSiteUrl: string;
  uiStatus: string;
  reason: string;
}

const OLD_SITE = 'https://arorarealtech.com';
const NEW_SITE = 'https://api31.winds-os.com';

const comparisonResults: ComparisonResult[] = [];

test.describe('UI Comparison: Drupal vs Next.js', () => {

  test('Homepage - Top Bar and Navigation', async ({ page }) => {
    // Load both sites
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');
    const newSiteScreenshot = await page.screenshot({ fullPage: true });

    await page.goto(OLD_SITE);
    await page.waitForLoadState('networkidle');
    const oldSiteScreenshot = await page.screenshot({ fullPage: true });

    // Save screenshots for manual review
    fs.writeFileSync(path.join(__dirname, '../output/old-site-homepage.png'), oldSiteScreenshot);
    fs.writeFileSync(path.join(__dirname, '../output/new-site-homepage.png'), newSiteScreenshot);

    // Check TOP BAR elements on new site
    await page.goto(NEW_SITE);

    // Useful Websites Link
    const usefulWebsites = await page.locator('a[href="/websites"]').isVisible();
    comparisonResults.push({
      section: 'TOP BAR',
      component: 'Useful Websites Link',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE + '/websites',
      uiStatus: usefulWebsites ? 'Needs Review' : 'Missing',
      reason: usefulWebsites ? 'Element present, needs visual comparison' : 'Link not found'
    });

    // Gurgaon Maps Link
    const mapsLink = await page.locator('a[href="/maps"]').isVisible();
    comparisonResults.push({
      section: 'TOP BAR',
      component: 'Gurgaon Maps Link',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE + '/maps',
      uiStatus: mapsLink ? 'Needs Review' : 'Missing',
      reason: mapsLink ? 'Element present, needs visual comparison' : 'Link not found'
    });

    // Important Documents Link
    const docsLink = await page.locator('a[href="/important-documents"]').isVisible();
    comparisonResults.push({
      section: 'TOP BAR',
      component: 'Frequently Used Documents Link',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE + '/important-documents',
      uiStatus: docsLink ? 'Needs Review' : 'Missing',
      reason: docsLink ? 'Element present, needs visual comparison' : 'Link not found'
    });

    // Social Media Icons
    const fbIcon = await page.locator('a[href*="facebook"]').isVisible();
    const linkedinIcon = await page.locator('a[href*="linkedin"]').isVisible();
    comparisonResults.push({
      section: 'TOP BAR',
      component: 'Social Media Icons (FB, LinkedIn)',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: (fbIcon && linkedinIcon) ? 'Needs Review' : 'Partial',
      reason: (fbIcon && linkedinIcon) ? 'Both icons present, needs visual comparison' : 'Some icons missing'
    });

    // WhatsApp Button
    const whatsappBtn = await page.locator('a[href*="wa.me"]').isVisible();
    comparisonResults.push({
      section: 'TOP BAR',
      component: 'WhatsApp Chat Button',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: whatsappBtn ? 'Needs Review' : 'Missing',
      reason: whatsappBtn ? 'Element present, needs visual comparison' : 'Button not found'
    });

    // Phone Call Button
    const phoneBtn = await page.locator('a[href*="tel:"]').isVisible();
    comparisonResults.push({
      section: 'TOP BAR',
      component: 'Phone Call Button',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: phoneBtn ? 'Needs Review' : 'Missing',
      reason: phoneBtn ? 'Element present, needs visual comparison' : 'Button not found'
    });
  });

  test('Homepage - Navigation Bar', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    const navLinks = [
      { name: 'HOME', href: '/' },
      { name: 'PROPERTIES', href: '/properties' },
      { name: 'GURUGRAM MAPS', href: '/maps' },
      { name: 'NEWS', href: '/news' },
      { name: 'ABOUT US', href: '/about-us' },
      { name: 'CONTACT US', href: '/contact-us' }
    ];

    for (const link of navLinks) {
      const isVisible = await page.locator(`a[href="${link.href}"]`).first().isVisible();
      comparisonResults.push({
        section: 'NAVIGATION',
        component: `${link.name} Link`,
        oldSiteUrl: OLD_SITE,
        newSiteUrl: NEW_SITE + link.href,
        uiStatus: isVisible ? 'Needs Review' : 'Missing',
        reason: isVisible ? 'Element present, needs visual comparison' : 'Link not found'
      });
    }

    // Check if navigation is sticky
    const nav = await page.locator('nav').first();
    const navPosition = await nav.evaluate(el => window.getComputedStyle(el).position);
    comparisonResults.push({
      section: 'NAVIGATION',
      component: 'Sticky Navigation',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: navPosition.includes('sticky') || navPosition.includes('fixed') ? 'Needs Review' : 'Issue',
      reason: navPosition.includes('sticky') || navPosition.includes('fixed') ? 'Sticky behavior present' : 'Navigation not sticky'
    });
  });

  test('Homepage - Hero Section', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    // Tagline
    const tagline = await page.getByText(/Serving Gurugram for 20\+ Years/i).isVisible();
    comparisonResults.push({
      section: 'HERO SECTION',
      component: 'Tagline "Serving Gurugram for 20+ Years"',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: tagline ? 'Needs Review' : 'Missing',
      reason: tagline ? 'Text present, needs visual comparison' : 'Tagline not found'
    });

    // Main Title
    const mainTitle = await page.getByText(/Helping Buyers, Sellers & Investors/i).isVisible();
    comparisonResults.push({
      section: 'HERO SECTION',
      component: 'Main Title',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: mainTitle ? 'Needs Review' : 'Missing',
      reason: mainTitle ? 'Text present, needs visual comparison' : 'Main title not found'
    });

    // CTA Buttons
    const phoneButton = await page.locator('a[href*="tel:"]').first().isVisible();
    const propertiesButton = await page.getByText(/Explore Properties/i).isVisible();
    comparisonResults.push({
      section: 'HERO SECTION',
      component: 'Call to Action Buttons',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: (phoneButton && propertiesButton) ? 'Needs Review' : 'Partial',
      reason: (phoneButton && propertiesButton) ? 'Both CTAs present' : 'Some CTA buttons missing'
    });
  });

  test('Homepage - About Section', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    const drArunarora = await page.getByText(/Dr.*Arun.*Arora/i).isVisible();
    const trustBox = await page.getByText(/Why clients trust us/i).isVisible();

    comparisonResults.push({
      section: 'ABOUT SECTION',
      component: 'Company Description with Dr. Arun Arora',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: drArunarora ? 'Needs Review' : 'Missing',
      reason: drArunarora ? 'Content present, needs visual comparison' : 'Dr. Arun Arora mention not found'
    });

    comparisonResults.push({
      section: 'ABOUT SECTION',
      component: '"Why clients trust us" Box',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: trustBox ? 'Needs Review' : 'Missing',
      reason: trustBox ? 'Trust box present, needs visual comparison' : 'Trust box not found'
    });
  });

  test('Homepage - Properties Section', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    const propertiesHeader = await page.getByText(/Featured Properties in Gurugram/i).isVisible();
    const filterButtons = await page.locator('button').filter({ hasText: /Any|Agricultural|Commercial|Industrial/i }).count();
    const propertyCards = await page.locator('article, .property-card, [class*="property"]').count();

    comparisonResults.push({
      section: 'PROPERTIES SECTION',
      component: 'Section Header',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: propertiesHeader ? 'Needs Review' : 'Missing',
      reason: propertiesHeader ? 'Header present' : 'Header not found'
    });

    comparisonResults.push({
      section: 'PROPERTIES SECTION',
      component: 'Property Filters',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: filterButtons >= 4 ? 'Needs Review' : 'Issue',
      reason: filterButtons >= 4 ? `${filterButtons} filter buttons found` : 'Insufficient filter buttons'
    });

    comparisonResults.push({
      section: 'PROPERTIES SECTION',
      component: 'Property Cards Grid',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: propertyCards >= 10 ? 'Needs Review' : 'Issue',
      reason: propertyCards >= 10 ? `${propertyCards} properties displayed` : 'Insufficient properties shown'
    });
  });

  test('Homepage - Business Services Section', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    const servicesHeader = await page.getByText(/Business Services/i).isVisible();
    const plotSales = await page.getByText(/Plot Sales/i).isVisible();
    const homeLoan = await page.getByText(/Home Loan/i).isVisible();

    comparisonResults.push({
      section: 'BUSINESS SERVICES',
      component: 'Business Services Section',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: servicesHeader ? 'Needs Review' : 'Missing',
      reason: servicesHeader ? 'Section present with services list' : 'Section not found'
    });
  });

  test('Homepage - News Section', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    const newsHeader = await page.getByText(/Latest News & Policy Updates/i).isVisible();
    const viewAllLink = await page.locator('a[href="/news"]').isVisible();
    const newsCards = await page.locator('article, .news-card, [class*="news"]').count();

    comparisonResults.push({
      section: 'NEWS SECTION',
      component: 'News Section',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE + '/news',
      uiStatus: newsHeader ? 'Needs Review' : 'Missing',
      reason: newsHeader ? `Section present with ${newsCards} articles` : 'News section not found'
    });
  });

  test('Homepage - Footer', async ({ page }) => {
    await page.goto(NEW_SITE);
    await page.waitForLoadState('networkidle');

    const footerLogo = await page.locator('footer img, footer svg').first().isVisible();
    const footerEmail = await page.getByText(/info@arorarealtech\.com/i).isVisible();
    const copyright = await page.getByText(/© 2025 Arora Real Tech/i).isVisible();
    const footerFB = await page.locator('footer a[href*="facebook"]').isVisible();
    const footerLinkedIn = await page.locator('footer a[href*="linkedin"]').isVisible();

    comparisonResults.push({
      section: 'FOOTER',
      component: 'Footer Complete',
      oldSiteUrl: OLD_SITE,
      newSiteUrl: NEW_SITE,
      uiStatus: (footerLogo && footerEmail && copyright) ? 'Needs Review' : 'Partial',
      reason: (footerLogo && footerEmail && copyright) ? 'All major footer elements present' : 'Some footer elements missing'
    });
  });

  test('Properties Page', async ({ page }) => {
    await page.goto(NEW_SITE + '/properties');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/new-site-properties.png', fullPage: true });

    await page.goto(OLD_SITE + '/properties');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/old-site-properties.png', fullPage: true });

    comparisonResults.push({
      section: 'PROPERTIES PAGE',
      component: 'Properties Listing Page',
      oldSiteUrl: OLD_SITE + '/properties',
      newSiteUrl: NEW_SITE + '/properties',
      uiStatus: 'Needs Review',
      reason: 'Screenshots captured for manual comparison'
    });
  });

  test('Maps Page', async ({ page }) => {
    await page.goto(NEW_SITE + '/maps');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/new-site-maps.png', fullPage: true });

    await page.goto(OLD_SITE + '/maps');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/old-site-maps.png', fullPage: true });

    comparisonResults.push({
      section: 'MAPS PAGE',
      component: 'Gurgaon Maps Page',
      oldSiteUrl: OLD_SITE + '/maps',
      newSiteUrl: NEW_SITE + '/maps',
      uiStatus: 'Needs Review',
      reason: 'Screenshots captured for manual comparison'
    });
  });

  test('News Page', async ({ page }) => {
    await page.goto(NEW_SITE + '/news');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/new-site-news.png', fullPage: true });

    await page.goto(OLD_SITE + '/news');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/old-site-news.png', fullPage: true });

    comparisonResults.push({
      section: 'NEWS PAGE',
      component: 'News Listing Page',
      oldSiteUrl: OLD_SITE + '/news',
      newSiteUrl: NEW_SITE + '/news',
      uiStatus: 'Needs Review',
      reason: 'Screenshots captured for manual comparison'
    });
  });

  test('About Us Page', async ({ page }) => {
    await page.goto(NEW_SITE + '/about-us');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/new-site-about.png', fullPage: true });

    await page.goto(OLD_SITE + '/about-us');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/old-site-about.png', fullPage: true });

    comparisonResults.push({
      section: 'ABOUT US PAGE',
      component: 'About Us Page',
      oldSiteUrl: OLD_SITE + '/about-us',
      newSiteUrl: NEW_SITE + '/about-us',
      uiStatus: 'Needs Review',
      reason: 'Screenshots captured for manual comparison'
    });
  });

  test('Contact Us Page', async ({ page }) => {
    await page.goto(NEW_SITE + '/contact-us');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/new-site-contact.png', fullPage: true });

    await page.goto(OLD_SITE + '/contact-us');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './output/old-site-contact.png', fullPage: true });

    comparisonResults.push({
      section: 'CONTACT US PAGE',
      component: 'Contact Us Page',
      oldSiteUrl: OLD_SITE + '/contact-us',
      newSiteUrl: NEW_SITE + '/contact-us',
      uiStatus: 'Needs Review',
      reason: 'Screenshots captured for manual comparison'
    });
  });

  test.afterAll(async () => {
    // Write results to JSON file
    const outputPath = path.join(__dirname, '../output/ui-comparison-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(comparisonResults, null, 2));
    console.log(`Comparison results saved to ${outputPath}`);
  });
});
