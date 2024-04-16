import {DocumentFileVO} from "../../models/Responses/Files";
import {AbstractAPI} from "../AbstractAPI";

class DocumentFileAPI extends AbstractAPI<DocumentFileVO, DocumentFileVO> {
}

export const documentFileAPI = new DocumentFileAPI("/content-management/file/document-files");
