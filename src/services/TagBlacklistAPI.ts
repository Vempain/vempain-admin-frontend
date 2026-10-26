import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {TagBlacklistRequest, TagBlacklistResponse} from "../models";

/** The tags that are removed from everything published to the website (`/admin-management/tag-blacklist`) */
class TagBlacklistAPI extends AbstractAPI<TagBlacklistRequest, TagBlacklistResponse> {
    public async list(): Promise<TagBlacklistResponse[]> {
        return this.findAll();
    }

    public async add(request: TagBlacklistRequest): Promise<TagBlacklistResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.post<TagBlacklistResponse>("", request);
        return response.data;
    }

    public async remove(id: number): Promise<void> {
        this.setAuthorizationHeader();
        await this.axiosInstance.delete("/" + id);
    }
}

export const tagBlacklistAPI = new TagBlacklistAPI(import.meta.env.VITE_APP_API_URL, "/admin-management/tag-blacklist");
