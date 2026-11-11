import {ApiTokenAPI} from "@vempain/vempain-common-frontend";

export const apiTokenAPI = new ApiTokenAPI(import.meta.env.VITE_APP_API_URL, "/admin-management/api-tokens");
