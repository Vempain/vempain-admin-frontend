import {TaskAPI} from "@vempain/vempain-common-frontend";

/** Progress API of the admin backend's background tasks (page/gallery publishing, gallery refresh, data set publishing). */
export const taskAPI = new TaskAPI(import.meta.env.VITE_APP_API_URL, "/tasks");
