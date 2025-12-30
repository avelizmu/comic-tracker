import { Database } from "./database_types";
import SQLite from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'

const dialect = new SqliteDialect({
  database: new SQLite('mangatracker.db'),
})

export const db = new Kysely<Database>({
  dialect,
})