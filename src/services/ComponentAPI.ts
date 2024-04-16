import {AbstractAPI} from "./AbstractAPI";
import {ComponentVO} from "../models/Responses";

class ComponentAPI extends AbstractAPI<ComponentVO, ComponentVO> {
}

export const componentAPI = new ComponentAPI("/content-management/components");
