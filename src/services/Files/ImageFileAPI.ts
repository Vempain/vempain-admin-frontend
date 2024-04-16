import {ImageFileVO} from "../../models/Responses/Files";
import {AbstractAPI} from "../AbstractAPI";

class ImageFileAPI extends AbstractAPI<ImageFileVO, ImageFileVO> {
}

export const imageFileAPI = new ImageFileAPI("/content-management/file/image-files");
