#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying setup...\n');

  let errors = 0;
  let warnings = 0;

  // Check environment variables
  console.log('📋 Checking environment variables...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SITE_URL',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`  ❌ ${envVar} not set`);
      errors++;
    } else {
      console.log(`  ✅ ${envVar} set`);
    }
  }

  // Check database connection
  console.log('\n🗄️  Checking database connection...');
  try {
    await prisma.$connect();
    console.log('  ✅ Database connected');
  } catch (error) {
    console.log('  ❌ Database connection failed:', error);
    errors++;
    await prisma.$disconnect();
    process.exit(1);
  }

  // Check tables exist
  console.log('\n📊 Checking database tables...');
  try {
    await prisma.urlAlias.count();
    console.log('  ✅ url_aliases table exists');
  } catch (error) {
    console.log('  ❌ url_aliases table missing - run: npm run prisma:push');
    errors++;
  }

  try {
    await prisma.node.count();
    console.log('  ✅ nodes table exists');
  } catch (error) {
    console.log('  ❌ nodes table missing - run: npm run prisma:push');
    errors++;
  }

  // Check data exists
  console.log('\n📈 Checking imported data...');
  const nodeCount = await prisma.node.count();
  const aliasCount = await prisma.urlAlias.count();
  const termCount = await prisma.taxonomyTerm.count();

  console.log(`  Nodes: ${nodeCount}`);
  console.log(`  URL Aliases: ${aliasCount}`);
  console.log(`  Terms: ${termCount}`);

  if (nodeCount === 0) {
    console.log('  ⚠️  No nodes found - run: npm run import:drupal');
    warnings++;
  } else {
    console.log('  ✅ Nodes imported');
  }

  if (aliasCount === 0) {
    console.log('  ⚠️  No URL aliases found - run: npm run import:drupal');
    warnings++;
  } else {
    console.log('  ✅ URL aliases imported');
  }

  // Check required files
  console.log('\n📁 Checking required files...');
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'prisma/schema.prisma',
    '.env',
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(`  ✅ ${file} exists`);
    } catch (error) {
      console.log(`  ❌ ${file} missing`);
      errors++;
    }
  }

  // Check data directory
  console.log('\n📂 Checking data directory...');
  try {
    await fs.access('data/urls.csv');
    console.log('  ✅ data/urls.csv exists');
  } catch (error) {
    console.log('  ⚠️  data/urls.csv missing - create for SEO diff');
    warnings++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`  Errors: ${errors}`);
  console.log(`  Warnings: ${warnings}`);

  if (errors === 0 && warnings === 0) {
    console.log('\n✅ Setup verified successfully!');
    console.log('\nNext steps:');
    console.log('  1. npm run dev          - Start development server');
    console.log('  2. npm run seo:diff     - Run SEO parity check');
    console.log('  3. npm run test:e2e     - Run E2E tests');
  } else if (errors > 0) {
    console.log('\n❌ Setup has errors. Please fix them before proceeding.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Setup has warnings. Review them and proceed if acceptable.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
