import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {ApiTokenCreatedResponse, ApiTokenNetworkResponse, ApiTokenRequest, ApiTokenResponse} from "../models";

/** Service-to-service API tokens of the admin backend (`/admin-management/api-tokens`) */
class ApiTokenAPI extends AbstractAPI<ApiTokenRequest, ApiTokenResponse> {
    public async list(): Promise<ApiTokenResponse[]> {
        return this.findAll();
    }

    /** The network the backend proposes for a new token (its private network, a configured one, or none) */
    public async defaultNetwork(): Promise<ApiTokenNetworkResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<ApiTokenNetworkResponse>("/default-network");
        return response.data;
    }

    /** Creates a token; the returned token string is shown once and can not be fetched again */
    public async createToken(request: ApiTokenRequest): Promise<ApiTokenCreatedResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<ApiTokenCreatedResponse>("", request);
        return response.data;
    }

    public async deleteToken(id: number): Promise<void> {
        this.setAuthorizationHeader();
        await this.axiosInstance.delete("/" + id);
    }
}

export const apiTokenAPI = new ApiTokenAPI(import.meta.env.VITE_APP_API_URL, "/admin-management/api-tokens");
