import { useCallback, useEffect, useRef, useState } from "react";

import ChatDock, { type ChatAction } from "@components/chat/ChatDock";
import { getChatRuntimeConfig } from "@components/chat/config";
import { useBoundsCache } from "../hooks/useBoundsCache";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useInitialViewport } from "../hooks/useInitialViewport";
import { saveViewport } from "../lib/viewportStorage";
import ControlPanel, {
    type ImageOverlayMode,
    type LocationToggleState,
} from "@components/controls/ControlPanel";
import DashboardSidebar from "@components/dashboard/DashboardSidebar";
import DisasterInfoPanel from "@components/dashboard/DisasterInfoPanel";
import ErrorBoundary from "@components/ErrorBoundary";
import MapView, {
    type FlyTarget,
    type ViewportBBox,
} from "@components/map/MapView";
import {
    normalizeClassification,
    type MapPolygon,
} from "@components/map/types";

const API_BASE_FALLBACK = "http://127.0.0.1:8000";

type ApiLocationFeature = {
    geometry?: { type?: string; coordinates?: unknown } | null;
    location_uid?: string | null;
    image_pair_id?: string | null;
    classification?: string | null;
    feature_type?: string | null;
    centroid?: { lng?: number; lat?: number } | null;
};

type GeoJsonFeature = {
    geometry?: { type?: string; coordinates?: unknown } | null;
    properties?: Record<string, unknown> | null;
};

type PolygonRing = [number, number][];

interface DisasterLocation {
    imagePairId: string;
    centroid: { lat: number; lng: number };
    count: number;
}

const toLatLng = ([lng, lat]: [number, number]) =>
    [lat, lng] as [number, number];

const pushPolygon = (
    out: MapPolygon[],
    id: string,
    ring: PolygonRing,
    meta: {
        area?: string;
        classification?: string;
        notes?: string;
    },
) => {
    if (ring.length === 0) return;
    out.push({
        id,
        coordinates: ring.map(toLatLng),
        area: meta.area,
        classification: meta.classification,
        notes: meta.notes,
    });
};

