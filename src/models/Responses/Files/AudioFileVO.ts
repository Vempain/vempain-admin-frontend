import CommonFileVO from "./CommonFileVO";
import {AbstractFileVO} from "./AbstractFileVO";

export interface AudioFileVO extends AbstractFileVO {
    common: CommonFileVO;
    length: number;
}