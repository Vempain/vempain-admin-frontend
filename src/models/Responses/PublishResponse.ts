import type {ActionResult} from "@vempain/vempain-auth-frontend";
import type {TaskAcceptedResponse} from "@vempain/vempain-common-frontend";

/**
 * Answer of the publish endpoints (pages, galleries). When the publishing was started right away the backend answers 202 and
 * `task` carries the background task to follow; when the publishing was scheduled for later the backend answers 200 without a task.
 */
export interface PublishResponse {
    result: ActionResult;
    message: string;
    timestamp: string;
    task?: TaskAcceptedResponse | null;
}
