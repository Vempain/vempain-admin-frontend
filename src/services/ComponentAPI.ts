import type {ComponentVO} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ComponentAPI extends AbstractAPI<ComponentVO, ComponentVO> {
}

export const componentAPI = new ComponentAPI(import.meta.env.VITE_APP_API_URL, "/content-management/components");
