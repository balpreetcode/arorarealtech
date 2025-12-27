#!/usr/bin/env tsx

import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRUPAL_VERSION = parseInt(process.env.DRUPAL_VERSION || '8', 10);
const BATCH_SIZE = 100;

async function main() {
  console.log(`🖼️  Starting image import from Drupal ${DRUPAL_VERSION}...`);

  const drupalDb = await mysql.createConnection(process.env.DRUPAL_DB_URL!);

  try {
    // Show all tables to find image fields
    const [tables] = await drupalDb.query<any[]>('SHOW TABLES');
    console.log('\nLooking for image field tables...');

    const imageTables = tables.filter((t: any) => {
      const tableName = Object.values(t)[0] as string;
      return tableName.includes('field') && tableName.includes('image');
    });

    console.log('Found image tables:', imageTables.map((t: any) => Object.values(t)[0]));

    // Try to find the main image field table
    let imageData: any[] = [];

    if (DRUPAL_VERSION === 7) {
      // Check common Drupal 7 image field tables
      const possibleTables = [
        'field_data_field_image',
        'field_data_field_images',
        'field_revision_field_image'
      ];

      for (const tableName of possibleTables) {
        try {
          const [rows] = await drupalDb.query<any[]>(`
            SELECT
              entity_id as nid,
              field_image_fid as fid
            FROM ${tableName}
            WHERE entity_type = 'node'
            LIMIT 5
          `);
          if (rows.length > 0) {
            console.log(`\nUsing table: ${tableName}`);
            const [allRows] = await drupalDb.query<any[]>(`
              SELECT
                entity_id as nid,
                field_image_fid as fid
              FROM ${tableName}
              WHERE entity_type = 'node'
            `);
            imageData = allRows;
            break;
          }
        } catch (e) {
          // Table doesn't exist, try next
        }
      }
    } else {
      // Drupal 8+ uses different structure
      const possibleTables = [
        { name: 'node__field_test', col: 'field_test_target_id' },           // PROPERTY IMAGES!
        { name: 'node__field_image', col: 'field_image_target_id' },
        { name: 'node__field_images', col: 'field_images_target_id' },
        { name: 'node__field_banner_image', col: 'field_banner_image_target_id' },
        { name: 'node__field_property_image', col: 'field_property_image_target_id' },
        { name: 'node_revision__field_image', col: 'field_image_target_id' }
      ];

      // Try to import from ALL tables, not just the first one
      const allImageData: any[] = [];

      for (const table of possibleTables) {
        try {
          const [rows] = await drupalDb.query<any[]>(`
            SELECT
              entity_id as nid,
              ${table.col} as fid
            FROM ${table.name}
          `);
          if (rows.length > 0) {
            console.log(`\nFound ${rows.length} images in table: ${table.name}`);
            allImageData.push(...rows);
          }
        } catch (e) {
          // Table doesn't exist, skip
        }
      }

      // Remove duplicates - keep first occurrence for each nid
      const nidMap = new Map();
      for (const item of allImageData) {
        if (!nidMap.has(item.nid)) {
          nidMap.set(item.nid, item);
        }
      }
      imageData = Array.from(nidMap.values());
    }

    console.log(`\nFound ${imageData.length} node-image relationships`);

    if (imageData.length === 0) {
      console.log('No images found. Exiting.');
      return;
    }

    // Get file data
    console.log('\nFetching file data...');
    const fids = imageData.map((i: any) => i.fid);
    const [files] = await drupalDb.query<any[]>(
      DRUPAL_VERSION === 7
        ? `SELECT fid, uri FROM file_managed WHERE fid IN (?)`
        : `SELECT fid, uri FROM file_managed WHERE fid IN (?)`,
      [fids]
    );

    console.log(`Found ${files.length} files`);

    // Create a map of fid to uri
    const fileMap = new Map(files.map((f: any) => [f.fid, f.uri]));

    // Update nodes with image URLs
    console.log('\nUpdating nodes with image URLs...');
    let updated = 0;

    for (let i = 0; i < imageData.length; i += BATCH_SIZE) {
      const batch = imageData.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (item: any) => {
          const uri = fileMap.get(item.fid);
          if (!uri) return;

          // Convert Drupal URI to public URL
          // Format: public://images/filename.jpg -> /sites/default/files/images/filename.jpg
          const imageUrl = uri.replace('public://', '/sites/default/files/');

          // Find the node by nid
          const node = await prisma.node.findFirst({
            where: { nid: item.nid }
          });

          if (!node) return;

          // Update the node with image URL
          await prisma.node.update({
            where: { id: node.id },
            data: { imageUrl }
          });

          updated++;
        })
      );

      console.log(`Updated ${Math.min(i + BATCH_SIZE, imageData.length)}/${imageData.length} images`);
    }

    console.log(`\n✅ Successfully updated ${updated} nodes with images!`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await drupalDb.end();
    await prisma.$disconnect();
  }
}

main();
