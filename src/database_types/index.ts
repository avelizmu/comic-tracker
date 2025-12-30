import { SiteTable } from "./site";
import { ComicTable } from "./comic";

export interface Database {
    site: SiteTable;
    comic: ComicTable;
}