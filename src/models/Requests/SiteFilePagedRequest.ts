import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import type {FileTypeEnum} from "../FileTypeEnum";

export interface SiteFilePagedRequest extends PagedRequest {
    file_type: FileTypeEnum;
    filter_column?: string;
    /** When true, only the site files modified after their last release to the website are listed */
    modified_after_publish?: boolean;
}
