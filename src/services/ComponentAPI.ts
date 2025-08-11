import {AbstractAPI} from "./AbstractAPI";
import type {ComponentVO} from "../models";

class ComponentAPI extends AbstractAPI<ComponentVO, ComponentVO> {
}

export const componentAPI = new ComponentAPI("/content-management/components");
