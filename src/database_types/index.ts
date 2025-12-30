import { SiteTable } from "./site";
import { ComicTable } from "./comic";
import { ComicAliasTable } from "./comicAlias";
import { SiteAliasTable } from "./siteAlias";
import { ComicListing } from "./comicListing";
import { ComicSubscription } from "./comicSubscription";

export interface Database {
    site: SiteTable;
    comic: ComicTable;
    comicAlias: ComicAliasTable;
    siteAlias: SiteAliasTable;
    comicListing: ComicListing;
    comicSubscription: ComicSubscription;
}