import {AbstractAPI, type PagedResponse} from "@vempain/vempain-auth-frontend";
import type {SiteFileResponse} from "../../models";
import type {SiteFileRequest} from "../../models/Requests/Files";

// AbstractAPI<REQUEST, RESPONSE>
export class SiteFileAPI extends AbstractAPI<SiteFileRequest, SiteFileResponse> {

    public async getPagedSiteFiles(params: Record<string, string | number | boolean | undefined>): Promise<PagedResponse<SiteFileResponse>> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PagedResponse<SiteFileResponse>>("", {params: params});
        return response.data;
    }
}

export const siteFileAPI = new SiteFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/site-files");
