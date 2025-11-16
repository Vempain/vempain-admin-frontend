import type {WebSiteUserSummary} from "../WebSiteUserSummary.ts";

export interface WebSiteAclUsersResponse {
    acl_id: number;
    users: WebSiteUserSummary[];
}

