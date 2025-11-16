import {type JwtResponse} from "@vempain/vempain-auth-frontend";
import Axios, {type AxiosInstance} from "axios";
import {
    type WebSiteAclRequest,
    type WebSiteAclResponse,
    type WebSiteAclUsersResponse,
    type WebSiteResourcePageResponse,
    type WebSiteResourceQueryParams,
    type WebSiteUserRequest,
    type WebSiteUserResourcesResponse,
    type WebSiteUserResponse
} from "../models";
import {buildResourceQuery} from "../tools";

class SiteWebAccessAPI {
    protected axiosInstance: AxiosInstance;

    constructor(baseURL: string, member: string) {
        this.axiosInstance = Axios.create({
            baseURL: baseURL + member
        });
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * @protected
     */
    protected setAuthorizationHeader(): void {
        const session: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

        if (session && session.token) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.token;
        }
    }

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

    async getResourcesByWebUserId(userId: number): Promise<WebSiteUserResourcesResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<WebSiteUserResourcesResponse>(`/users/${userId}/resources`);
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

    async getResources(params: WebSiteResourceQueryParams): Promise<WebSiteResourcePageResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const queryString = buildResourceQuery(params);
        const response = await this.axiosInstance.get<WebSiteResourcePageResponse>(`/resources?${queryString}`);
        return response.data;
    }
}

export const siteWebAccessApi = new SiteWebAccessAPI(import.meta.env.VITE_APP_API_URL, "/admin-management/site-access");
