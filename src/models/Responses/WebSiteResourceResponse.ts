import type {WebSiteResourceTypeEnum} from "../WebSiteResourceTypeEnum.ts";

export interface WebSiteResourceResponse {
    resource_type: WebSiteResourceTypeEnum;
    resource_id: number;
    name: string;
    path?: string;
    acl_id: number;
    file_type?: string;
}
