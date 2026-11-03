/**
 * The tile server of the maps (the site file map): `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION` of the environment, OpenStreetMap by default.
 */
export const MAP_TILE_URL: string = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_ATTRIBUTION: string = import.meta.env.VITE_MAP_ATTRIBUTION
        || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
