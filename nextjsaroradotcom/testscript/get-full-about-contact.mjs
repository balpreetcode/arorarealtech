import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // Get About Us page
  const aboutUs = await prisma.node.findFirst({
    where: { slug: 'about-us' }
  });

  if (aboutUs) {
    console.log('=== ABOUT US PAGE ===');
    console.log('Title:', aboutUs.title);
    console.log('Summary:', aboutUs.summary);
    console.log('\nBody HTML:');
    console.log(aboutUs.bodyHtml);
    console.log('\n\n');

    fs.writeFileSync('output/about-us-content.html', aboutUs.bodyHtml || '');
  }

  // Get Contact Us page
  const contactUs = await prisma.node.findFirst({
    where: { slug: 'contact-us' }
  });

  if (contactUs) {
    console.log('=== CONTACT US PAGE ===');
    console.log('Title:', contactUs.title);
    console.log('Summary:', contactUs.summary);
    console.log('\nBody HTML:');
    console.log(contactUs.bodyHtml);
    console.log('\n\n');

    fs.writeFileSync('output/contact-us-content.html', contactUs.bodyHtml || '');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
