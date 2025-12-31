import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`model\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`main_category_id\` integer NOT NULL,
  	\`details\` text,
  	\`specification\` text,
  	\`status\` text DEFAULT 'visible',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`main_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  // Migrate data: convert old status values to new ones
  // 'published' -> 'visible', 'draft'/'archived' -> 'hidden'
  await db.run(sql`INSERT INTO \`__new_products\`("id", "model", "slug", "description", "main_category_id", "details", "specification", "status", "updated_at", "created_at") 
    SELECT 
      "id", 
      "model", 
      "slug", 
      "description", 
      "main_category_id", 
      "details", 
      "specification", 
      CASE 
        WHEN "status" = 'published' THEN 'visible'
        WHEN "status" IN ('draft', 'archived') THEN 'hidden'
        WHEN "status" IS NULL OR "status" = '' THEN 'visible'
        ELSE 'visible'
      END as "status",
      "updated_at", 
      "created_at" 
    FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_main_category_idx\` ON \`products\` (\`main_category_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`model\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`main_category_id\` integer NOT NULL,
  	\`details\` text,
  	\`specification\` text,
  	\`status\` text DEFAULT 'draft',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`main_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  // Rollback data: convert new status values back to old ones
  // 'visible' -> 'published', 'hidden' -> 'draft'
  await db.run(sql`INSERT INTO \`__new_products\`("id", "model", "slug", "description", "main_category_id", "details", "specification", "status", "updated_at", "created_at") 
    SELECT 
      "id", 
      "model", 
      "slug", 
      "description", 
      "main_category_id", 
      "details", 
      "specification", 
      CASE 
        WHEN "status" = 'visible' THEN 'published'
        WHEN "status" = 'hidden' THEN 'draft'
        WHEN "status" IS NULL OR "status" = '' THEN 'draft'
        ELSE 'draft'
      END as "status",
      "updated_at", 
      "created_at" 
    FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_main_category_idx\` ON \`products\` (\`main_category_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
}
