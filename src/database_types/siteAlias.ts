import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface SiteAliasTable {
    id: Generated<number>

    site_id: number

    alias: string

    created_at: ColumnType<Date, string | undefined, never>
}

export type SiteAlias = Selectable<SiteAliasTable>
export type NewSiteAlias = Insertable<SiteAliasTable>
export type UpdateSiteAlias = Updateable<SiteAliasTable>