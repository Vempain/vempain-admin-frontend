import {AbstractAPI, type UserVO} from "@vempain/vempain-auth-frontend";

class UserAPI extends AbstractAPI<UserVO, UserVO> {
}

export const userAPI = new UserAPI(import.meta.env.VITE_APP_API_URL, "/content-management/users");
