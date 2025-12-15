import type {AbstractResponse} from "@vempain/vempain-auth-frontend";
import type {SiteFileResponse} from "./SiteFileResponse.ts";

export interface GalleryVO extends AbstractResponse {
    short_name: string;
    description: string;
    site_files: SiteFileResponse[];
}