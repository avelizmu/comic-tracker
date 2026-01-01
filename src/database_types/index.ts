import { SiteTable } from "./site";
import { ComicTable } from "./comic";
import { ComicAliasTable } from "./comicAlias";
import { SiteAliasTable } from "./siteAlias";
import { ComicListingTable } from "./comicListing";
import { ComicSubscriptionTable } from "./comicSubscription";

export interface Database {
    site: SiteTable;
    comic: ComicTable;
    comic_alias: ComicAliasTable;
    site_alias: SiteAliasTable;
    comic_listing: ComicListingTable;
    comic_subscription: ComicSubscriptionTable;
}