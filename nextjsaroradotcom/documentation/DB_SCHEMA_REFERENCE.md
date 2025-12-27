# Database Schema & Content Model Reference

The following section documents the Prisma models that underpin the migrated Drupal content, highlighting key relations, indexes, and intended usage.

---

## Prisma Models (`prisma/schema.prisma`)

### `model Node`
| Field | Type | Attributes | Description |
| ----- | ---- | ---------- | ----------- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key. |
| `type` | `String` | `@db.VarChar(50)` | Drupal node bundle (`property`, `news`, `page`, etc.). |
| `slug` | `String` | `@unique` | Clean slug derived from Drupal path alias. |
| `title` | `String` | | Node title. |
| `summary` | `String?` | | Short text used for cards/teasers. |
| `bodyHtml` | `String?` | | Full HTML body; sanitised before rendering. |
| `imageUrl` | `String?` | | Hero/teaser image URL (may be external). |
| `author` | `String?` | | Optional author name. |
| `createdAt` | `DateTime` | `@default(now())` | Publish date in Drupal. |
| `published` | `Boolean` | `@default(true)` | Visibility flag. |
| `nid` | `Int?` | | Original Drupal node ID (useful for cross-referencing). |
| `nodeTerms` | `NodeTerm[]` | | Relation to taxonomy tags. |

**Indexes**: Typically on `type`, `slug`, and `published` for fast content retrieval. Ensure migrations include these.

### `model TaxonomyTerm`
| Field | Type | Attributes | Description |
| ----- | ---- | ---------- | ----------- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key. |
| `vocabulary` | `String` | | Drupal vocabulary machine name (`property`, `news_category`, etc.). |
| `slug` | `String` | `@unique` | Term slug. |
| `name` | `String` | | Human-readable name. |
| `descriptionHtml` | `String?` | | Term description (rich text). |
| `createdAt` | `DateTime` | `@default(now())` | Timestamp. |
| `nodeTerms` | `NodeTerm[]` | | Relation back to nodes. |

### `model NodeTerm`
| Field | Type | Attributes | Description |
| ----- | ---- | ---------- | ----------- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key. |
| `nodeId` | `Int` | | Foreign key to `Node`. |
| `termId` | `Int` | | Foreign key to `TaxonomyTerm`. |
| `node` | `Node` | `@relation(fields: [nodeId], references: [id])` | Node relation. |
| `term` | `TaxonomyTerm` | `@relation(fields: [termId], references: [id])` | Term relation. |

Composite unique constraint can be added (`@@unique([nodeId, termId])`) to prevent duplicates.

### `model UrlAlias`
| Field | Type | Attributes | Description |
| ----- | ---- | ---------- | ----------- |
| `id` | `Int` | `@id @default(autoincrement())` | Primary key. |
| `sourcePath` | `String` | `@unique` | Legacy Drupal path (e.g. `/node/9`). |
| `targetType` | `String` | | `node`, `term`, or other entity types. |
| `targetId` | `Int` | | ID referencing respective table. |
| `createdAt` | `DateTime` | `@default(now())` | Timestamp. |

Used by `resolveByPath` to translate friendly URLs.

---

## Relations & Usage Patterns

1. **Node ⇄ NodeTerm ⇄ TaxonomyTerm**  
   - Many-to-many relation handled by `NodeTerm`.  
   - Common queries filter nodes by vocabulary slug (e.g., properties by category).

2. **UrlAlias**  
   - Primary mechanism for accepting legacy URLs.  
   - Example: `/property/abc` ⇒ alias table maps to `node` id 123, allowing the catch-all route to fetch the node.

3. **Term Pagination**  
   - `resolveTermBySlug` uses `NodeTerm` to fetch nodes belonging to a term with `skip`/`take` for pagination.

4. **Search (Future)**  
   - Full-text search can be implemented via Prisma `contains` queries or DB-specific features on `title`/`summary`.  
   - Consider adding indexes on `title` and `summary`.

---

## Migration & Seeding Tips

- **Initial Migration**: Use `prisma migrate dev --name init` to create base schema matching the structure above.
- **Importing Drupal Data**: Write ETL script to convert Drupal exports into Prisma `createMany` operations (ensure alias paths are normalised).
- **Versioning**: Each structural change should include a new migration file in `prisma/migrations/`.
- **Backups**: Before running destructive migrations, snapshot the database via provider console or `pg_dump`.

---

## Troubleshooting

- **Missing Nodes**: Check `UrlAlias` mapping; if `sourcePath` missing, the resolver will not find the node.
- **Duplicate Slugs**: Prisma `@unique` on `slug` prevents duplicates; fix data upstream before import.
- **Performance issues**: Add indexes for high-traffic queries (`type/published`, `slug`). Use Prisma `@@index` pragmas.

---

Maintain this schema reference alongside future migrations to keep the data model transparent for both developers and administrators.
