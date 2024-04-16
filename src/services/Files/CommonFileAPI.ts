import {AbstractAPI} from "../AbstractAPI";
import CommonFileVO from "../../models/Responses/Files/CommonFileVO";

class CommonFileAPI extends AbstractAPI<CommonFileVO, CommonFileVO> {
}

export const commonFileAPI = new CommonFileAPI("/content-management/file/common-files");
