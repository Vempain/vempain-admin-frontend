import type {PageResponse, PublishItemRequest, PublishResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class PageAPI extends AbstractAPI<PageResponse, PageResponse> {
    public async findPagesByFormId(formId: number): Promise<PageResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PageResponse[]>("/by-form/" + formId);
        return response.data;
    }

    public async publish(request: PublishItemRequest): Promise<PublishResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.patch<PublishResponse>("/publish", request);
        return response.data;
    }

    public async publishAll(params?: Record<string, string>): Promise<PublishResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PublishResponse>("/publish", {params: params});
        return response.data;
    }
}

export const pageAPI = new PageAPI(import.meta.env.VITE_APP_API_URL, "/content-management/pages");
