import type {BaseRequest} from "./BaseRequest";

export interface GalleryRequest extends BaseRequest {
    short_name: string;
    description: string;
    site_files_id: number[];
}