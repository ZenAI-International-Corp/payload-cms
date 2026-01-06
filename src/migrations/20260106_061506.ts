import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`rma_requests_attachments\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer NOT NULL,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`rma_requests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`rma_requests_attachments_order_idx\` ON \`rma_requests_attachments\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`rma_requests_attachments_parent_id_idx\` ON \`rma_requests_attachments\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`rma_requests_attachments_file_idx\` ON \`rma_requests_attachments\` (\`file_id\`);`)
  await db.run(sql`CREATE TABLE \`rma_requests\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`first_name\` text NOT NULL,
  	\`last_name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`request_type\` text DEFAULT 'rma' NOT NULL,
  	\`on_site\` text NOT NULL,
  	\`phone_number\` text NOT NULL,
  	\`company_name\` text,
  	\`address_line1\` text NOT NULL,
  	\`address_line2\` text,
  	\`address_city\` text NOT NULL,
  	\`address_state\` text NOT NULL,
  	\`address_zip_code\` text NOT NULL,
  	\`invoice_date\` text,
  	\`invoice_number\` text,
  	\`serial_number\` text NOT NULL,
  	\`model\` text,
  	\`device_login_username\` text NOT NULL,
  	\`distributor\` text,
  	\`subject\` text NOT NULL,
  	\`problem\` text NOT NULL,
  	\`status\` text DEFAULT 'new',
  	\`admin_notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`rma_requests_updated_at_idx\` ON \`rma_requests\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`rma_requests_created_at_idx\` ON \`rma_requests\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`rma_requests_id\` integer REFERENCES rma_requests(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_rma_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`rma_requests_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`rma_requests_attachments\`;`)
  await db.run(sql`DROP TABLE \`rma_requests\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`categories_id\` integer,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "categories_id", "products_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "categories_id", "products_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
}
