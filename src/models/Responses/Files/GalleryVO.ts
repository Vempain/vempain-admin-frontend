import {AbstractPermissionVO} from "../../AbstractPermissionVO";
import CommonFileVO from "./CommonFileVO";

export interface GalleryVO extends AbstractPermissionVO {
    id: number;
    short_name: string;
    description: string;
    common_files: CommonFileVO[];
}