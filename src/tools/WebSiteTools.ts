import type {WebSiteAclResponse, WebSiteResourceQueryParams, WebSiteResourceResponse, WebSiteUserResponse} from "../models";

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

export function buildResourceQuery(params: WebSiteResourceQueryParams): string {
    const q = new URLSearchParams();
    if (params.type) q.set('type', params.type);
    if (params.file_type) q.set('file_type', params.file_type);
    if (params.query) q.set('query', params.query);
    if (params.acl_id != null) q.set('acl_id', String(params.acl_id));
    if (params.sort) q.set('sort', params.sort);
    if (params.direction) q.set('direction', params.direction);
    if (params.page != null) q.set('page', String(params.page));
    if (params.size != null) q.set('size', String(params.size));
    return q.toString();
}

export function isWebSiteResourceResponse(value: unknown): value is WebSiteResourceResponse {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as WebSiteResourceResponse;
    return typeof v.resource_type === 'string' && typeof v.resource_id === 'number' && typeof v.acl_id === 'number';
}
