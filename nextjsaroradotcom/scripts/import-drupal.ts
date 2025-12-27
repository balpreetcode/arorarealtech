#!/usr/bin/env tsx

import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRUPAL_VERSION = parseInt(process.env.DRUPAL_VERSION || '8', 10);
const BATCH_SIZE = 100;
const LEGACY_MEDIA_ORIGIN = process.env.LEGACY_MEDIA_ORIGIN || '';

interface DrupalNode {
  nid: number;
  type: string;
  title: string;
  status: number;
  created: number;
  changed: number;
  uid?: number;
  langcode?: string;
}

interface DrupalUrlAlias {
  source: string;
  alias: string;
  langcode: string;
}

interface DrupalTerm {
  tid: number;
  vid: string;
  name: string;
  langcode?: string;
}

interface ParagraphComponent {
  id: number;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  col1?: string | null;
  col2?: string | null;
  reverse?: boolean;
  cta?: {
    title?: string | null;
    uri?: string | null;
  } | null;
  file?: {
    url: string;
    filename: string;
    filesize: number;
  } | null;
}

interface MediaAsset {
  uuid: string;
  type: 'image' | 'file';
  url: string;
  alt?: string | null;
  title?: string | null;
  filename?: string | null;
}

function stripHtml(input?: string | null): string {
  if (!input) {
    return '';
  }
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeSummary(source?: string | null, length = 220): string | null {
  const text = stripHtml(source);
  if (!text) {
    return null;
  }
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length).trimEnd() + '...';
}

function buildMediaUrl(uri: string): string {
  if (!uri) {
    return '';
  }
  const path = uri.replace(/^public:\/\//, '/sites/default/files/').replace(/^\/*/, '/');
  if (!LEGACY_MEDIA_ORIGIN) {
    return path;
  }
  return `${LEGACY_MEDIA_ORIGIN}${path}`;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function replaceDrupalMedia(html: string | null | undefined, mediaAssets: Map<string, MediaAsset>): string | null {
  if (!html) {
    return html ?? null;
  }

  return html.replace(/<drupal-media[^>]*data-entity-uuid="([^"]+)"[^>]*><\/drupal-media>/g, (_, uuid: string) => {
    const asset = mediaAssets.get(uuid);
    if (!asset) {
      return '';
    }

    if (asset.type === 'image') {
      const altAttr = asset.alt ? ` alt="${asset.alt}"` : asset.title ? ` alt="${asset.title}"` : '';
      const titleAttr = asset.title ? ` title="${asset.title}"` : '';
      return `<img src="${asset.url}"${altAttr}${titleAttr} loading="lazy" />`;
    }

    if (asset.type === 'file') {
      const label = asset.filename || 'Download file';
      return `<a href="${asset.url}" class="download-link">${label}</a>`;
    }

    return '';
  });
}

async function main() {
  console.log(`🚀 Starting Drupal ${DRUPAL_VERSION} import...`);

  const drupalDb = await mysql.createConnection(process.env.DRUPAL_DB_URL!);

  try {
    // Import taxonomy terms
    await importTaxonomyTerms(drupalDb);

    // Import nodes
    await importNodes(drupalDb);

    // Import node-term relationships
    await importNodeTerms(drupalDb);

    // Import URL aliases
    await importUrlAliases(drupalDb);

    console.log('✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await drupalDb.end();
    await prisma.$disconnect();
  }
}

async function importTaxonomyTerms(db: mysql.Connection) {
  console.log('\n📁 Importing taxonomy terms...');

  let terms: DrupalTerm[];

  if (DRUPAL_VERSION === 7) {
    const [rows] = await db.query<any[]>(`
      SELECT
        td.tid,
        td.vid as vocabulary_id,
        v.machine_name as vid,
        td.name,
        'en' as langcode
      FROM taxonomy_term_data td
      LEFT JOIN taxonomy_vocabulary v ON td.vid = v.vid
    `);
    terms = rows.map((row) => ({
      tid: row.tid,
      vid: row.vid || 'tags',
      name: row.name,
      langcode: 'en',
    }));
  } else {
    const [rows] = await db.query<any[]>(`
      SELECT
        tid,
        vid,
        name,
        langcode
      FROM taxonomy_term_field_data
      WHERE status = 1
    `);
    terms = rows;
  }

  console.log(`Found ${terms.length} terms`);

  for (let i = 0; i < terms.length; i += BATCH_SIZE) {
    const batch = terms.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((term) =>
        prisma.taxonomyTerm.upsert({
          where: { tid: term.tid },
          create: {
            tid: term.tid,
            vocabulary: term.vid,
            name: term.name,
            slug: slugify(term.name),
            langcode: term.langcode || 'en',
          },
          update: {
            vocabulary: term.vid,
            name: term.name,
            slug: slugify(term.name),
            langcode: term.langcode || 'en',
          },
        })
      )
    );

    console.log(`Imported ${Math.min(i + BATCH_SIZE, terms.length)}/${terms.length} terms`);
  }
}

