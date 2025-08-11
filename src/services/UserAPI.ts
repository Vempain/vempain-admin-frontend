import {AbstractAPI} from "./AbstractAPI";
import type {UserVO} from "../models";

class UserAPI extends AbstractAPI<UserVO, UserVO> {
}

export const userAPI = new UserAPI("/content-management/users");
