import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    LatLngBounds,
    LatLngBoundsExpression,
    LatLngExpression,
} from "leaflet";
import {
    ImageOverlay,
    MapContainer,
    Polygon,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";

import type { ImageOverlayMode } from "@components/controls/ControlPanel";
import { normalizeClassification, type MapPolygon } from "./types";

const DEFAULT_CENTER: [number, number] = [33.6036, -79.0346];
const DEFAULT_ZOOM = 15;
const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
        /\/$/,
        "",
    ) || "http://127.0.0.1:8000";

export interface ViewportBBox {
    maxLat: number;
    maxLng: number;
    minLat: number;
    minLng: number;
}

type OverlayBounds = [[number, number], [number, number]];

interface ApiImagePair {
    image_pair_id: string;
    post_bounds?: OverlayBounds | null;
    post_url?: string | null;
    pre_bounds?: OverlayBounds | null;
    pre_url?: string | null;
}

interface ApiImagePairResponse {
    image_pairs?: ApiImagePair[];
}

interface RenderableImagePair {
    image_pair_id: string;
    post_bounds: LatLngBoundsExpression | null;
    post_url: string | null;
    pre_bounds: LatLngBoundsExpression | null;
    pre_url: string | null;
}

interface VisibleOverlay {
    bounds: LatLngBoundsExpression;
    id: string;
    url: string;
}

interface ViewportWatcherProps {
    onViewportChange: (bbox: ViewportBBox) => void;
}

const boundsToBbox = (bounds: LatLngBounds): ViewportBBox => ({
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
});

const normalizeBounds = (
    bounds?: OverlayBounds | null,
): LatLngBoundsExpression | null => {
    if (!bounds || bounds.length !== 2) return null;

    const [[minLat, minLng], [maxLat, maxLng]] = bounds;

    if (
        !Number.isFinite(minLat) ||
        !Number.isFinite(minLng) ||
        !Number.isFinite(maxLat) ||
        !Number.isFinite(maxLng)
    ) {
        return null;
    }

    return [
        [minLat, minLng],
        [maxLat, maxLng],
    ];
};

const buildImagePairQuery = (bbox: ViewportBBox): string => {
    const params = new URLSearchParams({
        min_lng: String(bbox.minLng),
        min_lat: String(bbox.minLat),
        max_lng: String(bbox.maxLng),
        max_lat: String(bbox.maxLat),
        limit: "2000",
    });

    return `${API_BASE_URL}/image-pairs?${params.toString()}`;
};

/** Sample polygons for demo; replace with API or props later. */
const SAMPLE_POLYGONS: MapPolygon[] = [
    {
        id: "area-1",
        coordinates: [
            [33.6065, -79.0415],
            [33.6115, -79.0415],
            [33.6115, -79.0335],
            [33.6065, -79.0335],
        ],
        area: "Myrtle Beach, SC",
        classification: "Major",
        notes: "Sample polygon near expected imagery extent.",
    },
];

