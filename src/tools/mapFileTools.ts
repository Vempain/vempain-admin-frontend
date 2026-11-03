import type {MapFileResponse} from "@vempain/vempain-common-frontend";

/** The coordinates of a map file as value + hemisphere, the way the site file lists print them */
export function formatCoordinates(file: MapFileResponse): string {
    const lat = `${Math.abs(file.latitude).toFixed(5)} ${file.latitude < 0 ? "S" : "N"}`;
    const lon = `${Math.abs(file.longitude).toFixed(5)} ${file.longitude < 0 ? "W" : "E"}`;
    return `${lat}, ${lon}`;
}

