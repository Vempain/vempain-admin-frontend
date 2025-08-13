import {AbstractAPI, type UnitVO} from "@vempain/vempain-auth-frontend";

class UnitAPI extends AbstractAPI<UnitVO, UnitVO> {
}

export const unitAPI = new UnitAPI(import.meta.env.VITE_APP_API_URL, "/content-management/units");
