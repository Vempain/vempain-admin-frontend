interface StoredSession {
    token?: string;
}

/**
 * The session is persisted by `@vempain/vempain-auth-frontend` under this key in local storage ("Remember me") or in session storage (a
 * window-only login), so both are consulted, local storage first, the way the library itself reads it.
 */
export function authHeader() {
    let session: StoredSession;

    try {
        const stored = localStorage.getItem("vempainUser") ?? sessionStorage.getItem("vempainUser") ?? "{}";
        session = JSON.parse(stored) as StoredSession;
    } catch {
        session = {};
    }

    if (session.token) {
        return {Authorization: "Bearer " + session.token};
    }
    return {};
}
