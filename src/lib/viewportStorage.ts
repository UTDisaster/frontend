export interface StoredViewport {
    center: [number, number];
    zoom: number;
    ts: number;
}
const STORAGE_KEY = "utd.lastViewport.v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const isNum = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

export function loadViewport(): StoredViewport | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw) as Partial<StoredViewport> | null;
        if (!p || typeof p !== "object") return null;
        const { center, zoom, ts } = p;
        if (
            !Array.isArray(center) ||
            center.length !== 2 ||
            !isNum(center[0]) ||
            !isNum(center[1]) ||
            !isNum(zoom) ||
            !isNum(ts)
        )
            return null;
        if (Date.now() - ts > MAX_AGE_MS) return null;
        return { center: [center[0], center[1]], zoom, ts };
    } catch {
        /* parse error or storage denied — treat as no stored viewport */
        return null;
    }
}
export function saveViewport(v: StoredViewport): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {
        /* blocked storage — noop */
    }
}
