import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import type {FileTypeEnum} from "../FileTypeEnum";
import type {WebSiteResourceTypeEnum} from "../WebSiteResourceTypeEnum";

export interface WebSiteResourcePagedRequest extends PagedRequest {
    type?: WebSiteResourceTypeEnum;
    file_type?: FileTypeEnum;
    acl_id?: number;
}
