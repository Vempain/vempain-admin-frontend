import type {AudioFileVO} from "../../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class VideoFileAPI extends AbstractAPI<AudioFileVO, AudioFileVO> {
}

export const videoFileAPI = new VideoFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/video-files");
