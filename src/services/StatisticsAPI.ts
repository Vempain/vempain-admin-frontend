import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {AdminStatisticsResponse} from "../models";

/** System wide resource statistics of the admin backend (`/admin-management/statistics`) */
class StatisticsAPI extends AbstractAPI<AdminStatisticsResponse, AdminStatisticsResponse> {
    public async getStatistics(): Promise<AdminStatisticsResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<AdminStatisticsResponse>("");
        return response.data;
    }
}

export const statisticsAPI = new StatisticsAPI(import.meta.env.VITE_APP_API_URL, "/admin-management/statistics");