const formatLatLng = (coords: [number, number][]): string => {
    if (coords.length === 0) return "-";
    const [lat, lng] = coords[0];
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

const classificationColors: Record<
    ReturnType<typeof normalizeClassification>,
    { stroke: string; fill: string }
> = {
    unknown: { stroke: "#475569", fill: "#94a3b8" },
    none: { stroke: "#15803d", fill: "#22c55e" },
    minor: { stroke: "#ca8a04", fill: "#facc15" },
    severe: { stroke: "#ea580c", fill: "#f97316" },
    destroyed: { stroke: "#b91c1c", fill: "#ef4444" },
};

const isSameBbox = (a: ViewportBBox | null, b: ViewportBBox) =>
    !!a &&
    a.minLat === b.minLat &&
    a.minLng === b.minLng &&
    a.maxLat === b.maxLat &&
    a.maxLng === b.maxLng;

const ViewportWatcher = ({ onViewportChange }: ViewportWatcherProps) => {
    const map = useMap();

    useEffect(() => {
        onViewportChange(boundsToBbox(map.getBounds()));
    }, [map, onViewportChange]);

    useMapEvents({
        moveend: () => onViewportChange(boundsToBbox(map.getBounds())),
        zoomend: () => onViewportChange(boundsToBbox(map.getBounds())),
    });

    return null;
};

const PolygonLayer = ({ polygons }: { polygons: MapPolygon[] }) => {
    if (polygons.length === 0) return null;

    return (
        <>
            {polygons.map((poly) => (
                <PolygonWithStyle key={poly.id} polygon={poly} />
            ))}
        </>
    );
};

const PolygonWithStyle = ({ polygon }: { polygon: MapPolygon }) => {
    const classificationKey = normalizeClassification(
        polygon.classification ?? null,
    );
    const colors = classificationColors[classificationKey];

    return (
        <Polygon
            key={polygon.id}
            positions={polygon.coordinates as LatLngExpression[]}
            pathOptions={{
                color: colors.stroke,
                fillColor: colors.fill,
                fillOpacity: 0.3,
                weight: 2,
            }}
        >
            <Popup>
                <div className="min-w-[180px] text-sm text-slate-900">
                    <p className="font-semibold">
                        {formatLatLng(polygon.coordinates)}
                    </p>
                    {polygon.area != null && (
                        <p className="text-slate-600">{polygon.area}</p>
                    )}
                    {polygon.classification != null && (
                        <p>
                            <span className="text-slate-500">
                                Classification:
                            </span>{" "}
                            {polygon.classification}
                        </p>
                    )}
                    {polygon.notes != null && (
                        <p className="mt-1 text-slate-600">{polygon.notes}</p>
                    )}
                </div>
            </Popup>
        </Polygon>
    );
};

interface MapViewProps {
    imageOverlayOpacity?: number;
    imageOverlayMode?: ImageOverlayMode;
    polygons?: MapPolygon[];
    onViewportChange?: (bbox: ViewportBBox) => void;
    disablePolygons?: boolean;
}

const MapView = ({
    imageOverlayOpacity = 0.8,
    imageOverlayMode = "post",
    polygons = [],
    onViewportChange,
    disablePolygons = false,
}: MapViewProps) => {
    const polygonsToRender = disablePolygons
        ? []
        : polygons.length > 0
            ? polygons
            : SAMPLE_POLYGONS;
    const [bbox, setBbox] = useState<ViewportBBox | null>(null);
    const [imagePairs, setImagePairs] = useState<RenderableImagePair[]>([]);
    const requestAbortRef = useRef<AbortController | null>(null);
    const bboxRef = useRef<ViewportBBox | null>(null);

    const handleViewportChange = useCallback(
        (nextBbox: ViewportBBox) => {
            if (isSameBbox(bboxRef.current, nextBbox)) return;
            bboxRef.current = nextBbox;
            setBbox(nextBbox);
            onViewportChange?.(nextBbox);
        },
        [onViewportChange],
    );

    useEffect(() => {
        if (!bbox) return;

        requestAbortRef.current?.abort();
        const controller = new AbortController();
        requestAbortRef.current = controller;

        const fetchImagePairs = async () => {
            try {
                const response = await fetch(buildImagePairQuery(bbox), {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch image pairs (${response.status})`,
                    );
                }

                const payload = (await response.json()) as ApiImagePairResponse;
                const overlays: RenderableImagePair[] = (
                    payload.image_pairs ?? []
                )
                    .map((pair) => {
                        const preBounds = normalizeBounds(pair.pre_bounds);
                        const postBounds = normalizeBounds(pair.post_bounds);

                        if (!preBounds && !postBounds) return null;

                        return {
                            image_pair_id: pair.image_pair_id,
                            pre_url: pair.pre_url ?? null,
                            post_url: pair.post_url ?? null,
                            pre_bounds: preBounds,
                            post_bounds: postBounds,
                        };
                    })
                    .filter(
                        (pair): pair is RenderableImagePair => pair !== null,
                    );

                setImagePairs(overlays);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Failed to fetch image pairs:", error);
                setImagePairs([]);
            }
        };

        void fetchImagePairs();

        return () => {
            controller.abort();
        };
    }, [bbox]);

    const visibleOverlays = useMemo(() => {
        if (imageOverlayMode === "none") {
            return [];
        }

        return imagePairs
            .map((pair) => ({
                id: pair.image_pair_id,
                bounds:
                    imageOverlayMode === "pre"
                        ? pair.pre_bounds
                        : pair.post_bounds,
                url: imageOverlayMode === "pre" ? pair.pre_url : pair.post_url,
            }))
            .filter(
                (pair): pair is VisibleOverlay =>
                    typeof pair.url === "string" &&
                    pair.url.length > 0 &&
                    pair.bounds !== null,
            );
    }, [imageOverlayMode, imagePairs]);

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ViewportWatcher onViewportChange={handleViewportChange} />
            {visibleOverlays.map((overlay) => (
                <ImageOverlay
                    key={`${overlay.id}-${overlay.url}`}
                    url={overlay.url}
                    bounds={overlay.bounds}
                    opacity={imageOverlayOpacity}
                />
            ))}
            <PolygonLayer polygons={polygonsToRender} />
        </MapContainer>
    );
};

export default MapView;