/** Backend feature: Point (coordinates [lng, lat]) or Polygon/MultiPolygon. */
function featuresToMapPolygons(features: unknown[]): MapPolygon[] {
    const out: MapPolygon[] = [];
    for (let i = 0; i < features.length; i++) {
        const f = features[i] as ApiLocationFeature | GeoJsonFeature;
        const geometry = f?.geometry ?? undefined;
        if (!geometry) continue;
        const coords = geometry.coordinates;
        const props = ("properties" in f ? f.properties : null) ?? {};

        const id = String(
            ("location_uid" in f && f.location_uid) ||
                ("image_pair_id" in f && f.image_pair_id) ||
                props.house_id ||
                props.object_id ||
                `loc-${i}`,
        );
        const classification =
            ("classification" in f && f.classification) ||
            (props.damage_level as string | undefined) ||
            undefined;
        const area =
            (props.area as string | undefined) ||
            ("feature_type" in f && f.feature_type
                ? String(f.feature_type)
                : undefined);
        const notes = (props.notes as string | undefined) || undefined;

        if (
            geometry.type === "Point" &&
            Array.isArray(coords) &&
            coords.length >= 2
        ) {
            const [lng, lat] = coords as number[];
            const d = 0.0001;
            out.push({
                id,
                coordinates: [
                    [lat - d, lng - d],
                    [lat - d, lng + d],
                    [lat + d, lng + d],
                    [lat + d, lng - d],
                ],
                classification,
            });
        } else if (
            geometry.type === "Polygon" &&
            Array.isArray(coords) &&
            coords.length > 0
        ) {
            const ring = coords[0] as PolygonRing;
            pushPolygon(out, id, ring, { area, classification, notes });
        } else if (
            geometry.type === "MultiPolygon" &&
            Array.isArray(coords) &&
            coords.length > 0
        ) {
            const polygons = coords as PolygonRing[][];
            polygons.forEach((poly, polyIndex) => {
                const ring = poly?.[0];
                if (!Array.isArray(ring)) return;
                pushPolygon(out, `${id}-mp-${polyIndex + 1}`, ring, {
                    area,
                    classification,
                    notes,
                });
            });
        }
    }
    return out;
}

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDisasterInfoOpen, setIsDisasterInfoOpen] = useState(false);
    const [imageOverlayMode, setImageOverlayMode] =
        useState<ImageOverlayMode>("post");
    const [imageOverlayOpacity, setImageOverlayOpacity] = useState(0.8);
    const [disableAllArtifacts, setDisableAllArtifacts] = useState(false);
    const [locationToggles, setLocationToggles] = useState<LocationToggleState>(
        {
            destroyed: true,
            minor: true,
            unknown: true,
            none: true,
            severe: true,
        },
    );
    const [polygons, setPolygons] = useState<MapPolygon[]>([]);
    const polygonMapRef = useRef<Map<string, MapPolygon>>(new Map());
    const {
        check: checkBounds,
        commit: commitBounds,
        reset: resetBoundsCache,
    } = useBoundsCache();
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    // Cap session-accumulated polygons to bound memory and render cost.
    const MAX_POLYGONS = 20000;
    const TRIM_TO_POLYGONS = 15000;
    const [disasterLocations, setDisasterLocations] = useState<
        DisasterLocation[]
    >([]);
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
    const [viewport, setViewport] = useState<ViewportBBox | null>(null);
    const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);

    const VALID_OVERLAY_MODES: ReadonlySet<ImageOverlayMode> = new Set([
        "pre",
        "post",
        "none",
    ]);

    const handleChatAction = useCallback((action: ChatAction) => {
        if (
            action.type === "flyTo" &&
            action.lat != null &&
            action.lng != null
        ) {
            setFlyTarget({
                lat: action.lat,
                lng: action.lng,
                zoom: action.zoom,
            });
        } else if (
            action.type === "setOpacity" &&
            typeof action.value === "number"
        ) {
            const clamped = Math.max(0, Math.min(1, action.value));
            setImageOverlayOpacity(clamped);
        } else if (
            action.type === "setOverlayMode" &&
            VALID_OVERLAY_MODES.has(action.mode as ImageOverlayMode)
        ) {
            setImageOverlayMode(action.mode as ImageOverlayMode);
        } else if (action.type === "setFilters") {
            const boolOrSkip = (v: unknown): boolean | null =>
                typeof v === "boolean" ? v : null;
            setLocationToggles((previous) => {
                const next = { ...previous };
                const d = boolOrSkip(action.destroyed);
                const s = boolOrSkip(action.severe);
                const m = boolOrSkip(action.minor);
                const n = boolOrSkip(action.none);
                const u = boolOrSkip(action.unknown);
                if (d != null) next.destroyed = d;
                if (s != null) next.severe = s;
                if (m != null) next.minor = m;
                if (n != null) next.none = n;
                if (u != null) next.unknown = u;
                return next;
            });
        }
    }, []);

    useEffect(() => {
        if (!viewport) return;

        // Skip fetch if viewport is within the already-fetched region
        const { shouldFetch, fetchBounds } = checkBounds(viewport);
        if (!shouldFetch || !fetchBounds) return;

        const { apiBaseUrl } = getChatRuntimeConfig();
        const base = apiBaseUrl || API_BASE_FALLBACK;
        const params = new URLSearchParams({
            min_lng: String(fetchBounds.minLng),
            min_lat: String(fetchBounds.minLat),
            max_lng: String(fetchBounds.maxLng),
            max_lat: String(fetchBounds.maxLat),
            limit: "5000",
        });
        const url = `${base.replace(/\/+$/, "")}/locations?${params.toString()}`;
        const controller = new AbortController();

        queueMicrotask(() => setIsLoadingLocations(true));
        fetch(url, { signal: controller.signal })
            .then((r) =>
                r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)),
            )
            .then((data: { features?: unknown[] }) => {
                // Advance the bounds cache only on successful delivery.
                commitBounds(fetchBounds);
                // Merge into cache map keyed by id to deduplicate across fetches.
                const newPolygons = featuresToMapPolygons(data.features ?? []);
                for (const p of newPolygons) {
                    polygonMapRef.current.set(p.id, p);
                }
                // Trim oldest entries when over the cap (Map preserves insertion order).
                if (polygonMapRef.current.size > MAX_POLYGONS) {
                    const entries = Array.from(polygonMapRef.current.entries());
                    polygonMapRef.current = new Map(
                        entries.slice(-TRIM_TO_POLYGONS),
                    );
                }
                setPolygons(Array.from(polygonMapRef.current.values()));
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error("Failed to fetch locations:", error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingLocations(false);
            });

        return () => controller.abort();
    }, [viewport, checkBounds, commitBounds]);

    // Expose a manual invalidation for future filter-reset UX; keeps the
    // reset path in scope so the session cache can be cleared deliberately.
    void resetBoundsCache;

    useEffect(() => {
        const { apiBaseUrl } = getChatRuntimeConfig();
        const base = apiBaseUrl || API_BASE_FALLBACK;
        const params = new URLSearchParams({
            min_lng: "-80.0",
            min_lat: "33.0",
            max_lng: "-77.0",
            max_lat: "35.5",
            limit: "10000",
        });
        const url = `${base.replace(/\/+$/, "")}/locations?${params.toString()}`;
        const controller = new AbortController();

        fetch(url, { signal: controller.signal })
            .then((r) =>
                r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)),
            )
            .then((data: { features?: ApiLocationFeature[] }) => {
                const byPair = new Map<
                    string,
                    { lats: number[]; lngs: number[]; count: number }
                >();
                for (const f of data.features ?? []) {
                    const pairId = f.image_pair_id;
                    const lat = f.centroid?.lat;
                    const lng = f.centroid?.lng;
                    if (
                        !pairId ||
                        typeof lat !== "number" ||
                        typeof lng !== "number"
                    )
                        continue;
                    const entry = byPair.get(pairId) ?? {
                        lats: [],
                        lngs: [],
                        count: 0,
                    };
                    entry.lats.push(lat);
                    entry.lngs.push(lng);
                    entry.count += 1;
                    byPair.set(pairId, entry);
                }
                const locations: DisasterLocation[] = [];
                for (const [imagePairId, entry] of byPair) {
                    const avgLat =
                        entry.lats.reduce((a, b) => a + b, 0) /
                        entry.lats.length;
                    const avgLng =
                        entry.lngs.reduce((a, b) => a + b, 0) /
                        entry.lngs.length;
                    locations.push({
                        imagePairId,
                        centroid: { lat: avgLat, lng: avgLng },
                        count: entry.count,
                    });
                }
                setDisasterLocations(locations);
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error("Failed to fetch disaster locations:", error);
            });

        return () => controller.abort();
    }, []);

    const handleLocationNavigate = useCallback(
        (index: number) => {
            if (index < 0 || index >= disasterLocations.length) return;
            setCurrentLocationIndex(index);
            setFlyTarget({ ...disasterLocations[index].centroid });
        },
        [disasterLocations],
    );

    const debouncedSetViewport = useDebouncedCallback(setViewport, 300);

    const { apiBaseUrl } = getChatRuntimeConfig();
    const apiBase = apiBaseUrl || API_BASE_FALLBACK;
    const initialViewport = useInitialViewport(apiBase, "hurricane-florence");

    const debouncedSaveViewport = useDebouncedCallback(
        (center: [number, number], zoom: number) => {
            saveViewport({ center, zoom, ts: Date.now() });
        },
        2000,
    );

    const visiblePolygons = polygons.filter((polygon) => {
        const key = normalizeClassification(polygon.classification ?? null);
        return locationToggles[key];
    });

    return (
        <div className="relative min-h-screen h-full w-full overflow-hidden text-slate-950">
            <div className="absolute inset-0 z-0">
                <ErrorBoundary
                    fallback={
                        <div
                            className="h-full w-full bg-slate-300"
                            aria-hidden
                        />
                    }
                >
                    {!initialViewport.ready && (
                        <div className="h-full w-full animate-pulse bg-slate-300" />
                    )}
                    {initialViewport.ready && (
                        <MapView
                            imageOverlayMode={imageOverlayMode}
                            imageOverlayOpacity={imageOverlayOpacity}
                            isLoading={isLoadingLocations}
                            polygons={visiblePolygons}
                            onViewportChange={debouncedSetViewport}
                            disablePolygons={disableAllArtifacts}
                            flyTarget={flyTarget}
                            initialCenter={initialViewport.center}
                            initialZoom={initialViewport.zoom}
                            onViewportSettle={debouncedSaveViewport}
                        />
                    )}
                </ErrorBoundary>
            </div>

            <ControlPanel
                isSidebarOpen={isSidebarOpen}
                onMenuClick={() => setIsSidebarOpen(true)}
                imageOverlayMode={imageOverlayMode}
                onImageOverlayModeChange={setImageOverlayMode}
                imageOverlayOpacity={imageOverlayOpacity}
                onImageOverlayOpacityChange={setImageOverlayOpacity}
                disableAllArtifacts={disableAllArtifacts}
                onDisableAllArtifactsChange={setDisableAllArtifacts}
                locationToggles={locationToggles}
                onLocationToggleChange={(key, enabled) => {
                    setLocationToggles((previous) => ({
                        ...previous,
                        [key]: enabled,
                    }));
                }}
            />
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onDisasterInfoClick={() => {
                    setIsSidebarOpen(false);
                    setIsDisasterInfoOpen(true);
                }}
                polygons={polygons}
                disasterLocations={disasterLocations}
                currentLocationIndex={currentLocationIndex}
                onLocationNavigate={handleLocationNavigate}
            />
            <ChatDock viewport={viewport} onAction={handleChatAction} />
            <DisasterInfoPanel
                isOpen={isDisasterInfoOpen}
                onClose={() => setIsDisasterInfoOpen(false)}
                polygons={polygons}
            />
        </div>
    );
};

export default Dashboard;