async function importNodes(db: mysql.Connection) {
  console.log('\n📄 Importing nodes...');

  let nodes: any[];

  if (DRUPAL_VERSION === 7) {
    const [rows] = await db.query<any[]>(`
      SELECT
        n.nid,
        n.type,
        n.title,
        n.status,
        n.created,
        n.changed,
        n.uid,
        nr.body_value as body,
        nr.body_summary as summary,
        'en' as langcode
      FROM node n
      LEFT JOIN field_revision_body nr ON n.nid = nr.entity_id AND nr.entity_type = 'node'
      WHERE n.status >= 0
      ORDER BY n.nid
    `);
    nodes = rows;
  } else {
    const [rows] = await db.query<any[]>(`
      SELECT
        n.nid,
        nfd.type,
        nfd.title,
        nfd.status,
        nfd.created,
        nfd.changed,
        nfd.uid,
        nfd.langcode,
        nb.body_value as body,
        nb.body_summary as summary
      FROM node n
      INNER JOIN node_field_data nfd ON n.nid = nfd.nid
      LEFT JOIN node__body nb ON n.nid = nb.entity_id AND nb.langcode = nfd.langcode
      WHERE nfd.status >= 0
      ORDER BY n.nid
    `);
    nodes = rows;
  }

  console.log(`Found ${nodes.length} nodes`);

  const descriptionMap = await fetchFieldMap(
    db,
    'node__field_description',
    'field_description_value'
  );
  const newsDescriptionMap = await fetchFieldMap(
    db,
    'node__field_news_description',
    'field_news_description_value'
  );
  const summaryMap = await fetchFieldMap(
    db,
    'node__field_summary',
    'field_summary_value'
  );

  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE);
    const nodeIds = batch.map((node) => node.nid);
    const paragraphHtmlMap = await fetchParagraphHtml(db, nodeIds);

    await Promise.all(
      batch.map((node) => {
        const slug = slugify(node.title);
        const jsonLd = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: node.title,
          datePublished: new Date(node.created * 1000).toISOString(),
          dateModified: new Date(node.changed * 1000).toISOString(),
        });
        const fallbackBody =
          node.body ||
          descriptionMap.get(node.nid) ||
          newsDescriptionMap.get(node.nid) ||
          null;
        const paragraphHtml = paragraphHtmlMap.get(node.nid) || '';
        const combinedBody = [fallbackBody, paragraphHtml].filter(Boolean).join('\n');
        const resolvedSummary =
          node.summary ||
          summaryMap.get(node.nid) ||
          (combinedBody ? makeSummary(combinedBody, 220) : null);

        return prisma.node.upsert({
          where: { nid: node.nid },
          create: {
            nid: node.nid,
            type: node.type,
            title: node.title,
            slug,
            langcode: node.langcode || 'en',
            published: node.status === 1,
            createdAt: new Date(node.created * 1000),
            updatedAt: new Date(node.changed * 1000),
            summary: resolvedSummary,
            bodyHtml: combinedBody || null,
            jsonLd,
            metaTitle: node.title,
            metaDescription: resolvedSummary,
            canonicalPath: `/${slug}`,
          },
          update: {
            type: node.type,
            title: node.title,
            slug,
            langcode: node.langcode || 'en',
            published: node.status === 1,
            updatedAt: new Date(node.changed * 1000),
            summary: resolvedSummary,
            bodyHtml: combinedBody || null,
            jsonLd,
            metaTitle: node.title,
            metaDescription: resolvedSummary,
          },
        });
      })
    );

    console.log(`Imported ${Math.min(i + BATCH_SIZE, nodes.length)}/${nodes.length} nodes`);
  }
}

