import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`details_html\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`specification_html\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`details_html\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`specification_html\`;`)
}
