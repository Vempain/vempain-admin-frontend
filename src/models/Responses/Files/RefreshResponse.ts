import {RefreshDetailResponse} from "./RefreshDetailResponse";
import {ActionResult} from "../../ActionResult";

export interface RefreshResponse {
    result: ActionResult;
    refreshed_items: number;
    failed_items: number;
    details: RefreshDetailResponse[];
}