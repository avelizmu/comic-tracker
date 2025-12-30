import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface ComicAliasTable {
    id: Generated<number>

    comic_id: number

    alias: string

    created_at: ColumnType<Date, string | undefined, never>
}

export type ComicAlias = Selectable<ComicAliasTable>
export type NewComicAlias = Insertable<ComicAliasTable>
export type UpdateComicAlias = Updateable<ComicAliasTable>