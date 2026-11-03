import type {AclVO} from "@vempain/vempain-auth-frontend";

/**
 * A data set without its CSV content. Data sets are ACL-bearing resources of the admin backend: `acl_id` and `acls` protect the set,
 * `creator`/`created` and `modifier`/`modified` are its audit trail (ISO strings, unlike the Dayjs fields of AbstractResponse).
 */
export interface DataSummaryResponse {
    id: number;
    acl_id: number;
    acls: AclVO[];
    locked: boolean;
    creator: number;
    created: string;
    modifier: number | null;
    modified: string | null;
    identifier: string;
    type: string;
    description: string | null;
    column_definitions: string;
    create_sql: string;
    fetch_all_sql: string;
    fetch_subset_sql: string;
    generated: string;
    /** When the data set was last released to the website, null when never */
    published: string | null;
}
