import type {BaseRequest} from "./BaseRequest";

export interface GalleryRequest extends BaseRequest {
    short_name: string;
    description: string;
    common_files_id: number[];
}