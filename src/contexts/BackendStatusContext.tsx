/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type PolledStatus = "up" | "down" | "unknown";
export type BackendStatus = "up" | "degraded" | "down";

const POLL_INTERVAL_MS = 15000;
const FETCH_TIMEOUT_MS = 3000;

export interface BackendStatusContextValue {
    polled: PolledStatus;
    lastFetchOk: boolean;
    lastFetchError: string | null;
    lastSeen: number | null;
    reportFetchSuccess: () => void;
    reportFetchFailure: (msg: string) => void;
}

export interface UseBackendStatusResult {
    status: BackendStatus;
    lastError: string | null;
    lastSeen: number | null;
}

const BackendStatusContext = createContext<BackendStatusContextValue | null>(
    null,
);

interface BackendStatusProviderProps {
    apiBase: string;
    children: ReactNode;
}

export const BackendStatusProvider = ({
    apiBase,
    children,
}: BackendStatusProviderProps) => {
    const [polled, setPolled] = useState<PolledStatus>("unknown");
    const [lastFetchOk, setLastFetchOk] = useState<boolean>(true);
    const [lastFetchError, setLastFetchError] = useState<string | null>(null);
    const [lastSeen, setLastSeen] = useState<number | null>(null);

    const reportFetchSuccess = useCallback(() => {
        setLastFetchOk(true);
        setLastFetchError(null);
    }, []);

    const reportFetchFailure = useCallback((msg: string) => {
        setLastFetchOk(false);
        setLastFetchError(msg);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const base = apiBase.replace(/\/+$/, "");
        // Track in-flight controller and timer so cleanup can abort them.
        let activeController: AbortController | null = null;
        let activeTimer: ReturnType<typeof setTimeout> | null = null;

        const ping = async () => {
            const controller = new AbortController();
            activeController = controller;
            activeTimer = setTimeout(
                () => controller.abort(),
                FETCH_TIMEOUT_MS,
            );
            try {
                const res = await fetch(`${base}/health`, {
                    signal: controller.signal,
                });
                if (cancelled) return;
                if (res.ok) {
                    setPolled("up");
                    setLastSeen(Date.now());
                } else {
                    setPolled("down");
                }
            } catch {
                if (cancelled) return;
                setPolled("down");
            } finally {
                if (activeTimer) clearTimeout(activeTimer);
                if (activeController === controller) {
                    activeController = null;
                    activeTimer = null;
                }
            }
        };

        void ping();
        const interval = setInterval(ping, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
            if (activeTimer) clearTimeout(activeTimer);
            if (activeController) activeController.abort();
        };
    }, [apiBase]);

    const value = useMemo<BackendStatusContextValue>(
        () => ({
            polled,
            lastFetchOk,
            lastFetchError,
            lastSeen,
            reportFetchSuccess,
            reportFetchFailure,
        }),
        [
            polled,
            lastFetchOk,
            lastFetchError,
            lastSeen,
            reportFetchSuccess,
            reportFetchFailure,
        ],
    );

    return (
        <BackendStatusContext.Provider value={value}>
            {children}
        </BackendStatusContext.Provider>
    );
};

export const useBackendStatusContext = (): BackendStatusContextValue => {
    const ctx = useContext(BackendStatusContext);
    if (!ctx) {
        throw new Error(
            "useBackendStatusContext must be used within BackendStatusProvider",
        );
    }
    return ctx;
};

export const useBackendStatus = (): UseBackendStatusResult => {
    const { polled, lastFetchOk, lastFetchError, lastSeen } =
        useBackendStatusContext();

    let status: BackendStatus;
    if (polled === "down") {
        status = "down";
    } else if (polled === "up" && !lastFetchOk) {
        status = "degraded";
    } else {
        status = "up";
    }

    return { status, lastError: lastFetchError, lastSeen };
};
