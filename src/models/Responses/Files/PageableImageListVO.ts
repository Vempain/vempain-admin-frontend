import type {PageableVO} from "../PageableVO";
import type {ImageFileVO} from "./ImageFileVO";

export interface PageableImageListVO {
    page: PageableVO;
    image_files: ImageFileVO[];
}
