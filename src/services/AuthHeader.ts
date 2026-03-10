interface StoredSession {
    token?: string;
}

export function authHeader() {
    let session: StoredSession;

    try {
        session = JSON.parse(localStorage.getItem("vempainUser") || "{}") as StoredSession;
    } catch {
        session = {};
    }

    if (session.token) {
        return {Authorization: "Bearer " + session.token};
    }
    return {};
}
