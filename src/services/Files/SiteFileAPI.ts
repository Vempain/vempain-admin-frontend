import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {SiteFileResponse} from "../../models";
import type {SiteFileRequest} from "../../models/Requests/Files";

export class SiteFileAPI extends AbstractAPI<SiteFileResponse, SiteFileRequest> {
}

export const siteFileAPI = new SiteFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/site-files");
