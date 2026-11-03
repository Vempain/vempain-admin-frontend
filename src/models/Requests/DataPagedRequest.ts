import type {PagedRequest} from "@vempain/vempain-auth-frontend";

/** Paged request of the data set table (POST /content-management/data/paged) */
export interface DataPagedRequest extends PagedRequest {
    /** Only data sets of this type (exact, case insensitive), e.g. time_series */
    type?: string;
    /** When true, only the data sets modified after their last release to the website are listed */
    modified_after_publish?: boolean;
}
