import type {CommonFileVO} from "./CommonFileVO";
import type {AbstractPermissionVO} from "@vempain/vempain-auth-frontend";

export interface GalleryVO extends AbstractPermissionVO {
    id: number;
    short_name: string;
    description: string;
    common_files: CommonFileVO[];
}