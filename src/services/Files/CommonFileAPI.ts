import type {CommonFileVO} from "../../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class CommonFileAPI extends AbstractAPI<CommonFileVO, CommonFileVO> {
}

export const commonFileAPI = new CommonFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/common-files");
