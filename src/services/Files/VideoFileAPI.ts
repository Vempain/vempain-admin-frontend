import type {AudioFileVO} from "../../models";
import {AbstractAPI} from "../AbstractAPI";

class VideoFileAPI extends AbstractAPI<AudioFileVO, AudioFileVO> {
}

export const videoFileAPI = new VideoFileAPI("/content-management/file/video-files");
