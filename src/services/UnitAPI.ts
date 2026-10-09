import {UnitAPI} from "@vempain/vempain-auth-frontend";

/** Units (user groups) of the admin backend (its own user base) */
export const unitAPI = new UnitAPI(import.meta.env.VITE_APP_API_URL, "/content-management/units");
