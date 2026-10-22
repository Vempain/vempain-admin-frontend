import type {Dayjs} from "dayjs";
import type {AbstractResponse} from "@vempain/vempain-auth-frontend";
import type {SiteFileResponse} from "./SiteFileResponse.ts";

export interface GalleryResponse extends AbstractResponse {
    short_name: string;
    description: string;
    site_files: SiteFileResponse[];
    /** When the gallery was last released to the website, null when never */
    published: Dayjs | null;
}