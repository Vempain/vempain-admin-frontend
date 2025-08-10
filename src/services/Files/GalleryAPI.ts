import {type GalleryRequest, type GalleryVO, QueryDetailEnum} from "../../models";
import {AbstractAPI} from "../AbstractAPI";

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
}

export const galleryAPI = new GalleryAPI("/content-management/galleries");
