import type {DocumentFileVO} from "../../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class DocumentFileAPI extends AbstractAPI<DocumentFileVO, DocumentFileVO> {
}

export const documentFileAPI = new DocumentFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/document-files");
