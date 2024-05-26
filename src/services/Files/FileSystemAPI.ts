import {DirectoryNodeResponse} from "../../models/Responses/Files/DirectoryNodeResponse";
import {AbstractAPI} from "../AbstractAPI";
import {RefreshResponse} from "../../models/Responses/Files/RefreshResponse";

class FileSystemAPI extends AbstractAPI<DirectoryNodeResponse, DirectoryNodeResponse[]> {
    public async getConvertedDirectoryTree(): Promise<DirectoryNodeResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<DirectoryNodeResponse[]>("/converted-directory");
        return response.data;
    }

    public async refreshGalleryFiles(galleryId: number): Promise<RefreshResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<RefreshResponse>(`/refresh-gallery-files/${galleryId}`);
        return response.data;
    }

    public async refreshAllGalleryFiles(): Promise<RefreshResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<RefreshResponse>("/refresh-all-gallery-files");
        return response.data;
    }
}

export const fileSystemAPI = new FileSystemAPI("/content-management/file")