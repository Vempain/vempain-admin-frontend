import {type FileGroupListResponse, type GalleryRequest, type GalleryResponse, type PublishItemRequest, QueryDetailEnum} from "../../models";
import {AbstractAPI, type ActionVO, type PagedRequest, type PagedResponse} from "@vempain/vempain-auth-frontend";
import type {GalleryPublishRequest} from "../../models/Requests/Files";

class GalleryAPI extends AbstractAPI<GalleryRequest, GalleryResponse> {
    public async findPageableWithoutFiles(request: PagedRequest): Promise<PagedResponse<GalleryResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PagedResponse<GalleryResponse>>("paged-without-files", request);
        return response.data;
    }

    public async findPageableList(request: PagedRequest): Promise<PagedResponse<FileGroupListResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PagedResponse<FileGroupListResponse>>("paged-list", request);
        return response.data;
    }

    public async findAllByPage(params: { details: QueryDetailEnum }, pageId: number) {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<GalleryResponse[]>("/page/" + pageId, {params: params});
        return response.data;
    }

    public async findListByPage(pageId: number): Promise<FileGroupListResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<FileGroupListResponse[]>("/page/" + pageId + "/list");
        return response.data;
    }

    public async updatePageGalleries(pageId: number, galleries: number[]) {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<GalleryResponse[]>("/page/" + pageId, galleries);
        return response.data;
    }

    public async publish(request: PublishItemRequest): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.patch<ActionVO>("/publish", request);
        return response.data;
    }

    public async publishAll(params?: Record<string, string>): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<ActionVO>("/publish", {params: params});
        return response.data;
    }

    public async publishSelectedGalleries(galleryIdList: GalleryPublishRequest): Promise<ActionVO> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<ActionVO>("/publish-selected", galleryIdList);
        return response.data;
    }
}

export const galleryAPI = new GalleryAPI(import.meta.env.VITE_APP_API_URL, "/content-management/galleries");