async function importNodeTerms(db: mysql.Connection) {
  console.log('\n🔗 Importing node-term relationships...');

  let relationships: any[];

  // Use taxonomy_index table for both Drupal 7 and 8+
  try {
    const [rows] = await db.query<any[]>(`
      SELECT DISTINCT
        nid,
        tid
      FROM taxonomy_index
    `);
    relationships = rows;
  } catch (error) {
    console.log('Warning: taxonomy_index table not found, skipping node-term relationships');
    relationships = [];
  }

  console.log(`Found ${relationships.length} node-term relationships`);

  // Get node and term IDs from our database
  const nodes = await prisma.node.findMany({ select: { id: true, nid: true } });
  const terms = await prisma.taxonomyTerm.findMany({ select: { id: true, tid: true } });

  const nodeMap = new Map(nodes.map((n) => [n.nid, n.id]));
  const termMap = new Map(terms.map((t) => [t.tid, t.id]));

  for (let i = 0; i < relationships.length; i += BATCH_SIZE) {
    const batch = relationships.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (rel) => {
        const nodeId = nodeMap.get(rel.nid);
        const termId = termMap.get(rel.tid);

        if (nodeId && termId) {
          try {
            await prisma.nodeTerm.upsert({
              where: {
                nodeId_termId: {
                  nodeId,
                  termId,
                },
              },
              create: { nodeId, termId },
              update: {},
            });
          } catch (error) {
            // Ignore duplicate errors
          }
        }
      })
    );

    console.log(
      `Imported ${Math.min(i + BATCH_SIZE, relationships.length)}/${relationships.length} relationships`
    );
  }
}

async function importUrlAliases(db: mysql.Connection) {
  console.log('\n🔗 Importing URL aliases...');

  let aliases: DrupalUrlAlias[];

  if (DRUPAL_VERSION === 7) {
    const [rows] = await db.query<any[]>(`
      SELECT
        source,
        alias,
        language as langcode
      FROM url_alias
    `);
    aliases = rows.map((row) => ({
      source: row.source,
      alias: row.alias,
      langcode: row.langcode === 'und' ? 'en' : row.langcode,
    }));
  } else {
    const [rows] = await db.query<any[]>(`
      SELECT
        path as source,
        alias,
        langcode
      FROM path_alias
    `);
    aliases = rows;
  }

  console.log(`Found ${aliases.length} URL aliases`);

  // Get all nodes for mapping
  const nodes = await prisma.node.findMany({ select: { id: true, nid: true } });
  const nodeMap = new Map(nodes.map((n) => [n.nid, n.id]));

  for (let i = 0; i < aliases.length; i += BATCH_SIZE) {
    const batch = aliases.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (alias) => {
        // Normalize source path (Drupal can store with or without leading slash)
        const normalizedSource = alias.source.replace(/^\/+/, '');

        // Parse source path (e.g., "node/123" -> type: "node", id: 123)
        const match = normalizedSource.match(/^(node|taxonomy\/term)\/(\d+)$/);

        if (match) {
          const targetType = match[1] === 'node' ? 'node' : 'term';
          const drupalId = parseInt(match[2], 10);
          const targetId = targetType === 'node' ? nodeMap.get(drupalId) : undefined;

          const sourcePath = alias.alias.startsWith('/') ? alias.alias : '/' + alias.alias;

          try {
            await prisma.urlAlias.upsert({
              where: { sourcePath },
              create: {
                sourcePath,
                targetType,
                targetId: targetId || drupalId,
                langcode: alias.langcode || 'en',
                status: 200,
              },
              update: {
                targetType,
                targetId: targetId || drupalId,
                langcode: alias.langcode || 'en',
              },
            });
          } catch (error) {
            console.error(`Failed to import alias ${sourcePath}:`, error);
          }
        }
      })
    );

    console.log(`Imported ${Math.min(i + BATCH_SIZE, aliases.length)}/${aliases.length} aliases`);
  }

  // Create default aliases for nodes without custom aliases
  console.log('\n🔗 Creating default aliases for nodes...');
  const nodesWithoutAliases = await prisma.node.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      nid: true,
      slug: true,
      langcode: true,
    },
  });

  for (const node of nodesWithoutAliases) {
    const sourcePath = `/${node.slug}`;

    const existing = await prisma.urlAlias.findUnique({
      where: { sourcePath },
    });

    if (!existing) {
      await prisma.urlAlias.create({
        data: {
          sourcePath,
          targetType: 'node',
          targetId: node.id,
          langcode: node.langcode,
          status: 200,
        },
      });
    }
  }

  console.log(`Created default aliases for ${nodesWithoutAliases.length} nodes`);
}

