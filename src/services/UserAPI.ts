import {AbstractAPI} from "./AbstractAPI";
import {UserVO} from "../models/Responses";

class UserAPI extends AbstractAPI<UserVO, UserVO> {
}

export const userAPI = new UserAPI("/content-management/users");
