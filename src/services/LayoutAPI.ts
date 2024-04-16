import {AbstractAPI} from "./AbstractAPI";
import {LayoutVO} from "../models/Responses";

class LayoutAPI extends AbstractAPI<LayoutVO, LayoutVO> {
}

export const layoutAPI = new LayoutAPI("/content-management/layouts");