async function fetchFieldMap(
  db: mysql.Connection,
  table: string,
  column: string,
  ids?: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>();

  if (ids && ids.length === 0) {
    return map;
  }

  let filter = '';
  let params: Array<number | string> = [];
  if (ids && ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    filter = ` AND entity_id IN (${placeholders})`;
    params = ids;
  }

  try {
    const [rows] = await db.query<any[]>(
      `
        SELECT entity_id, ${column} AS value
        FROM ${table}
        WHERE deleted = 0${filter}
        ORDER BY entity_id, delta ASC
      `,
      params
    );

    for (const row of rows) {
      if (row.value) {
        if (map.has(row.entity_id)) {
          const existing = map.get(row.entity_id)!;
          map.set(row.entity_id, `${existing}\n${row.value}`);
        } else {
          map.set(row.entity_id, row.value);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: could not load data from ${table}:`, error);
  }

  return map;
}

async function fetchParagraphHtml(
  db: mysql.Connection,
  nodeIds: number[]
): Promise<Map<number, string>> {
  const paragraphHtmlMap = new Map<number, string>();

  if (nodeIds.length === 0) {
    return paragraphHtmlMap;
  }

  const nodePlaceholders = nodeIds.map(() => '?').join(',');
  const [componentRows] = await db.query<any[]>(
    `
      SELECT entity_id AS node_id,
             field_add_component_target_id AS paragraph_id,
             delta
      FROM node__field_add_component
      WHERE entity_id IN (${nodePlaceholders}) AND deleted = 0
      ORDER BY entity_id, delta ASC
    `,
    nodeIds
  );

  if (!componentRows.length) {
    return paragraphHtmlMap;
  }

  const paragraphOrder = new Map<number, number[]>();
  const paragraphIds: number[] = [];

  for (const row of componentRows) {
    if (!paragraphOrder.has(row.node_id)) {
      paragraphOrder.set(row.node_id, []);
    }
    paragraphOrder.get(row.node_id)!.push(row.paragraph_id);
    paragraphIds.push(row.paragraph_id);
  }

  const uniqueParagraphIds = Array.from(new Set(paragraphIds));

  if (!uniqueParagraphIds.length) {
    return paragraphHtmlMap;
  }

  const paragraphPlaceholders = uniqueParagraphIds.map(() => '?').join(',');
  const [paragraphRows] = await db.query<any[]>(
    `
      SELECT id, type
      FROM paragraphs_item
      WHERE id IN (${paragraphPlaceholders})
    `,
    uniqueParagraphIds
  );

  const paragraphTypeMap = new Map<number, string>();
  for (const row of paragraphRows) {
    paragraphTypeMap.set(row.id, row.type);
  }

  const titleMap = await fetchFieldMap(db, 'paragraph__field_title', 'field_title_value', uniqueParagraphIds);
  const subtitleMap = await fetchFieldMap(db, 'paragraph__field_subtitle', 'field_subtitle_value', uniqueParagraphIds);
  const bodyMap = await fetchFieldMap(db, 'paragraph__field_body', 'field_body_value', uniqueParagraphIds);

  const [col1Rows] = await db.query<any[]>(
    `
      SELECT entity_id, field_col_1_value AS value
      FROM paragraph__field_col_1
      WHERE entity_id IN (${paragraphPlaceholders}) AND deleted = 0
      ORDER BY entity_id, delta ASC
    `,
    uniqueParagraphIds
  );
  const col1Map = new Map<number, string>();
  for (const row of col1Rows) {
    const existing = col1Map.get(row.entity_id) || '';
    col1Map.set(row.entity_id, existing + row.value);
  }

  const [col2Rows] = await db.query<any[]>(
    `
      SELECT entity_id, field_col_2_value AS value
      FROM paragraph__field_col_2
      WHERE entity_id IN (${paragraphPlaceholders}) AND deleted = 0
      ORDER BY entity_id, delta ASC
    `,
    uniqueParagraphIds
  );
  const col2Map = new Map<number, string>();
  for (const row of col2Rows) {
    const existing = col2Map.get(row.entity_id) || '';
    col2Map.set(row.entity_id, existing + row.value);
  }

  const [reverseRows] = await db.query<any[]>(
    `
      SELECT entity_id, field_reverse_value AS value
      FROM paragraph__field_reverse
      WHERE entity_id IN (${paragraphPlaceholders}) AND deleted = 0
    `,
    uniqueParagraphIds
  );
  const reverseMap = new Map<number, boolean>();
  for (const row of reverseRows) {
    reverseMap.set(row.entity_id, Boolean(row.value));
  }

  const [ctaRows] = await db.query<any[]>(
    `
      SELECT entity_id, field_cta_title, field_cta_uri
      FROM paragraph__field_cta
      WHERE entity_id IN (${paragraphPlaceholders}) AND deleted = 0
      ORDER BY entity_id, delta ASC
    `,
    uniqueParagraphIds
  );
  const ctaMap = new Map<number, { title?: string | null; uri?: string | null }>();
  for (const row of ctaRows) {
    if (!ctaMap.has(row.entity_id)) {
      ctaMap.set(row.entity_id, {
        title: row.field_cta_title,
        uri: row.field_cta_uri,
      });
    }
  }

  const [mapRows] = await db.query<any[]>(
    `
      SELECT entity_id, field_map_target_id
      FROM paragraph__field_map
      WHERE entity_id IN (${paragraphPlaceholders}) AND deleted = 0
    `,
    uniqueParagraphIds
  );

  const paragraphFileMap = new Map<number, { url: string; filename: string; filesize: number }>();
  if (mapRows.length) {
    const mediaIds = Array.from(new Set(mapRows.map((row) => row.field_map_target_id)));
    if (mediaIds.length) {
      const mediaPlaceholders = mediaIds.map(() => '?').join(',');
      const [mediaFileRows] = await db.query<any[]>(
        `
          SELECT entity_id, field_media_file_target_id AS fid
          FROM media__field_media_file
          WHERE entity_id IN (${mediaPlaceholders}) AND deleted = 0
        `,
        mediaIds
      );

      const mediaToFile = new Map<number, number>();
      for (const row of mediaFileRows) {
        if (row.fid) {
          mediaToFile.set(row.entity_id, row.fid);
        }
      }

      const fileIds = Array.from(new Set(mediaToFile.values()));
      if (fileIds.length) {
        const filePlaceholders = fileIds.map(() => '?').join(',');
        const [fileRows] = await db.query<any[]>(
          `
            SELECT fid, filename, uri, filesize
            FROM file_managed
            WHERE fid IN (${filePlaceholders})
          `,
          fileIds
        );

        const fileInfoMap = new Map<number, { filename: string; uri: string; filesize: number }>();
        for (const row of fileRows) {
          fileInfoMap.set(row.fid, {
            filename: row.filename,
            uri: row.uri,
            filesize: row.filesize,
          });
        }

        for (const row of mapRows) {
          const fid = mediaToFile.get(row.field_map_target_id);
          if (!fid) {
            continue;
          }
          const fileInfo = fileInfoMap.get(fid);
          if (!fileInfo) {
            continue;
          }
          paragraphFileMap.set(row.entity_id, {
            url: buildMediaUrl(fileInfo.uri),
            filename: fileInfo.filename,
            filesize: fileInfo.filesize,
          });
        }
      }
    }
  }

  const mediaUuids = new Set<string>();
  const collectUuids = (html?: string | null) => {
    if (!html) {
      return;
    }
    const matches = html.match(/data-entity-uuid="([^"]+)"/g);
    if (matches) {
      for (const match of matches) {
        const uuidMatch = match.match(/data-entity-uuid="([^"]+)"/);
        if (uuidMatch) {
          mediaUuids.add(uuidMatch[1]);
        }
      }
    }
  };

  for (const colValue of col1Map.values()) {
    collectUuids(colValue);
  }
  for (const colValue of col2Map.values()) {
    collectUuids(colValue);
  }
  for (const bodyValue of bodyMap.values()) {
    collectUuids(bodyValue);
  }

  const mediaAssets = await fetchMediaAssets(db, Array.from(mediaUuids));

  const paragraphData = new Map<number, ParagraphComponent>();
  for (const paragraphId of uniqueParagraphIds) {
    const type = paragraphTypeMap.get(paragraphId);
    if (!type) {
      continue;
    }

    const rawCol1 = col1Map.get(paragraphId) ?? null;
    const rawCol2 = col2Map.get(paragraphId) ?? null;
    const rawBody = bodyMap.get(paragraphId) ?? null;

    paragraphData.set(paragraphId, {
      id: paragraphId,
      type,
      title: titleMap.get(paragraphId) ?? null,
      subtitle: subtitleMap.get(paragraphId) ?? null,
      body: replaceDrupalMedia(rawBody, mediaAssets),
      col1: replaceDrupalMedia(rawCol1, mediaAssets),
      col2: replaceDrupalMedia(rawCol2, mediaAssets),
      reverse: reverseMap.get(paragraphId) ?? false,
      cta: ctaMap.get(paragraphId) ?? null,
      file: paragraphFileMap.get(paragraphId) ?? null,
    });
  }

  for (const [nodeId, paragraphs] of paragraphOrder.entries()) {
    const htmlParts: string[] = [];
    const mapItems: string[] = [];

    const flushMapItems = () => {
      if (!mapItems.length) {
        return;
      }
      htmlParts.push(`
        <section class="paragraph paragraph-map-download">
          <h2 class="paragraph-heading">Downloadable Maps</h2>
          <ul class="map-download-list">
            ${mapItems.join('\n')}
          </ul>
        </section>
      `);
      mapItems.length = 0;
    };

    for (const paragraphId of paragraphs) {
      const paragraph = paragraphData.get(paragraphId);
      if (!paragraph) {
        continue;
      }

      if (paragraph.type === 'map_download') {
        const itemHtml = renderMapDownloadItem(paragraph);
        if (itemHtml) {
          mapItems.push(itemHtml);
        }
        continue;
      }

      flushMapItems();
      const rendered = renderParagraph(paragraph);
      if (rendered) {
        htmlParts.push(rendered);
      }
    }

    flushMapItems();
    if (htmlParts.length) {
      paragraphHtmlMap.set(nodeId, htmlParts.join('\n'));
    }
  }

  return paragraphHtmlMap;
}

async function fetchMediaAssets(
  db: mysql.Connection,
  uuids: string[]
): Promise<Map<string, MediaAsset>> {
  const assets = new Map<string, MediaAsset>();

  if (!uuids.length) {
    return assets;
  }

  const placeholders = uuids.map(() => '?').join(',');
  const [mediaRows] = await db.query<any[]>(
    `
      SELECT m.mid, m.uuid, mf.bundle, mf.name
      FROM media m
      JOIN media_field_data mf ON mf.mid = m.mid AND mf.langcode = m.langcode
      WHERE m.uuid IN (${placeholders})
    `,
    uuids
  );

  if (!mediaRows.length) {
    return assets;
  }

  const mediaIds = mediaRows.map((row) => row.mid);
  const imageIds: number[] = [];
  const fileIds: number[] = [];
  const uuidToMedia = new Map<number, { uuid: string; bundle: string; name: string | null }>();

  for (const row of mediaRows) {
    uuidToMedia.set(row.mid, {
      uuid: row.uuid,
      bundle: row.bundle,
      name: row.name ?? null,
    });
    if (row.bundle === 'image') {
      imageIds.push(row.mid);
    } else {
      fileIds.push(row.mid);
    }
  }

  const mediaImageInfo = new Map<number, { fid: number; alt?: string | null; title?: string | null }>();
  if (imageIds.length) {
    const placeholdersImages = imageIds.map(() => '?').join(',');
    const [imageRows] = await db.query<any[]>(
      `
        SELECT entity_id, field_media_image_target_id AS fid, field_media_image_alt AS alt, field_media_image_title AS title
        FROM media__field_media_image
        WHERE entity_id IN (${placeholdersImages}) AND deleted = 0
      `,
      imageIds
    );
    for (const row of imageRows) {
      mediaImageInfo.set(row.entity_id, {
        fid: row.fid,
        alt: row.alt,
        title: row.title,
      });
    }
  }

  const mediaFileInfo = new Map<number, number>();
  if (fileIds.length) {
    const placeholdersFiles = fileIds.map(() => '?').join(',');
    const [fileRows] = await db.query<any[]>(
      `
        SELECT entity_id, field_media_file_target_id AS fid
        FROM media__field_media_file
        WHERE entity_id IN (${placeholdersFiles}) AND deleted = 0
      `,
      fileIds
    );
    for (const row of fileRows) {
      mediaFileInfo.set(row.entity_id, row.fid);
    }
  }

  const fidSet = new Set<number>();
  for (const info of mediaImageInfo.values()) {
    if (info.fid) {
      fidSet.add(info.fid);
    }
  }
  for (const fid of mediaFileInfo.values()) {
    if (fid) {
      fidSet.add(fid);
    }
  }

  const fidToFile = new Map<number, { uri: string; filename: string | null }>();
  if (fidSet.size) {
    const fidList = Array.from(fidSet);
    const placeholdersFids = fidList.map(() => '?').join(',');
    const [fileRows] = await db.query<any[]>(
      `
        SELECT fid, uri, filename
        FROM file_managed
        WHERE fid IN (${placeholdersFids})
      `,
      fidList
    );
    for (const row of fileRows) {
      fidToFile.set(row.fid, {
        uri: row.uri,
        filename: row.filename ?? null,
      });
    }
  }

  for (const [mid, meta] of uuidToMedia.entries()) {
    if (meta.bundle === 'image') {
      const imageInfo = mediaImageInfo.get(mid);
      if (!imageInfo) {
        continue;
      }
      const file = fidToFile.get(imageInfo.fid);
      if (!file) {
        continue;
      }
      assets.set(meta.uuid, {
        uuid: meta.uuid,
        type: 'image',
        url: buildMediaUrl(file.uri),
        alt: imageInfo.alt,
        title: imageInfo.title || meta.name,
        filename: file.filename,
      });
    } else {
      const fid = mediaFileInfo.get(mid);
      if (!fid) {
        continue;
      }
      const file = fidToFile.get(fid);
      if (!file) {
        continue;
      }
      assets.set(meta.uuid, {
        uuid: meta.uuid,
        type: 'file',
        url: buildMediaUrl(file.uri),
        title: meta.name,
        filename: file.filename,
      });
    }
  }

  return assets;
}

function renderParagraph(paragraph: ParagraphComponent): string | null {
  switch (paragraph.type) {
    case '1_column': {
      const parts: string[] = [];
      if (paragraph.title) {
        parts.push(`<h2>${paragraph.title}</h2>`);
      }
      if (paragraph.subtitle) {
        parts.push(`<p class="paragraph-subtitle">${paragraph.subtitle}</p>`);
      }
      if (paragraph.body) {
        parts.push(`<div class="paragraph-body">${paragraph.body}</div>`);
      }

      if (!parts.length) {
        return null;
      }

      return `
        <section class="paragraph paragraph-one-column">
          ${parts.join('\n')}
        </section>
      `;
    }

    case '2_column': {
      const left = paragraph.reverse ? paragraph.col2 : paragraph.col1;
      const right = paragraph.reverse ? paragraph.col1 : paragraph.col2;
      const cta = paragraph.cta?.uri
        ? `<a class="paragraph-cta" href="${paragraph.cta.uri}" target="_blank" rel="noopener noreferrer">${paragraph.cta.title || 'Learn more'}</a>`
        : '';

      return `
        <section class="paragraph paragraph-two-column">
          ${paragraph.title ? `<h2>${paragraph.title}</h2>` : ''}
          <div class="paragraph-columns">
            <div class="paragraph-column paragraph-media">
              ${left ?? ''}
            </div>
            <div class="paragraph-column paragraph-content">
              ${right ?? ''}
              ${cta}
            </div>
          </div>
        </section>
      `;
    }

    default:
      return null;
  }
}

function renderMapDownloadItem(paragraph: ParagraphComponent): string | null {
  if (!paragraph.file) {
    return null;
  }

  const label = paragraph.title || paragraph.file.filename;
  const size = formatFileSize(paragraph.file.filesize);

  return `
    <li class="map-download-item">
      <span class="map-download-name">${label ?? 'Map'}</span>
      ${size ? `<span class="map-download-size">${size}</span>` : ''}
      <a class="map-download-link" href="${paragraph.file.url}" target="_blank" rel="noopener noreferrer">Download</a>
    </li>
  `;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

main().catch(console.error);
