import {clearUserNameCache as clearSharedUserNameCache, resolveUserName as resolveSharedUserName} from "@vempain/vempain-auth-frontend";
import {userAPI} from "../services";

/** "name (nick)" of the user, or the nick when the full name is not available */
export function resolveUserName(id: number): Promise<string> {
    return resolveSharedUserName(userAPI, id);
}

/** Forgets the resolved names, so that lookups of one test do not leak into the next */
export function clearUserNameCache() {
    clearSharedUserNameCache(userAPI);
}
