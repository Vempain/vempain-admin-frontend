import type {PagedRequest} from "@vempain/vempain-auth-frontend";

export interface GalleryPagedRequest extends PagedRequest {
    /** When true, only the galleries modified after their last release to the website are listed */
    modified_after_publish?: boolean;
}
