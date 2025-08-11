import {AbstractAPI} from "./AbstractAPI";
import type {PageVO} from "../models";

class PageAPI extends AbstractAPI<PageVO, PageVO> {
    public async findPagesByFormId(formId: number): Promise<PageVO[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PageVO[]>("/by-form/" + formId);
        return response.data;
    }
}

export const pageAPI = new PageAPI("/content-management/pages");
