import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`hash\` text;`)
  await db.run(sql`CREATE INDEX \`media_hash_idx\` ON \`media\` (\`hash\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`media_hash_idx\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hash\`;`)
}
