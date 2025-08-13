import type {LayoutVO} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class LayoutAPI extends AbstractAPI<LayoutVO, LayoutVO> {
}

export const layoutAPI = new LayoutAPI(import.meta.env.VITE_APP_API_URL, "/content-management/layouts");
