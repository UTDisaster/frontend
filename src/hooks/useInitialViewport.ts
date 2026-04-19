import { useEffect, useRef, useState } from "react";

import { loadViewport } from "../lib/viewportStorage";

const FALLBACK_CENTER: [number, number] = [33.6036, -79.0346];
const FALLBACK_ZOOM = 15;
const HOTSPOT_ZOOM = 16;
const FETCH_TIMEOUT_MS = 3000;

interface Hotspot {
    lat?: unknown;
    lng?: unknown;
}
interface HotspotsResponse {
    hotspots?: Hotspot[];
}
export interface InitialViewport {
    center: [number, number];
    zoom: number;
    ready: boolean;
}

const fallback = (ready: boolean): InitialViewport => ({
    center: FALLBACK_CENTER,
    zoom: FALLBACK_ZOOM,
    ready,
});

export function useInitialViewport(
    apiBase: string,
    disasterId: string,
): InitialViewport {
    const [state, setState] = useState<InitialViewport>(() => {
        const stored = loadViewport();
        if (stored) {
            return { center: stored.center, zoom: stored.zoom, ready: true };
        }
        return fallback(false);
    });
    const ranRef = useRef(false);

    useEffect(() => {
        if (ranRef.current || state.ready) return;
        ranRef.current = true;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const base = apiBase.replace(/\/+$/, "");
        const url = `${base}/locations/hotspots?disaster_id=${encodeURIComponent(disasterId)}&limit=1`;

        fetch(url, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
            .then((data: HotspotsResponse) => {
                const { lat, lng } = (data.hotspots?.[0] ?? {}) as Hotspot;
                if (typeof lat === "number" && typeof lng === "number") {
                    setState({ center: [lat, lng], zoom: HOTSPOT_ZOOM, ready: true });
                } else setState(fallback(true));
            })
            .catch(() => setState(fallback(true)))
            .finally(() => clearTimeout(timer));

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [apiBase, disasterId, state.ready]);

    return state;
}
