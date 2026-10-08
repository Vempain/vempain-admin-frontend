import type {TaskAcceptedResponse} from "@vempain/vempain-common-frontend";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {DataResponse, DataSummaryResponse} from "../models";

interface DataSetQueryParams {
    type?: string;
    identifier_prefix?: string;
    search?: string;
}

class DataAPI extends AbstractAPI<object, DataResponse> {
    async getAllDataSets(params: DataSetQueryParams = {}): Promise<DataSummaryResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DataSummaryResponse[]>("", {params});
        return response.data;
    }

    /** Starts the publishing as a background task (HTTP 202); the finished task carries the DataResponse as result. */
    async publishDataSet(identifier: string): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<TaskAcceptedResponse>(`/${identifier}/publish`);
        return response.data;
    }
}

export const dataAPI = new DataAPI(import.meta.env.VITE_APP_API_URL, "/content-management/data");

