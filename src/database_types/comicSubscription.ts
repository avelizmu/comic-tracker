import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface ComicSubscriptionTable {
    id: Generated<number>

    comic_listing_id: number

    last_read_chapter: string

    discord_user_id: string

    created_at: ColumnType<Date, string | undefined, never>
}

export type ComicSubscription = Selectable<ComicSubscriptionTable>
export type NewComicSubscription = Insertable<ComicSubscriptionTable>
export type UpdateComicSubscription = Updateable<ComicSubscriptionTable>