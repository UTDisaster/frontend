import { useEffect, useState } from "react";

import ChatDock from "@components/chat/ChatDock";
import { getChatRuntimeConfig } from "@components/chat/config";
import ControlPanel, {
    type ImageOverlayMode,
    type LocationToggleState,
} from "@components/controls/ControlPanel";
import DashboardSidebar from "@components/dashboard/DashboardSidebar";
import ErrorBoundary from "@components/ErrorBoundary";
import MapView from "@components/map/MapView";
import type { MapPolygon } from "@components/map/types";

const DEFAULT_DISASTER_ID = "disaster-123";
const API_BASE_FALLBACK = "http://127.0.0.1:8000";

/** Backend feature: Point (coordinates [lng, lat]) or Polygon. */
function featuresToMapPolygons(features: unknown[]): MapPolygon[] {
    const out: MapPolygon[] = [];
    for (let i = 0; i < features.length; i++) {
        const f = features[i] as {
            geometry?: { type?: string; coordinates?: unknown };
            properties?: Record<string, unknown>;
        };
        if (!f?.geometry) continue;
        const coords = f.geometry.coordinates;
        const props = f.properties ?? {};
        const id = String(props.house_id ?? props.object_id ?? `loc-${i}`);
        const classification = props.damage_level as string | undefined;

        if (f.geometry.type === "Point" && Array.isArray(coords) && coords.length >= 2) {
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
        } else if (f.geometry.type === "Polygon" && Array.isArray(coords) && coords.length > 0) {
            const ring = coords[0] as [number, number][];
            out.push({
                id,
                coordinates: ring.map(([lng, lat]) => [lat, lng]),
                area: props.area as string | undefined,
                classification,
                notes: props.notes as string | undefined,
            });
        }
    }
    return out;
}

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [imageOverlayMode, setImageOverlayMode] =
        useState<ImageOverlayMode>("post");
    const [imageOverlayOpacity, setImageOverlayOpacity] = useState(0.8);
    const [disableAllArtifacts, setDisableAllArtifacts] = useState(false);
    const [locationToggles, setLocationToggles] = useState<LocationToggleState>(
        {
            unknown: true,
            none: true,
            some: true,
            moderate: true,
            severe: true,
        },
    );
    const [polygons, setPolygons] = useState<MapPolygon[]>([]);

    useEffect(() => {
        const { apiBaseUrl } = getChatRuntimeConfig();
        const base = apiBaseUrl || API_BASE_FALLBACK;
        const url = `${base.replace(/\/+$/, "")}/location/${DEFAULT_DISASTER_ID}`;
        fetch(url)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
            .then((data: { features?: unknown[] }) => {
                setPolygons(featuresToMapPolygons(data.features ?? []));
            })
            .catch(() => setPolygons([]));
    }, []);

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
                        polygons={polygons}
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
            />
            <ChatDock />
        </div>
    );
};

export default Dashboard;
