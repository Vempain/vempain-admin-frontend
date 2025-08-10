import type {CommonFileVO} from "./CommonFileVO";
import type {AbstractFileVO} from "./AbstractFileVO";

export interface VideoFileVO extends AbstractFileVO {
    common: CommonFileVO;
    length: number;
}