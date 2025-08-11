import {AbstractAPI} from "./AbstractAPI";
import type {LayoutVO} from "../models";

class LayoutAPI extends AbstractAPI<LayoutVO, LayoutVO> {
}

export const layoutAPI = new LayoutAPI("/content-management/layouts");
