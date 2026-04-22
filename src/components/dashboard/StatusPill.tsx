import type { BackendStatus } from "../../contexts/BackendStatusContext";

interface StatusPillProps {
    status: BackendStatus;
    lastError: string | null;
    lastSeen: number | null;
}

const DOT_CLASSES: Record<BackendStatus, string> = {
    up: "bg-green-500",
    degraded: "bg-yellow-400",
    down: "bg-red-500",
};

const LABELS: Record<BackendStatus, string> = {
    up: "Live",
    degraded: "Data issues",
    down: "Offline",
};

const humanizeLastSeen = (lastSeen: number | null): string => {
    if (lastSeen == null) return "never";
    const deltaMs = Date.now() - lastSeen;
    const seconds = Math.max(0, Math.floor(deltaMs / 1000));
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
};

const buildTitle = (
    status: BackendStatus,
    lastError: string | null,
    lastSeen: number | null,
): string => {
    const parts: string[] = [`Backend: ${LABELS[status]}`];
    parts.push(`Last seen: ${humanizeLastSeen(lastSeen)}`);
    if (lastError) parts.push(`Last error: ${lastError}`);
    return parts.join(" \u2014 ");
};

const StatusPill = ({ status, lastError, lastSeen }: StatusPillProps) => {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full
                       border border-slate-300 bg-slate-100 px-2 py-0.5
                       text-xs font-medium text-slate-700"
            title={buildTitle(status, lastError, lastSeen)}
            aria-label={`Backend status: ${LABELS[status]}`}
        >
            <span
                className={`h-2 w-2 rounded-full ${DOT_CLASSES[status]}`}
                aria-hidden
            />
            {LABELS[status]}
        </span>
    );
};

export default StatusPill;
