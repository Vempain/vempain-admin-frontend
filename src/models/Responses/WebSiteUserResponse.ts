import type {WebSiteResourceResponse} from "./WebSiteResourceResponse.ts";

export interface WebSiteUserResponse {
    id: number;
    username: string;
    creator: number;
    created: string;
    modifier: number | null;
    modified: string | null;
    global_permission: boolean;
    resources: WebSiteResourceResponse[]
}

