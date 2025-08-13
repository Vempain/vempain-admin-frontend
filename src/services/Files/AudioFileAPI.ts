import type {AudioFileVO} from "../../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class AudioFileAPI extends AbstractAPI<AudioFileVO, AudioFileVO> {
}

export const audioFileAPI = new AudioFileAPI(import.meta.env.VITE_APP_API_URL, "/content-management/file/audio-files");
