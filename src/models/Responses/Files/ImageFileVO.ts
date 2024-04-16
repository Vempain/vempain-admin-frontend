import CommonFileVO from "./CommonFileVO";
import {AbstractFileVO} from "./AbstractFileVO";

export interface ImageFileVO extends AbstractFileVO {
    common: CommonFileVO;
    parent_id: number;
    width: number;
    height: number;
}
