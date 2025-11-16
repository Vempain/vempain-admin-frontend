import type {WebSiteResourceResponse} from "./WebSiteResourceResponse.ts";

export interface WebSiteResourcePageResponse {
    page_number: number;
    page_size: number;
    total_pages: number;
    total_elements: number;
    items: WebSiteResourceResponse[];
}
