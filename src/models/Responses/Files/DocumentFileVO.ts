import CommonFileVO from "./CommonFileVO";
import {AbstractFileVO} from "./AbstractFileVO";

export interface DocumentFileVO extends AbstractFileVO {
    common: CommonFileVO;
    pages: number;
}