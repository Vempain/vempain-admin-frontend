import type {ActionResult} from "@vempain/vempain-auth-frontend";

export interface RefreshDetailResponse {
    result: ActionResult;
    item_id: number;
    item_type: string;
    result_description: string;
}