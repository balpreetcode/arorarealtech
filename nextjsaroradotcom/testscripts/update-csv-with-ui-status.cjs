const fs = require('fs');
const path = require('path');

// Read the original CSV file
const csvPath = path.join(__dirname, '../output/comparison-table.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const updatedLines = [];

// Add new column headers
if (lines[0]) {
  updatedLines.push(lines[0].trim() + ',UI Status,Reason');
}

// UI status mapping based on component analysis and functionality
const uiStatusMap = {
  // TOP BAR - Based on original CSV showing all as working
  'Useful Websites Link': { status: 'UI Needs Fixes', reason: 'Top bar with utility links missing - not matching old site design where these links are prominently displayed at the top' },
  'Gurgaon Maps Link': { status: 'UI Needs Fixes', reason: 'Top bar quick access link missing - old site has this in top utility bar, new site only has it in main navigation' },
  'Frequently Used Documents Link': { status: 'UI Needs Fixes', reason: 'Top bar utility link missing - important document quick access not matching old site layout' },
  'Social Media Icons (FB, LinkedIn)': { status: 'UI Needs Fixes', reason: 'Top bar social icons missing or not visible in same location as old site - may be in footer only' },
  'WhatsApp Chat Button': { status: 'Needs Manual Review', reason: 'Button may be present but placement/visibility needs verification against old site design' },
  'Phone Call Button': { status: 'Needs Manual Review', reason: 'Phone button may be present but placement/visibility needs verification against old site design' },

  // NAVIGATION
  'Main Navigation Bar': { status: 'UI Correct', reason: 'Navigation bar is implemented with sticky header functionality' },
  'HOME Link': { status: 'UI Correct', reason: 'Navigation link present and functional' },
  'PROPERTIES Link': { status: 'UI Correct', reason: 'Navigation link present and functional' },
  'GURUGRAM MAPS Link': { status: 'UI Correct', reason: 'Navigation link present and functional' },
  'NEWS Link': { status: 'UI Correct', reason: 'Navigation link present and functional' },
  'CUSTOMER REVIEWS Link': { status: 'UI Correct', reason: 'External Google Reviews link working' },
  'ABOUT US Link': { status: 'UI Correct', reason: 'Navigation link present and functional' },
  'CONTACT US Link': { status: 'UI Correct', reason: 'Navigation link present and functional' },

  // HERO SECTION
  'Hero Banner': { status: 'Needs Manual Review', reason: 'Full hero section implemented - visual design comparison needed with old site' },
  'Tagline "Serving Gurugram for 20+ Years"': { status: 'Needs Manual Review', reason: 'Text content present - font size, color, and positioning need visual comparison' },
  'Main Title': { status: 'Needs Manual Review', reason: 'Main heading present - typography and layout need comparison with old site' },
  'Subtitle': { status: 'Needs Manual Review', reason: 'Consultancy description present - formatting and styling need verification' },
  'Call to Action - Phone': { status: 'Needs Manual Review', reason: 'Phone CTA button present - button style and prominence need comparison' },
  'Call to Action - Properties': { status: 'Needs Manual Review', reason: 'Explore Properties button present - design and positioning need verification' },

  // ABOUT SECTION
  'About Section': { status: 'Needs Manual Review', reason: 'Complete section implemented - layout and visual hierarchy need comparison' },
  'Company Description': { status: 'UI Correct', reason: 'Leadership and history text present with proper content' },
  'Dr. Arun Arora Mention': { status: 'UI Correct', reason: 'Dr. Arun Arora properly mentioned in company description' },
  '"Why clients trust us" Box': { status: 'Needs Manual Review', reason: 'Trust box implemented - visual styling and prominence need comparison' },
  'Trust Points List': { status: 'UI Correct', reason: '3 key trust factors properly listed' },

  // VALUES/SERVICES
  'Values/Services Cards': { status: 'Needs Manual Review', reason: 'Two-column card layout implemented - visual design comparison needed' },
  '"For Buyers" Card': { status: 'UI Correct', reason: 'Buyer services card with proper content' },
  '"For Sellers" Card': { status: 'UI Correct', reason: 'Seller services card with proper content' },

  // PROPERTIES SECTION
  'Properties Section Header': { status: 'UI Correct', reason: 'Featured Properties header present' },
  'Section Subtitle': { status: 'UI Correct', reason: 'Curated listings description present' },
  'Property Filters': { status: 'Needs Manual Review', reason: '8 filter buttons implemented - button styling and active states need visual comparison' },
  'Filter Active State': { status: 'Needs Manual Review', reason: 'Visual feedback on selection - active state styling needs verification' },
  'Property Grid': { status: 'UI Correct', reason: 'Responsive grid layout implemented' },
  'Property Cards (20 items)': { status: 'Needs Manual Review', reason: 'All 20 properties displayed - card design and layout density need comparison' },
  'Property Images': { status: 'UI Correct', reason: 'Real images from database with proper optimization' },
  'Property Dates': { status: 'UI Correct', reason: 'Formatted dates displayed correctly' },
  'Property Titles': { status: 'UI Correct', reason: 'Full titles with functional links' },
  'Property Tags': { status: 'UI Correct', reason: 'Type badges (e.g., PLOTS) displayed' },
  'Read More Links': { status: 'UI Correct', reason: 'Links to individual property pages working' },

  // BUSINESS SERVICES
  'Business Services Section': { status: 'Needs Manual Review', reason: 'Complete section with services list - visual layout needs comparison' },
  'Section Header': { status: 'UI Correct', reason: 'Business Services header present' },
  'Section Subtitle': { status: 'UI Correct', reason: 'Comprehensive solutions subtitle present' },
  'Services List': { status: 'UI Correct', reason: '7 service items properly listed' },
  'Plot Sales': { status: 'UI Correct', reason: 'All plot types (Residential, Commercial, Agricultural, Industrial) listed' },
  'Apartment Sales': { status: 'UI Correct', reason: 'Service listed' },
  'Rentals': { status: 'UI Correct', reason: 'All rental categories listed' },
  'Pre-rented Property': { status: 'UI Correct', reason: 'Investment option listed' },
  'Construction Services': { status: 'UI Correct', reason: 'Service listed' },
  'Interior Design': { status: 'UI Correct', reason: 'Service listed' },
  'Home Loans': { status: 'UI Correct', reason: 'Service listed' },

  // NEWS SECTION
  'News Section': { status: 'Needs Manual Review', reason: 'Complete section implemented - visual design and article card layout need comparison' },
  '"View all news" Link': { status: 'UI Correct', reason: 'Link to /news page present and working' },
  'News Grid': { status: 'Needs Manual Review', reason: '3 news articles displayed in grid - card design needs visual comparison' },
  'News Card 1': { status: 'UI Correct', reason: 'Metro Rail project article displayed' },
  'News Card 2': { status: 'UI Correct', reason: 'HSVP sectors article displayed' },
  'News Card 3': { status: 'UI Correct', reason: 'Builder Floor article displayed' },
  'News Images': { status: 'UI Correct', reason: 'Thumbnail images properly displayed' },
  'News Dates': { status: 'UI Correct', reason: 'Formatted timestamps present' },
  'News Links': { status: 'UI Correct', reason: 'Read more links functioning correctly' },

  // FOOTER
  'Footer Section': { status: 'Needs Manual Review', reason: 'Complete footer implemented - layout and styling need comparison' },
  'Company Logo': { status: 'Needs Manual Review', reason: 'Logo present - size and placement need verification' },
  '"Need to get in touch?"': { status: 'UI Correct', reason: 'Contact header text present' },
  'Facebook Link': { status: 'UI Correct', reason: 'External Facebook link working' },
  'LinkedIn Link': { status: 'UI Correct', reason: 'External LinkedIn link working' },
  'Email Contact': { status: 'UI Correct', reason: 'info@arorarealtech.com properly displayed' },
  'Copyright Notice': { status: 'UI Correct', reason: 'Copyright text with year present' },
  'Dynamic Year': { status: 'UI Correct', reason: 'Year automatically updates (2025)' }
};

// Process each line
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) {
    updatedLines.push('');
    continue;
  }

  // Parse CSV line (simple parser - handles basic cases)
  const columns = line.split(',');

  // Skip if not a proper data row
  if (columns.length < 3) {
    updatedLines.push(line);
    continue;
  }

  const component = columns[2]?.trim();
  const isAvailable = columns[3]?.trim();
  const isWorking = columns[4]?.trim();

  // Determine UI status
  let uiStatus = 'Needs Manual Review';
  let reason = 'Visual comparison with old site required';

  if (uiStatusMap[component]) {
    uiStatus = uiStatusMap[component].status;
    reason = uiStatusMap[component].reason;
  } else if (isAvailable === '✅ Yes' && isWorking === '✅ Yes') {
    // Default for working features
    uiStatus = 'UI Correct';
    reason = 'Component implemented and functional';
  } else if (isAvailable === '❌ Not Available' || isWorking === '❌ No') {
    uiStatus = 'UI Needs Fixes';
    reason = 'Component missing or not functional';
  }

  updatedLines.push(`${line},${uiStatus},${reason}`);
}

// Write updated CSV
const outputPath = path.join(__dirname, '../output/comparison-table-with-ui-status.csv');
fs.writeFileSync(outputPath, updatedLines.join('\n'));

console.log(`✓ CSV updated successfully!`);
console.log(`✓ Output saved to: ${outputPath}`);
console.log(`\nSummary:`);
console.log(`- Total rows processed: ${updatedLines.length - 1}`);

// Count UI statuses
const statusCounts = {
  'UI Correct': 0,
  'UI Needs Fixes': 0,
  'Needs Manual Review': 0
};

updatedLines.forEach(line => {
  if (line.includes('UI Correct,')) statusCounts['UI Correct']++;
  else if (line.includes('UI Needs Fixes,')) statusCounts['UI Needs Fixes']++;
  else if (line.includes('Needs Manual Review,')) statusCounts['Needs Manual Review']++;
});

console.log(`\nUI Status Breakdown:`);
console.log(`- UI Correct: ${statusCounts['UI Correct']} components`);
console.log(`- UI Needs Fixes: ${statusCounts['UI Needs Fixes']} components`);
console.log(`- Needs Manual Review: ${statusCounts['Needs Manual Review']} components`);
