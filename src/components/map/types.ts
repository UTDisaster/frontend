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

export type ClassificationKey =
    | "unknown"
    | "none"
    | "minor"
    | "severe"
    | "destroyed";

const normalizeToken = (value?: string | null) =>
    value?.trim().toLowerCase().replace(/[_-]+/g, " ") ?? "";

export const normalizeClassification = (
    value?: string | null,
): ClassificationKey => {
    const token = normalizeToken(value);
    if (!token || ["unknown", "unclassified", "n a", "na"].includes(token)) {
        return "unknown";
    }

    if (
        [
            "none",
            "no",
            "no damage",
            "no damage observed",
            "undamaged",
            "no visible damage",
        ].includes(token)
    ) {
        return "none";
    }

    if (["minor", "some", "light", "low"].includes(token)) {
        return "minor";
    }

    if (["severe", "moderate", "major", "heavy"].includes(token)) {
        return "severe";
    }

    if (
        ["destroyed", "destroy", "complete", "total", "collapsed"].includes(
            token,
        )
    ) {
        return "destroyed";
    }

    return "unknown";
};
