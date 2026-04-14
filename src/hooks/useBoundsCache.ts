import { useCallback, useRef } from "react";

export interface Bounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

interface BoundsCacheResult {
    shouldFetch: boolean;
    fetchBounds: Bounds | null;
}

const EXPAND_FACTOR = 1.5;

/**
 * Tracks the union of all previously-fetched bounding boxes.
 *
 * `check` answers whether the viewport is already covered and returns the
 * expanded fetch bounds to use if not. It does NOT mutate the cache.
 * `commit` extends the cached region to include newly-fetched bounds and
 * must be called only after the fetch succeeds — otherwise an aborted or
 * failed fetch would permanently mark a region as cached with no data.
 */
export function useBoundsCache(): {
    check: (viewport: Bounds) => BoundsCacheResult;
    commit: (bounds: Bounds) => void;
    reset: () => void;
} {
    const cachedRef = useRef<Bounds | null>(null);

    const check = useCallback((viewport: Bounds): BoundsCacheResult => {
        const cached = cachedRef.current;

        if (
            cached &&
            viewport.minLat >= cached.minLat &&
            viewport.maxLat <= cached.maxLat &&
            viewport.minLng >= cached.minLng &&
            viewport.maxLng <= cached.maxLng
        ) {
            return { shouldFetch: false, fetchBounds: null };
        }

        const latSpan = viewport.maxLat - viewport.minLat;
        const lngSpan = viewport.maxLng - viewport.minLng;
        const latPad = (latSpan * (EXPAND_FACTOR - 1)) / 2;
        const lngPad = (lngSpan * (EXPAND_FACTOR - 1)) / 2;

        const expanded: Bounds = {
            minLat: viewport.minLat - latPad,
            maxLat: viewport.maxLat + latPad,
            minLng: viewport.minLng - lngPad,
            maxLng: viewport.maxLng + lngPad,
        };

        return { shouldFetch: true, fetchBounds: expanded };
    }, []);

    const commit = useCallback((bounds: Bounds) => {
        const cached = cachedRef.current;
        if (cached) {
            cachedRef.current = {
                minLat: Math.min(cached.minLat, bounds.minLat),
                maxLat: Math.max(cached.maxLat, bounds.maxLat),
                minLng: Math.min(cached.minLng, bounds.minLng),
                maxLng: Math.max(cached.maxLng, bounds.maxLng),
            };
        } else {
            cachedRef.current = { ...bounds };
        }
    }, []);

    const reset = useCallback(() => {
        cachedRef.current = null;
    }, []);

    return { check, commit, reset };
}
