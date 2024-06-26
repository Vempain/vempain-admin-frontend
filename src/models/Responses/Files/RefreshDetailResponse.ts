import {ActionResult} from "../../ActionResult";

export interface RefreshDetailResponse {
    result: ActionResult;
    item_id: number;
    item_type: string;
    result_description: string;
}