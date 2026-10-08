import type {RefreshDetailResponse} from "./RefreshDetailResponse";
import type {ActionResult} from "@vempain/vempain-auth-frontend";
import type {TaskAcceptedResponse} from "@vempain/vempain-common-frontend";

export interface RefreshResponse {
    result: ActionResult;
    refreshed_items: number;
    failed_items: number;
    details: RefreshDetailResponse[];
    /** Present (HTTP 202) when the refresh runs as a background task; the finished task carries the final RefreshResponse */
    task?: TaskAcceptedResponse | null;
}