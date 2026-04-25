import type {DataSummaryResponse} from "./DataSummaryResponse";

export interface DataResponse extends DataSummaryResponse {
    csv_data: string;
}

