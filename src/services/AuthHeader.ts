import type {JwtResponse} from "../models";

export function authHeader() {
    const user: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

    if (user && user.token) {
        return {Authorization: "Bearer " + user.token};
    } else {
        return {};
    }
}
