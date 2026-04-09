import { useEffect, useState } from "react";

import ChatDock from "@components/chat/ChatDock";
import { getChatRuntimeConfig } from "@components/chat/config";
import ControlPanel, {
    type ImageOverlayMode,
    type LocationToggleState,
} from "@components/controls/ControlPanel";
import DashboardSidebar from "@components/dashboard/DashboardSidebar";
import DisasterInfoPanel from "@components/dashboard/DisasterInfoPanel";
import ErrorBoundary from "@components/ErrorBoundary";
import MapView, { type ViewportBBox } from "@components/map/MapView";
import { normalizeClassification, type MapPolygon } from "@components/map/types";

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

const toLatLng = ([lng, lat]: [number, number]) => [lat, lng] as [number, number];

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
        const area = (props.area as string | undefined) ||
            ("feature_type" in f && f.feature_type ? String(f.feature_type) : undefined);
        const notes = (props.notes as string | undefined) || undefined;

        if (geometry.type === "Point" && Array.isArray(coords) && coords.length >= 2) {
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
    const [viewport, setViewport] = useState<ViewportBBox | null>(null);

    useEffect(() => {
        if (!viewport) return;
        const { apiBaseUrl } = getChatRuntimeConfig();
        const base = apiBaseUrl || API_BASE_FALLBACK;
        const params = new URLSearchParams({
            min_lng: String(viewport.minLng),
            min_lat: String(viewport.minLat),
            max_lng: String(viewport.maxLng),
            max_lat: String(viewport.maxLat),
            limit: "5000",
        });
        const url = `${base.replace(/\/+$/, "")}/locations?${params.toString()}`;
        const controller = new AbortController();

        fetch(url, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
            .then((data: { features?: unknown[] }) => {
                setPolygons(featuresToMapPolygons(data.features ?? []));
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error("Failed to fetch locations:", error);
                setPolygons([]);
            });

        return () => controller.abort();
    }, [viewport]);

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
                    <MapView
                        imageOverlayMode={imageOverlayMode}
                        imageOverlayOpacity={imageOverlayOpacity}
                        polygons={visiblePolygons}
                        onViewportChange={setViewport}
                        disablePolygons={disableAllArtifacts}
                    />
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
            />
            <ChatDock />
            <DisasterInfoPanel
                isOpen={isDisasterInfoOpen}
                onClose={() => setIsDisasterInfoOpen(false)}
                polygons={polygons}
            />
        </div>
    );
};

export default Dashboard;
