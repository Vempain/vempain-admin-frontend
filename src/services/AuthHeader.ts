import {JwtResponse} from "../models/Responses";

export function authHeader() {
    const user: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

    if (user && user.token) {
        return {Authorization: "Bearer " + user.token};
    } else {
        return {};
    }
}
