export interface LocationResponse {
    id: number | null;
    latitude: number;
    latitude_ref: 'N' | 'S';
    longitude: number;
    longitude_ref: 'E' | 'W';
    altitude: number | null;
    direction: number | null;
    satellite_count: number | null;
    country: string | null;
    state: string | null;
    city: string | null;
    street: string | null;
    sub_location: string | null;
}
