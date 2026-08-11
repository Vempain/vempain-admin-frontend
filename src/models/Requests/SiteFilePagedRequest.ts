import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import type {FileTypeEnum} from "../FileTypeEnum";

export interface SiteFilePagedRequest extends PagedRequest {
    file_type: FileTypeEnum;
    filter_column?: string;
}
