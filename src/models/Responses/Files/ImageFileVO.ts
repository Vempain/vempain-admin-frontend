import type {CommonFileVO} from "./CommonFileVO";
import type {AbstractFileVO} from "./AbstractFileVO";

export interface ImageFileVO extends AbstractFileVO {
    common: CommonFileVO;
    parent_id: number;
    width: number;
    height: number;
}
