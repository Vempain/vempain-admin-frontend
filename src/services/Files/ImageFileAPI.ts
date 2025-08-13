import type {ImageFileVO} from "../../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ImageFileAPI extends AbstractAPI<ImageFileVO, ImageFileVO> {
}

export const imageFileAPI = new ImageFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/image-files");
