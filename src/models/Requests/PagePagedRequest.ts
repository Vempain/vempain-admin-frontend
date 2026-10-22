import type {PagedRequest} from "@vempain/vempain-auth-frontend";

export interface PagePagedRequest extends PagedRequest {
    /** When true, only the pages modified after their last release to the website are listed */
    modified_after_publish?: boolean;
}
