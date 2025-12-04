import {type GalleryRequest, type GalleryVO, type PublishItemRequest, QueryDetailEnum} from "../../models";
import {AbstractAPI, type ActionVO} from "@vempain/vempain-auth-frontend";
import type GalleryPageResponse from "../../models/Responses/Files/GalleryPageResponse.ts";

class GalleryAPI extends AbstractAPI<GalleryRequest, GalleryVO> {
    public async findAllByPage(params: { details: QueryDetailEnum }, pageId: number) {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<GalleryVO[]>("/page/" + pageId, {params: params});
        return response.data;
    }

    public async updatePageGalleries(pageId: number, galleries: number[]) {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<GalleryVO[]>("/page/" + pageId, galleries);
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

    public async searchGalleries(params: Record<string, any>): Promise<GalleryPageResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<GalleryPageResponse>("/search", {params: params});
        return response.data;
    }
}

export const galleryAPI = new GalleryAPI(import.meta.env.VITE_APP_API_URL, "/content-management/galleries");
