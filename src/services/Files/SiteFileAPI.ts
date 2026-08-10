import {AbstractAPI, type PagedResponse} from "@vempain/vempain-auth-frontend";
import type {SiteFileResponse} from "../../models";
import type {SiteFilePagedRequest, SiteFileRequest} from "../../models/Requests/Files";

// AbstractAPI<REQUEST, RESPONSE>
export class SiteFileAPI extends AbstractAPI<SiteFileRequest, SiteFileResponse> {

    public async getPagedSiteFiles(request: SiteFilePagedRequest): Promise<PagedResponse<SiteFileResponse>> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<PagedResponse<SiteFileResponse>>("/paged", request);
        return response.data;
    }
}

export const siteFileAPI = new SiteFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/site-files");
