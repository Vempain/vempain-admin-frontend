import type {GalleryVO} from "./GalleryVO.ts";

export default interface GalleryPageResponse {
    page_number: number;
    page_size: number;
    total_pages: number;
    total_items: number;
    items: GalleryVO[];
}