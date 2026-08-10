import type {WebSiteAclResponse, WebSiteResourceResponse, WebSiteUserResponse} from "../models";

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

export function isWebSiteResourceResponse(value: unknown): value is WebSiteResourceResponse {
    return !(typeof value !== 'object' || value === null);
}
