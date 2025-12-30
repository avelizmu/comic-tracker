import * as path from 'path'
import { promises as fs } from 'fs'
import SQLite from 'better-sqlite3'
import {
  Kysely,
  Migrator,
  SqliteDialect,
  FileMigrationProvider,
} from 'kysely'
import { Database } from './database_types'

async function migrateToLatest() {
    const db = new Kysely<Database>({
        dialect: new SqliteDialect({
            database: new SQLite('mangatracker.db'),
        }),
    })

    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(__dirname, 'migrations'),
        }),
    })

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((it) => {
        if(it.status === 'Success') {
            console.log(`Migration ${it.migrationName} ran successfully`)
        } else {
            console.log(`Migration ${it.migrationName} failed`)
        }
    });
    if(error) {
        console.error('Migration failed with error', error);
        process.exit(1);
    }

    await db.destroy()
}

migrateToLatest();