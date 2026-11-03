import type {TaskAcceptedResponse} from "@vempain/vempain-common-frontend";
import {AbstractAPI, type PagedResponse} from "@vempain/vempain-auth-frontend";
import type {DataPagedRequest, DataResponse, DataSummaryResponse} from "../models";

interface DataSetQueryParams {
    type?: string;
    identifier_prefix?: string;
    search?: string;
}

class DataAPI extends AbstractAPI<object, DataResponse> {
    /** The unpaged listing, used by the GPS embed discovery of the page editor */
    async getAllDataSets(params: DataSetQueryParams = {}): Promise<DataSummaryResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DataSummaryResponse[]>("", {params});
        return response.data;
    }

    /** POST /paged: the readable data sets filtered, sorted and paged by the backend, for the data set table */
    async findPageableDataSets(request: DataPagedRequest): Promise<PagedResponse<DataSummaryResponse>> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<PagedResponse<DataSummaryResponse>>("/paged", request);
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
