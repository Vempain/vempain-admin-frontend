import type {CommonFileVO} from "./CommonFileVO";
import type {AbstractFileVO} from "./AbstractFileVO";

export interface DocumentFileVO extends AbstractFileVO {
    common: CommonFileVO;
    pages: number;
}