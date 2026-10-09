import {userAPI} from "../services";

/** User display names resolved once per session; a failed lookup falls back to the numeric id */
const userNameCache = new Map<number, Promise<string>>();

/** "name (login)" of the user, or "#id" when the user cannot be looked up */
export function resolveUserName(id: number): Promise<string> {
    let pending = userNameCache.get(id);
    if (pending === undefined) {
        pending = userAPI.findById(id, null)
            .then(user => user?.name ? `${user.name} (${user.login_name})` : `#${id}`)
            .catch(() => `#${id}`);
        userNameCache.set(id, pending);
    }
    return pending;
}

/** Forgets the resolved names, so that lookups of one test do not leak into the next */
export function clearUserNameCache() {
    userNameCache.clear();
}
