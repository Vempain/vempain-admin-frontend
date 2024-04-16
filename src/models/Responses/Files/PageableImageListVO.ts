import {PageableVO} from "../PageableVO";
import {ImageFileVO} from "./ImageFileVO";

export interface PageableImageListVO {
    page: PageableVO;
    image_files: ImageFileVO[];
}
