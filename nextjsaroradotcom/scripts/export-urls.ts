#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📤 Exporting URLs...');

  const aliases = await prisma.urlAlias.findMany({
    where: {
      status: 200,
    },
    select: {
      sourcePath: true,
    },
    orderBy: {
      sourcePath: 'asc',
    },
  });

  const urls = aliases.map((a) => a.sourcePath).join('\n');

  const outputPath = path.join(process.cwd(), 'output', 'urls.txt');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, urls);

  console.log(`✅ Exported ${aliases.length} URLs to ${outputPath}`);

  await prisma.$disconnect();
}

main().catch(console.error);
