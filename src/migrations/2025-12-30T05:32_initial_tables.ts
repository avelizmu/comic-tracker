import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('site')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('url', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute()

    await db.schema
        .createTable('comic')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute()

    await db.schema
        .createTable('comic_alias')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('comic_id', 'integer', (col) => col.notNull().references('comic.id'))
        .addColumn('alias', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute()

    await db.schema
        .createTable('site_alias')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('site_id', 'integer', (col) => col.notNull().references('site.id'))
        .addColumn('alias', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute()

    await db.schema
        .createTable('comic_listing')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('comic_id', 'integer', (col) => col.notNull().references('comic.id'))
        .addColumn('site_id', 'integer', (col) => col.notNull().references('site.id'))
        .addColumn('url', 'text', (col) => col.notNull())
        .addColumn('latest_chapter', 'text', (col) => col.notNull())
        .addColumn('last_updated', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute()

    await db.schema
        .createTable('comic_subscription')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('comic_listing_id', 'integer', (col) => col.notNull().references('comic_listing.id'))
        .addColumn('last_read_chapter', 'text', (col) => col.notNull())
        .addColumn('discord_user_id', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('comic_subscription').execute()
    await db.schema.dropTable('comic_listing').execute()
    await db.schema.dropTable('comic_alias').execute()
    await db.schema.dropTable('comic').execute()
    await db.schema.dropTable('site').execute()
}