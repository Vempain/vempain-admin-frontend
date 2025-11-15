import type {WebSiteUserResponse} from "../models/Responses/WebSiteUserResponse.ts";
import type {WebSiteAclResponse} from "../models/Responses/WebSiteAclResponse.ts";

export function isWebSiteUserResponse(value: unknown): value is WebSiteUserResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'username' in value &&
        'creator' in value &&
        'created' in value
    );
}

export function isWebSiteAclResponse(value: unknown): value is WebSiteAclResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'acl_id' in value &&
        'user_id' in value &&
        'creator' in value &&
        'created' in value
    );
}
