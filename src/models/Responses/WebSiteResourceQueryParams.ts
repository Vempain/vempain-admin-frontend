import type {WebSiteResourceTypeEnum} from "../WebSiteResourceTypeEnum.ts";
import {FileTypeEnum} from "../FileTypeEnum.ts";

export interface WebSiteResourceQueryParams {
    type?: WebSiteResourceTypeEnum;
    file_type?: FileTypeEnum;
    query?: string;
    acl_id?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    size?: number;
}
