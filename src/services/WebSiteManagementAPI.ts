import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import {
    type WebSiteAclRequest,
    type WebSiteAclResponse,
    type WebSiteAclUsersResponse,
    type WebSiteConfigurationRequest,
    type WebSiteConfigurationResponse,
    type WebSiteResourcePageResponse,
    type WebSiteResourceQueryParams,
    type WebSiteUserRequest,
    type WebSiteUserResponse
} from "../models";
import {buildResourceQuery} from "../tools";

class WebSiteManagementAPI extends AbstractAPI<WebSiteUserRequest, WebSiteUserResponse> {

    // Web site user Management
    async getAllWebUsers(): Promise<WebSiteUserResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteUserResponse[]>("/users");
        return response.data;
    }

    async getWebUserById(userId: number): Promise<WebSiteUserResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteUserResponse>(`/users/${userId}`);
        return response.data;
    }

    async createWebUser(request: WebSiteUserRequest): Promise<WebSiteUserResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<WebSiteUserResponse>("/users", request);
        return response.data;
    }

    async updateWebUser(userId: number, request: WebSiteUserRequest): Promise<WebSiteUserResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<WebSiteUserResponse>(`/users/${userId}`, request);
        return response.data;
    }

    async deleteWebUser(userId: number): Promise<void> {
        this.setAuthorizationHeader();
        await this.axiosInstance.delete(`/users/${userId}`);
    }

    async getAllWebAcls(): Promise<WebSiteAclResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteAclResponse[]>("/acls");
        return response.data;
    }

    async getWebUsersByWebAclId(aclId: number): Promise<WebSiteAclUsersResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteAclUsersResponse>(`/acls/${aclId}/users`);
        return response.data;
    }

    async getResourcesByWebUserId(userId: number): Promise<WebSiteUserResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteUserResponse>(`/users/${userId}/resources`);
        return response.data;
    }

    async createWebAcl(request: WebSiteAclRequest): Promise<WebSiteAclResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<WebSiteAclResponse>("/acls", request);
        return response.data;
    }

    async deleteWebAcl(id: number): Promise<void> {
        this.setAuthorizationHeader();
        await this.axiosInstance.delete(`/acls/${id}`);
    }

    // Web site resource Management
    async getResources(params: WebSiteResourceQueryParams): Promise<WebSiteResourcePageResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const queryString = buildResourceQuery(params);
        const response = await this.axiosInstance.get<WebSiteResourcePageResponse>(`/resources?${queryString}`);
        return response.data;
    }

    // Web site configuration management

    async getAllConfigurations(): Promise<WebSiteConfigurationResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteConfigurationResponse[]>("/config");
        return response.data;
    }

    async getConfiguration(id: number): Promise<WebSiteConfigurationResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteConfigurationResponse>("/config/" + id);
        return response.data;
    }


    async updateConfiguration(request: WebSiteConfigurationRequest): Promise<WebSiteConfigurationResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<WebSiteConfigurationResponse>("/config", request);
        return response.data;
    }

}

export const webSiteManagementAPI = new WebSiteManagementAPI(import.meta.env.VITE_APP_API_URL, "/admin-management/site");
