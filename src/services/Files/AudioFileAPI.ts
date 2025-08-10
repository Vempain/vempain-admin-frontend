import type {AudioFileVO} from "../../models";
import {AbstractAPI} from "../AbstractAPI";

class AudioFileAPI extends AbstractAPI<AudioFileVO, AudioFileVO> {
}

export const audioFileAPI = new AudioFileAPI("/content-management/file/audio-files");
