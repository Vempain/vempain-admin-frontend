import {MapAPI} from "@vempain/vempain-common-frontend";

/** The clustered map of the GPS-tagged site files (MapAPI of vempain-common, hosted by the admin backend at /map) */
export const mapAPI = new MapAPI(import.meta.env.VITE_APP_API_URL, "/map");
