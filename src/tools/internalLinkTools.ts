import type {InternalLinkResponse} from "../models";

/** Route of the website frontend that shows a page by its path (`toFrontendPagePath` in vempain-website-frontend) */
export const WEBSITE_PAGE_ROUTE_PREFIX = "/pages/";
/** Route through which the website serves a published file by its path below the file root */
export const WEBSITE_FILE_ROUTE_PREFIX = "/file/";

/** The shape the rich-text editor's `findInternalLinks` provider answers with */
export interface InternalLinkTarget {
    href: string;
    label: string;
    kind?: string;
}

/** Encodes every segment of a site path, dropping empty ones, so the href stays a valid relative URL */
function encodeSitePath(path: string): string {
    return path.split("/").filter(segment => segment.length > 0).map(segment => encodeURIComponent(segment)).join("/");
}

/**
 * Turns a link target of the admin backend into the href the website resolves: pages open through the page route and files through the
 * file route, both relative to the website root so the content works wherever the site is hosted.
 */
export function toInternalLinkTarget(link: InternalLinkResponse): InternalLinkTarget {
    const path = encodeSitePath(link.path ?? "");
    if (link.type === "PAGE") {
        return {href: WEBSITE_PAGE_ROUTE_PREFIX + path, label: link.title || link.path, kind: "page"};
    }
    return {href: WEBSITE_FILE_ROUTE_PREFIX + path, label: link.title || link.path, kind: "file"};
}
