import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking About Us and Contact Us pages ===\n');

  // Check URL aliases
  const aliases = await prisma.urlAlias.findMany({
    where: {
      OR: [
        { sourcePath: { contains: 'about' } },
        { sourcePath: { contains: 'contact' } }
      ]
    }
  });

  console.log('URL Aliases:');
  console.log(JSON.stringify(aliases, null, 2));
  console.log('\n');

  // Check nodes
  const nodes = await prisma.node.findMany({
    where: {
      OR: [
        { slug: { contains: 'about' } },
        { slug: { contains: 'contact' } },
        { title: { contains: 'About' } },
        { title: { contains: 'Contact' } }
      ]
    },
    include: {
      nodeTerms: {
        include: {
          term: true
        }
      }
    }
  });

  console.log('Nodes:');
  for (const node of nodes) {
    console.log(`\nNode ID: ${node.id}`);
    console.log(`Title: ${node.title}`);
    console.log(`Slug: ${node.slug}`);
    console.log(`Type: ${node.type}`);
    console.log(`Published: ${node.published}`);
    console.log(`Body HTML (first 200 chars): ${node.bodyHtml?.substring(0, 200) || 'N/A'}`);
    console.log(`---`);
  }

  // Check if we have any nodes of type 'page'
  const pageNodes = await prisma.node.findMany({
    where: { type: 'page' }
  });

  console.log(`\n\nTotal page type nodes: ${pageNodes.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
