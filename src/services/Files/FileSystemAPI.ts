import {DirectoryNodeResponse} from "../../models/Responses/Files/DirectoryNodeResponse";
import {AbstractAPI} from "../AbstractAPI";

class FileSystemAPI extends AbstractAPI<DirectoryNodeResponse, DirectoryNodeResponse[]> {
    public async getConvertedDirectoryTree(): Promise<DirectoryNodeResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<DirectoryNodeResponse[]>("/converted-directory");
        return response.data;
    }
}

export const fileSystemAPI = new FileSystemAPI("/content-management/file")