import {AbstractAPI, type PagedResponse} from "@vempain/vempain-auth-frontend";
import type {PublishResponse, SiteFileResponse} from "../../models";
import type {SiteFilePagedRequest, SiteFilePublishRequest, SiteFileRequest} from "../../models/Requests/Files";

// AbstractAPI<REQUEST, RESPONSE>
export class SiteFileAPI extends AbstractAPI<SiteFileRequest, SiteFileResponse> {

    /** The thumbnail image of a site file (GET /site-files/{id}/thumbnail), the generated thumbnail or the image itself; 404 when it has none */
    public async getThumbnail(siteFileId: number): Promise<Blob> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<Blob>(`/${siteFileId}/thumbnail`, {responseType: "blob"});
        return response.data;
    }

    public async getPagedSiteFiles(request: SiteFilePagedRequest): Promise<PagedResponse<SiteFileResponse>> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<PagedResponse<SiteFileResponse>>("/paged", request);
        return response.data;
    }

    /**
     * Publishes the given site files to the website as a background task (202, the task is in the response); files the user may not publish are skipped
     * by the backend and counted in the task result.
     */
    public async publishSelectedFiles(request: SiteFilePublishRequest): Promise<PublishResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<PublishResponse>("/publish-selected", request);
        return response.data;
    }
}

export const siteFileAPI = new SiteFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/site-files");
