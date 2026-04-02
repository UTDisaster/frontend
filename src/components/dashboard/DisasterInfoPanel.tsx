import { X } from "lucide-react";

import {
    normalizeClassification,
    type ClassificationKey,
    type MapPolygon,
} from "@components/map/types";

interface DisasterInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    polygons: MapPolygon[];
}

const classificationLabels: Record<ClassificationKey, string> = {
    destroyed: "Destroyed",
    severe: "Severe",
    minor: "Minor",
    none: "No Damage",
    unknown: "Unknown",
};

const classificationColors: Record<ClassificationKey, string> = {
    destroyed: "bg-red-500",
    severe: "bg-orange-500",
    minor: "bg-yellow-400",
    none: "bg-green-500",
    unknown: "bg-slate-400",
};

const computeStats = (polygons: MapPolygon[]) => {
    const counts: Record<ClassificationKey, number> = {
        destroyed: 0,
        severe: 0,
        minor: 0,
        none: 0,
        unknown: 0,
    };

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const poly of polygons) {
        const key = normalizeClassification(poly.classification ?? null);
        counts[key] += 1;

        for (const [lat, lng] of poly.coordinates) {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        }
    }

    const hasBounds = Number.isFinite(minLat);

    return { counts, bounds: hasBounds ? { minLat, maxLat, minLng, maxLng } : null };
};

const DisasterInfoPanel = ({
    isOpen,
    onClose,
    polygons,
}: DisasterInfoPanelProps) => {
    if (!isOpen) return null;

    const { counts, bounds } = computeStats(polygons);
    const total = polygons.length;

    return (
        <>
            <button
                type="button"
                aria-label="Close disaster info"
                className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[90vw]
                           -translate-x-1/2 -translate-y-1/2
                           rounded-2xl border border-white/80 bg-white/95
                           shadow-2xl backdrop-blur-md"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-900">
                        Disaster Information
                    </h2>
                    <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-lg
                                   text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    <section>
                        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Description
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-700">
                            Hurricane damage assessment for the Myrtle Beach,
                            South Carolina region. Satellite imagery and
                            location data are used to classify structural damage
                            across the affected area.
                        </p>
                    </section>

                    {bounds && (
                        <section>
                            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                                Geographic Area
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700">
                                <span>
                                    <span className="text-slate-500">N:</span>{" "}
                                    {bounds.maxLat.toFixed(4)}
                                </span>
                                <span>
                                    <span className="text-slate-500">S:</span>{" "}
                                    {bounds.minLat.toFixed(4)}
                                </span>
                                <span>
                                    <span className="text-slate-500">E:</span>{" "}
                                    {bounds.maxLng.toFixed(4)}
                                </span>
                                <span>
                                    <span className="text-slate-500">W:</span>{" "}
                                    {bounds.minLng.toFixed(4)}
                                </span>
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Damage Classification ({total} locations)
                        </h3>
                        <div className="space-y-2">
                            {(
                                Object.keys(counts) as ClassificationKey[]
                            ).map((key) => {
                                const count = counts[key];
                                const pct =
                                    total > 0
                                        ? Math.round((count / total) * 100)
                                        : 0;
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <span
                                            className={`h-3 w-3 rounded-full ${classificationColors[key]}`}
                                        />
                                        <span className="w-24 text-sm font-medium text-slate-700">
                                            {classificationLabels[key]}
                                        </span>
                                        <div className="flex-1 rounded-full bg-slate-100 h-2">
                                            <div
                                                className={`h-2 rounded-full ${classificationColors[key]}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-14 text-right text-xs font-semibold text-slate-500">
                                            {count} ({pct}%)
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default DisasterInfoPanel;
