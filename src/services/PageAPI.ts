import type {PageVO, PublishItemRequest} from "../models";
import {AbstractAPI, type ActionVO} from "@vempain/vempain-auth-frontend";

class PageAPI extends AbstractAPI<PageVO, PageVO> {
    public async findPagesByFormId(formId: number): Promise<PageVO[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PageVO[]>("/by-form/" + formId);
        return response.data;
    }

    public async publish(request: PublishItemRequest): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.patch<ActionVO>("/publish", request);
        return response.data;
    }
    public async publishAll(params?: Record<string, any>): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<ActionVO>("/publish", {params: params});
        return response.data;
    }
}

export const pageAPI = new PageAPI(import.meta.env.VITE_APP_API_URL, "/content-management/pages");
