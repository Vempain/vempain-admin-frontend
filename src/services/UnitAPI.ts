import {AbstractAPI} from "./AbstractAPI";
import {UnitVO} from "../models/Responses";

class UnitAPI extends AbstractAPI<UnitVO, UnitVO> {
}

export const unitAPI = new UnitAPI("/content-management/units");
