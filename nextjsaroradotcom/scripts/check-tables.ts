#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

async function main() {
  const drupalDb = await mysql.createConnection(process.env.DRUPAL_DB_URL!);

  console.log('Checking taxonomy field tables...');
  const [rows] = await drupalDb.query<any[]>(`SHOW TABLES LIKE 'node\_\_field%'`);

  console.log('\nAvailable field tables:');
  rows.forEach((row) => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });

  await drupalDb.end();
}

main().catch(console.error);
