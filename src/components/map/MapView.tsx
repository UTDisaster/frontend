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
    onViewportSettle?: (center: [number, number], zoom: number) => void;
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

interface BoundsRect {
    maxLat: number;
    maxLng: number;
    minLat: number;
    minLng: number;
}

const toBoundsRect = (bounds: LatLngBoundsExpression): BoundsRect => {
    if (!Array.isArray(bounds)) {
        return {
            minLat: bounds.getSouth(),
            minLng: bounds.getWest(),
            maxLat: bounds.getNorth(),
            maxLng: bounds.getEast(),
        };
    }
    const [[minLat, minLng], [maxLat, maxLng]] = bounds as [
        [number, number],
        [number, number],
    ];
    return { minLat, minLng, maxLat, maxLng };
};

const fromBoundsRect = (r: BoundsRect): LatLngBoundsExpression => [
    [r.minLat, r.minLng],
    [r.maxLat, r.maxLng],
];

const clipAdjacentPair = (a: BoundsRect, b: BoundsRect): void => {
    if (
        a.minLat >= b.maxLat ||
        a.maxLat <= b.minLat ||
        a.minLng >= b.maxLng ||
        a.maxLng <= b.minLng
    ) {
        return;
    }

    const overlapLat =
        Math.min(a.maxLat, b.maxLat) - Math.max(a.minLat, b.minLat);
    const overlapLng =
        Math.min(a.maxLng, b.maxLng) - Math.max(a.minLng, b.minLng);

    if (overlapLat <= overlapLng) {
        const midLat =
            (Math.max(a.minLat, b.minLat) + Math.min(a.maxLat, b.maxLat)) / 2;
        if (a.minLat < b.minLat) {
            a.maxLat = midLat;
            b.minLat = midLat;
        } else {
            b.maxLat = midLat;
            a.minLat = midLat;
        }
    } else {
        const midLng =
            (Math.max(a.minLng, b.minLng) + Math.min(a.maxLng, b.maxLng)) / 2;
        if (a.minLng < b.minLng) {
            a.maxLng = midLng;
            b.minLng = midLng;
        } else {
            b.maxLng = midLng;
            a.minLng = midLng;
        }
    }
};

const clipOverlappingOverlays = (
    overlays: VisibleOverlay[],
): VisibleOverlay[] => {
    if (overlays.length <= 1) return overlays;

    const indexed = overlays.map((o, idx) => ({
        idx,
        rect: toBoundsRect(o.bounds),
    }));

    indexed.sort((a, b) => a.rect.minLng - b.rect.minLng);

    for (let i = 0; i < indexed.length - 1; i++) {
        for (
            let j = i + 1;
            j < indexed.length &&
            indexed[j].rect.minLng < indexed[i].rect.maxLng;
            j++
        ) {
            clipAdjacentPair(indexed[i].rect, indexed[j].rect);
        }
    }

    const result = [...overlays];
    for (const { idx, rect } of indexed) {
        result[idx] = { ...overlays[idx], bounds: fromBoundsRect(rect) };
    }
    return result;
};

const ViewportWatcher = ({
    onViewportChange,
    onViewportSettle,
}: ViewportWatcherProps) => {
    const map = useMap();

    useEffect(() => {
        onViewportChange(boundsToBbox(map.getBounds()));
    }, [map, onViewportChange]);

    const emitSettle = () => {
        if (!onViewportSettle) return;
        const c = map.getCenter();
        onViewportSettle([c.lat, c.lng], map.getZoom());
    };

    useMapEvents({
        moveend: () => {
            onViewportChange(boundsToBbox(map.getBounds()));
            emitSettle();
        },
        zoomend: () => {
            onViewportChange(boundsToBbox(map.getBounds()));
            emitSettle();
        },
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
    const map = useMap();
    const classificationKey = normalizeClassification(
        polygon.classification ?? null,
    );
    const colors = classificationColors[classificationKey];

    // Depend on polygon.id (stable per entity) rather than .coordinates
    // (fresh array reference every parent render).
    const handleClick = useCallback(() => {
        const coords = polygon.coordinates;
        if (coords.length === 0) return;
        const centroidLat =
            coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        const centroidLng =
            coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        map.flyTo([centroidLat, centroidLng], 18, { duration: 0.8 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, polygon.id]);

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
            eventHandlers={{ click: handleClick }}
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

export interface FlyTarget {
    lat: number;
    lng: number;
    zoom?: number;
}

const FlyToHandler = ({ target }: { target: FlyTarget | null }) => {
    const map = useMap();
    const lastTargetRef = useRef<FlyTarget | null>(null);

    useEffect(() => {
        if (
            !target ||
            (lastTargetRef.current &&
                lastTargetRef.current.lat === target.lat &&
                lastTargetRef.current.lng === target.lng &&
                lastTargetRef.current.zoom === target.zoom)
        ) {
            return;
        }
        lastTargetRef.current = target;
        map.flyTo([target.lat, target.lng], target.zoom ?? 17, {
            duration: 1.5,
        });
    }, [target, map]);

    return null;
};

const InvalidateSizeHandler = () => {
    const map = useMap();

    useEffect(() => {
        // Kick an initial invalidate after first paint (fixes gray-tile on mount).
        const timer = setTimeout(() => map.invalidateSize(), 100);

        // Also watch for container resizes (sidebar toggle, window resize)
        // so the fix covers the full lifecycle, not just initial mount.
        const container = map.getContainer();
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(container);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [map]);

    return null;
};

interface MapViewProps {
    imageOverlayOpacity?: number;
    imageOverlayMode?: ImageOverlayMode;
    polygons?: MapPolygon[];
    onViewportChange?: (bbox: ViewportBBox) => void;
    disablePolygons?: boolean;
    flyTarget?: FlyTarget | null;
    isLoading?: boolean;
    initialCenter?: [number, number];
    initialZoom?: number;
    onViewportSettle?: (center: [number, number], zoom: number) => void;
}

const MapView = ({
    imageOverlayOpacity = 0.8,
    imageOverlayMode = "post",
    polygons = [],
    onViewportChange,
    disablePolygons = false,
    flyTarget = null,
    isLoading = false,
    initialCenter = DEFAULT_CENTER,
    initialZoom = DEFAULT_ZOOM,
    onViewportSettle,
}: MapViewProps) => {
    const polygonsToRender = disablePolygons ? [] : polygons;
    const [bbox, setBbox] = useState<ViewportBBox | null>(null);
    const [imagePairs, setImagePairs] = useState<RenderableImagePair[]>([]);
    const [isLoadingTiles, setIsLoadingTiles] = useState(false);
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

        setIsLoadingTiles(true);
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
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingTiles(false);
                }
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

        const filtered = imagePairs
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

        return clipOverlappingOverlays(filtered);
    }, [imageOverlayMode, imagePairs]);

    const showLoadingBar = isLoading || isLoadingTiles;

    return (
        <div className="relative h-full w-full">
            {showLoadingBar && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-[1000]" />
            )}
            <MapContainer
                center={initialCenter}
                zoom={initialZoom}
                className="h-full w-full"
                scrollWheelZoom
                zoomControl={false}
            >
                <InvalidateSizeHandler />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ViewportWatcher
                    onViewportChange={handleViewportChange}
                    onViewportSettle={onViewportSettle}
                />
                <FlyToHandler target={flyTarget} />
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
        </div>
    );
};

export default MapView;
