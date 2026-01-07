import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`products_related_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer NOT NULL,
  	\`relation_type\` text DEFAULT 'related' NOT NULL,
  	\`note\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_related_products_order_idx\` ON \`products_related_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_related_products_parent_id_idx\` ON \`products_related_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_related_products_product_idx\` ON \`products_related_products\` (\`product_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`products_related_products\`;`)
}
