import {AbstractAPI} from "./AbstractAPI";
import type {UnitVO} from "../models";

class UnitAPI extends AbstractAPI<UnitVO, UnitVO> {
}

export const unitAPI = new UnitAPI("/content-management/units");
