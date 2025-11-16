import type {JwtResponse} from "@vempain/vempain-auth-frontend";

export function authHeader() {
    const session: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

    if (session && session.token) {
        return {Authorization: "Bearer " + session.token};
    } else {
        return {};
    }
}
