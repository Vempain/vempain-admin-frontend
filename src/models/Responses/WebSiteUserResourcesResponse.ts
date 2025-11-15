import type {WebSiteResourceAccess} from "../WebSiteResourceAccess.ts";

export interface WebSiteUserResourcesResponse {
    user_id: number;
    username: string;
    resources: WebSiteResourceAccess[];
}

