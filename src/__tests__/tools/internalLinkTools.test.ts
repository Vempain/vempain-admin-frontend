import {toInternalLinkTarget, WEBSITE_FILE_ROUTE_PREFIX, WEBSITE_PAGE_ROUTE_PREFIX} from "../../tools";

describe("toInternalLinkTarget", () => {
    it("maps a published page to the website's page route", () => {
        expect(toInternalLinkTarget({type: "PAGE", title: "About us", path: "/about/team/"})).toEqual({
            href: WEBSITE_PAGE_ROUTE_PREFIX + "about/team",
            label: "About us",
            kind: "page"
        });
    });

    it("maps a published file to the website's file route and encodes every segment", () => {
        expect(toInternalLinkTarget({type: "SITE_FILE", title: "image/2024/kesä loma/a b.jpg", path: "image/2024/kesä loma/a b.jpg"})).toEqual({
            href: WEBSITE_FILE_ROUTE_PREFIX + "image/2024/kes%C3%A4%20loma/a%20b.jpg",
            label: "image/2024/kesä loma/a b.jpg",
            kind: "file"
        });
    });

    it("falls back to the path when the title is empty", () => {
        expect(toInternalLinkTarget({type: "PAGE", title: "", path: "index"}).label).toBe("index");
    });
});
