import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';

export interface MapImageOverlay {
    bounds: LatLngBoundsExpression;
    corners: LatLngExpression[];
    imageUrl: string;
}

export interface OverlayJsonAdapter {
    featureUidPath: string[];
    featureWktPath: string[];
    imageNamePath: string[];
    imageHeightPath: string[];
    imageWidthPath: string[];
    lngLatFeaturesPath: string[];
    xyFeaturesPath: string[];
}

interface OverlayControlPoint {
    lat: number;
    lng: number;
    x: number;
    y: number;
}

const DEFAULT_IMAGE_SIZE = 1024;

export const defaultOverlayJsonAdapter: OverlayJsonAdapter = {
    lngLatFeaturesPath: ['features', 'lng_lat'],
    xyFeaturesPath: ['features', 'xy'],
    featureUidPath: ['properties', 'uid'],
    featureWktPath: ['wkt'],
    imageNamePath: ['metadata', 'img_name'],
    imageWidthPath: ['metadata', 'width'],
    imageHeightPath: ['metadata', 'height'],
};

const getPathValue = (source: unknown, path: string[]): unknown => {
    return path.reduce<unknown>((current, key) => {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        return (current as Record<string, unknown>)[key];
    }, source);
};

const parseWktPoints = (wkt: string): [number, number][] => {
    const points: [number, number][] = [];
    const pairPattern = /(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s+(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)/gi;

    for (const match of wkt.matchAll(pairPattern)) {
        const first = Number.parseFloat(match[1]);
        const second = Number.parseFloat(match[2]);
        if (Number.isFinite(first) && Number.isFinite(second)) {
            points.push([first, second]);
        }
    }

    return points;
};

const polygonCentroid = (points: [number, number][]): [number, number] | null => {
    if (points.length === 0) return null;

    const [sumX, sumY] = points.reduce(
        (acc, [x, y]) => [acc[0] + x, acc[1] + y],
        [0, 0],
    );

    return [sumX / points.length, sumY / points.length];
};

const solveLinear3x3 = (
    matrix: [number, number, number][],
    values: [number, number, number],
): [number, number, number] | null => {
    const augmented = matrix.map((row, index) => [...row, values[index]]);

    for (let pivot = 0; pivot < 3; pivot += 1) {
        let pivotRow = pivot;
        for (let row = pivot + 1; row < 3; row += 1) {
            if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[pivotRow][pivot])) {
                pivotRow = row;
            }
        }

        if (Math.abs(augmented[pivotRow][pivot]) < 1e-12) {
            return null;
        }

        if (pivotRow !== pivot) {
            const temp = augmented[pivot];
            augmented[pivot] = augmented[pivotRow];
            augmented[pivotRow] = temp;
        }

        const pivotValue = augmented[pivot][pivot];
        for (let col = pivot; col < 4; col += 1) {
            augmented[pivot][col] /= pivotValue;
        }

        for (let row = 0; row < 3; row += 1) {
            if (row === pivot) continue;
            const factor = augmented[row][pivot];
            for (let col = pivot; col < 4; col += 1) {
                augmented[row][col] -= factor * augmented[pivot][col];
            }
        }
    }

    return [augmented[0][3], augmented[1][3], augmented[2][3]];
};

const solveAffineCoefficients = (
    points: OverlayControlPoint[],
    target: 'lng' | 'lat',
): [number, number, number] | null => {
    if (points.length < 3) return null;

    let sumX2 = 0;
    let sumY2 = 0;
    let sumXY = 0;
    let sumX = 0;
    let sumY = 0;
    let sumXT = 0;
    let sumYT = 0;
    let sumT = 0;

    points.forEach((point) => {
        const t = target === 'lng' ? point.lng : point.lat;
        sumX2 += point.x * point.x;
        sumY2 += point.y * point.y;
        sumXY += point.x * point.y;
        sumX += point.x;
        sumY += point.y;
        sumXT += point.x * t;
        sumYT += point.y * t;
        sumT += t;
    });

    const matrix: [number, number, number][] = [
        [sumX2, sumXY, sumX],
        [sumXY, sumY2, sumY],
        [sumX, sumY, points.length],
    ];
    const values: [number, number, number] = [sumXT, sumYT, sumT];

    return solveLinear3x3(matrix, values);
};

