/**
 * One polygon: array of [lat, lng] (Leaflet order).
 * id is for keys and future backend reference.
 * Optional fields for popup display (dummy data until API).
 */
export interface MapPolygon {
    id: string;
    coordinates: [number, number][];
    /** City or general area for popup. */
    area?: string;
    classification?: string;
    notes?: string;
}
