import CommonFileVO from "./CommonFileVO";
import {AbstractFileVO} from "./AbstractFileVO";

export interface VideoFileVO extends AbstractFileVO {
    common: CommonFileVO;
    length: number;
}