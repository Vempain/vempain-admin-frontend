import {message} from "antd";
import type {AclBulkUpdateResponse} from "@vempain/vempain-auth-frontend";

/**
 * Reports the outcome of a bulk permission update of a list's selected resources: how many were updated and, when the backend left some
 * alone, that the modify privilege on a resource is needed to change its permissions. `noun` names the resources, for example "galleries".
 */
export function reportAclBulkUpdate(response: AclBulkUpdateResponse, noun: string): void {
    const updated = response.updated_acl_ids.length;
    const skipped = response.skipped_acl_ids.length;
    if (updated > 0) {
        message.success(`Permissions of ${updated} ${noun} updated`);
    }
    if (skipped > 0) {
        message.warning(`${skipped} ${noun} were skipped: the modify privilege on a resource is needed to change its permissions`);
    }
}
