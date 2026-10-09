import {UserAPI} from "@vempain/vempain-auth-frontend";

/** User accounts of the admin backend (its own user base) */
export const userAPI = new UserAPI(import.meta.env.VITE_APP_API_URL, "/content-management/users");
