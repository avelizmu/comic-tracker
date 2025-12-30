import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface SiteTable {
    id: Generated<number>

    name: string

    url: string

    created_at: ColumnType<Date, string | undefined, never>
}

export type Site = Selectable<SiteTable>
export type NewSite = Insertable<SiteTable>
export type UpdateSite = Updateable<SiteTable>