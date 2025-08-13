import type {RefreshDetailResponse} from "./RefreshDetailResponse";
import type {ActionResult} from "@vempain/vempain-auth-frontend";

export interface RefreshResponse {
    result: ActionResult;
    refreshed_items: number;
    failed_items: number;
    details: RefreshDetailResponse[];
}