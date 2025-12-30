import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface ComicTable {
    id: Generated<number>

    name: string

    created_at: ColumnType<Date, string | undefined, never>
}

export type Comic = Selectable<ComicTable>
export type NewComic = Insertable<ComicTable>
export type UpdateComic = Updateable<ComicTable>