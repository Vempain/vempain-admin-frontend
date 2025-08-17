import type {AbstractPermissionVO} from "@vempain/vempain-auth-frontend";
import type {SiteFileResponse} from "./SiteFileResponse.ts";

export interface GalleryVO extends AbstractPermissionVO {
    id: number;
    short_name: string;
    description: string;
    site_files: SiteFileResponse[];
}