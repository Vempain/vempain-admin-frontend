import {authHeader} from "../../services/AuthHeader";

describe("authHeader", () => {
    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it("returns the bearer header of the stored session", () => {
        localStorage.setItem("vempainUser", JSON.stringify({token: "abc"}));
        expect(authHeader()).toEqual({Authorization: "Bearer abc"});
    });

    it("returns the bearer header of a window-only session kept in session storage", () => {
        sessionStorage.setItem("vempainUser", JSON.stringify({token: "win"}));
        expect(authHeader()).toEqual({Authorization: "Bearer win"});
    });

    it("returns an empty header without a session or token", () => {
        expect(authHeader()).toEqual({});
        localStorage.setItem("vempainUser", JSON.stringify({nick: "x"}));
        expect(authHeader()).toEqual({});
    });

    it("tolerates a corrupt stored session", () => {
        localStorage.setItem("vempainUser", "{not json");
        expect(authHeader()).toEqual({});
    });
});
