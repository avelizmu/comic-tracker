import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface ComicListingTable {
    id: Generated<number>

    comic_id: number

    site_id: number

    url: string

    latest_chapter: string

    last_updated: ColumnType<Date, string | undefined, string | undefined>

    created_at: ColumnType<Date, string | undefined, never>
}

export type ComicListing = Selectable<ComicListingTable>
export type NewComicListing = Insertable<ComicListingTable>
export type UpdateComicListing = Updateable<ComicListingTable>