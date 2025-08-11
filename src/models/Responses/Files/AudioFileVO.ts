import type {CommonFileVO} from "./CommonFileVO";
import type {AbstractFileVO} from "./AbstractFileVO";

export interface AudioFileVO extends AbstractFileVO {
    common: CommonFileVO;
    length: number;
}