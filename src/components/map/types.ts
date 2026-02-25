/**
 * One polygon: array of [lat, lng] (Leaflet order).
 * id is for keys and future backend reference.
 */
export interface MapPolygon {
    id: string;
    coordinates: [number, number][];
}
