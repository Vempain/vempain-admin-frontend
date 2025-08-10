import type {AbstractPermissionVO} from "../../AbstractPermissionVO";
import type {CommonFileVO} from "./CommonFileVO";

export interface GalleryVO extends AbstractPermissionVO {
    id: number;
    short_name: string;
    description: string;
    common_files: CommonFileVO[];
}