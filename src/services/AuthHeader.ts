import type {JwtResponse} from "@vempain/vempain-auth-frontend";

export function authHeader() {
    const user: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

    if (user && user.token) {
        return {Authorization: "Bearer " + user.token};
    } else {
        return {};
    }
}
