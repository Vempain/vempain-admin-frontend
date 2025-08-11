import type {ImageFileVO} from "../../models";
import {AbstractAPI} from "../AbstractAPI";

class ImageFileAPI extends AbstractAPI<ImageFileVO, ImageFileVO> {
}

export const imageFileAPI = new ImageFileAPI("/content-management/file/image-files");
