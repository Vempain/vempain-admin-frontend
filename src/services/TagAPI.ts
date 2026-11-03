import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {TagResponse} from "../models";

export const TAG_SUGGESTION_LIMIT = 20;

/**
 * The tags the admin backend knows (`GET /content-management/tags`): the tags of the published files, sent by the file backend with every
 * publish, and the tags given to pages. Read-only; a new page tag is created by saving the page.
 */
class TagAPI extends AbstractAPI<never, TagResponse> {
    public async search(text: string, limit: number = TAG_SUGGESTION_LIMIT): Promise<TagResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<TagResponse[]>("", {params: {search: text, limit}});
        return response.data;
    }
}

export const tagAPI = new TagAPI(import.meta.env.VITE_APP_API_URL, "/content-management/tags");
