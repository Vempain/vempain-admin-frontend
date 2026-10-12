import type {PageResponse} from "../Responses/PageResponse.ts";

/**
 * Page create/update payload: the page fields plus the galleries the page links to, derived from the gallery and hero carousel embeds of
 * the body (body order). An omitted list leaves the existing links untouched, an empty list clears them.
 */
export interface PageRequest extends PageResponse {
    gallery_ids?: number[];
}
