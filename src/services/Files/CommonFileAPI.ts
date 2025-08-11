import {AbstractAPI} from "../AbstractAPI";
import type {CommonFileVO} from "../../models";

class CommonFileAPI extends AbstractAPI<CommonFileVO, CommonFileVO> {
}

export const commonFileAPI = new CommonFileAPI("/content-management/file/common-files");