const extractControlPoints = (
    rawJson: unknown,
    adapter: OverlayJsonAdapter,
): OverlayControlPoint[] => {
    const lngLatFeatures = getPathValue(rawJson, adapter.lngLatFeaturesPath);
    const xyFeatures = getPathValue(rawJson, adapter.xyFeaturesPath);

    if (!Array.isArray(lngLatFeatures) || !Array.isArray(xyFeatures)) {
        return [];
    }

    const xyByUid = new Map<string, unknown>();
    xyFeatures.forEach((feature) => {
        const uid = getPathValue(feature, adapter.featureUidPath);
        if (typeof uid === 'string') {
            xyByUid.set(uid, feature);
        }
    });

    const points: OverlayControlPoint[] = [];

    lngLatFeatures.forEach((lngLatFeature) => {
        const uid = getPathValue(lngLatFeature, adapter.featureUidPath);
        if (typeof uid !== 'string') return;

        const xyFeature = xyByUid.get(uid);
        if (!xyFeature) return;

        const lngLatWkt = getPathValue(lngLatFeature, adapter.featureWktPath);
        const xyWkt = getPathValue(xyFeature, adapter.featureWktPath);
        if (typeof lngLatWkt !== 'string' || typeof xyWkt !== 'string') {
            return;
        }

        const lngLatCentroid = polygonCentroid(parseWktPoints(lngLatWkt));
        const xyCentroid = polygonCentroid(parseWktPoints(xyWkt));
        if (!lngLatCentroid || !xyCentroid) return;

        points.push({
            lng: lngLatCentroid[0],
            lat: lngLatCentroid[1],
            x: xyCentroid[0],
            y: xyCentroid[1],
        });
    });

    return points;
};

const resolveImageUrl = (
    rawJson: unknown,
    adapter: OverlayJsonAdapter,
    explicitImageUrl?: string,
): string | null => {
    if (explicitImageUrl) return explicitImageUrl;

    const imageName = getPathValue(rawJson, adapter.imageNamePath);
    if (typeof imageName !== 'string' || imageName.length === 0) {
        return null;
    }

    return imageName.startsWith('/') ? imageName : `/${imageName}`;
};

const toNumberOrFallback = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

export const buildImageOverlayFromJson = (
    rawJson: unknown,
    adapter: OverlayJsonAdapter,
    explicitImageUrl?: string,
): MapImageOverlay | null => {
    const imageUrl = resolveImageUrl(rawJson, adapter, explicitImageUrl);
    if (!imageUrl) return null;

    const controlPoints = extractControlPoints(rawJson, adapter);
    const lngCoefficients = solveAffineCoefficients(controlPoints, 'lng');
    const latCoefficients = solveAffineCoefficients(controlPoints, 'lat');

    if (!lngCoefficients || !latCoefficients) {
        return null;
    }

    const width = toNumberOrFallback(
        getPathValue(rawJson, adapter.imageWidthPath),
        DEFAULT_IMAGE_SIZE,
    );
    const height = toNumberOrFallback(
        getPathValue(rawJson, adapter.imageHeightPath),
        DEFAULT_IMAGE_SIZE,
    );

    const cornersXY: [number, number][] = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
    ];

    const corners = cornersXY.map(([x, y]) => {
        const lng = lngCoefficients[0] * x + lngCoefficients[1] * y + lngCoefficients[2];
        const lat = latCoefficients[0] * x + latCoefficients[1] * y + latCoefficients[2];
        return [lat, lng] as [number, number];
    });

    const lats = corners.map((corner) => corner[0]);
    const lngs = corners.map((corner) => corner[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
        imageUrl,
        corners,
        bounds: [
            [minLat, minLng],
            [maxLat, maxLng],
        ],
    };
};

export const loadImageOverlay = async ({
    adapter = defaultOverlayJsonAdapter,
    dataUrl,
    imageUrl,
}: {
    adapter?: OverlayJsonAdapter;
    dataUrl: string;
    imageUrl?: string;
}): Promise<MapImageOverlay | null> => {
    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error(`Failed to load overlay metadata (${response.status})`);
    }

    const rawJson = (await response.json()) as unknown;
    return buildImageOverlayFromJson(rawJson, adapter, imageUrl);
};
