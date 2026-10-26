import type {WebSiteResourceTypeEnum} from "../WebSiteResourceTypeEnum.ts";

/** A published page or file of the website that page content may link to (`GET /admin-management/site/links`) */
export interface InternalLinkResponse {
    /** PAGE or SITE_FILE */
    type: WebSiteResourceTypeEnum;
    /** The page title, or the file path */
    title: string;
    /** The page path on the website, or the file path below the file root (type/directory/name) */
    path: string;
}
