import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Info,
    MapPin,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
    normalizeClassification,
    type ClassificationKey,
    type MapPolygon,
} from "@components/map/types";
import { DISASTERS } from "../../data/disasters";

interface DisasterLocation {
    imagePairId: string;
    centroid: { lat: number; lng: number };
    count: number;
}

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onDisasterInfoClick?: () => void;
    polygons?: MapPolygon[];
    disasterLocations?: DisasterLocation[];
    currentLocationIndex?: number;
    onLocationNavigate?: (index: number) => void;
    selectedDisasterId: string;
    onDisasterChange: (id: string) => void;
}

const CLASSIFICATION_ORDER: ClassificationKey[] = [
    "destroyed",
    "severe",
    "minor",
    "none",
    "unknown",
];

const classificationLabels: Record<ClassificationKey, string> = {
    destroyed: "Destroyed",
    severe: "Severe",
    minor: "Minor",
    none: "No Damage",
    unknown: "Unknown",
};

const classificationDots: Record<ClassificationKey, string> = {
    destroyed: "bg-red-500",
    severe: "bg-orange-500",
    minor: "bg-yellow-400",
    none: "bg-green-500",
    unknown: "bg-slate-400",
};

const countByClassification = (polygons: MapPolygon[]) => {
    const counts: Record<ClassificationKey, number> = {
        destroyed: 0,
        severe: 0,
        minor: 0,
        none: 0,
        unknown: 0,
    };
    for (const p of polygons) {
        counts[normalizeClassification(p.classification ?? null)] += 1;
    }
    return counts;
};

const DashboardSidebar = ({
    isOpen,
    onClose,
    onDisasterInfoClick,
    polygons = [],
    disasterLocations = [],
    currentLocationIndex = 0,
    onLocationNavigate,
    selectedDisasterId,
    onDisasterChange,
}: DashboardSidebarProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isDropdownOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isDropdownOpen]);

    const counts = useMemo(() => countByClassification(polygons), [polygons]);

    if (!isOpen) return null;

    const selected =
        DISASTERS.find((d) => d.id === selectedDisasterId) ?? DISASTERS[0];

    return (
        <>
            <button
                type="button"
                aria-label="Close sidebar"
                className="absolute inset-0 z-20 bg-slate-950/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside
                className="absolute left-0 top-0 z-30 flex h-full w-72
                           flex-col border-r border-white/80 bg-white/90
                           shadow-xl backdrop-blur-md"
            >
                <div className="flex h-14 items-center justify-between border-b border-slate-900/10 px-4">
                    <div className="flex items-center gap-2">
                        <p className="font-display text-sm font-bold text-slate-900">
                            Menu
                        </p>
                    </div>
                    <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-lg
                                   bg-slate-900/10 text-slate-900
                                   transition hover:bg-slate-900/20"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Disaster selector */}
                    <div
                        ref={dropdownRef}
                        className="border-b border-slate-200 px-4 py-3"
                    >
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Disaster
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-lg
                                           border border-slate-300 bg-white px-3 py-2
                                           text-left text-sm font-medium text-slate-900
                                           transition hover:border-slate-400"
                                onClick={() => setIsDropdownOpen((o) => !o)}
                                aria-expanded={isDropdownOpen}
                                aria-haspopup="listbox"
                                aria-controls="disaster-listbox"
                            >
                                <span className="truncate">
                                    {selected.name}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-slate-500 transition ${
                                        isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {isDropdownOpen && (
                                <ul
                                    id="disaster-listbox"
                                    role="listbox"
                                    className="absolute left-0 right-0 top-full z-10 mt-1
                                               rounded-lg border border-slate-200 bg-white
                                               py-1 shadow-lg"
                                >
                                    {DISASTERS.map((d) => (
                                        <li
                                            key={d.id}
                                            role="option"
                                            aria-selected={
                                                d.id === selectedDisasterId
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={`w-full px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${
                                                    d.id === selectedDisasterId
                                                        ? "font-semibold text-blue-600"
                                                        : "text-slate-700"
                                                }`}
                                                onClick={() => {
                                                    onDisasterChange(d.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {d.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="border-b border-slate-200 px-4 py-3">
                        <ul className="space-y-1">
                            <li>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg
                                               px-3 py-2 text-left text-sm font-medium text-slate-900
                                               transition hover:bg-slate-100"
                                    onClick={onClose}
                                >
                                    <MapPin className="h-4 w-4 text-slate-600" />
                                    Map
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg
                                               px-3 py-2 text-left text-sm font-medium text-slate-900
                                               transition hover:bg-slate-100"
                                    onClick={onDisasterInfoClick}
                                >
                                    <Info className="h-4 w-4 text-slate-600" />
                                    Disaster Info
                                </button>
                            </li>
                        </ul>
                    </nav>

                    {/* Location navigation */}
                    {disasterLocations.length > 0 && (
                        <div className="border-b border-slate-200 px-4 py-3">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                Locations ({disasterLocations.length} tiles)
                            </h3>
                            <div className="mb-2 flex items-center justify-between">
                                <button
                                    type="button"
                                    className="grid h-7 w-7 place-items-center rounded-lg
                                               text-slate-600 transition hover:bg-slate-100
                                               disabled:opacity-40 disabled:pointer-events-none"
                                    disabled={currentLocationIndex <= 0}
                                    onClick={() =>
                                        onLocationNavigate?.(
                                            currentLocationIndex - 1,
                                        )
                                    }
                                    aria-label="Previous location"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-medium text-slate-700">
                                    {currentLocationIndex + 1} /{" "}
                                    {disasterLocations.length}
                                </span>
                                <button
                                    type="button"
                                    className="grid h-7 w-7 place-items-center rounded-lg
                                               text-slate-600 transition hover:bg-slate-100
                                               disabled:opacity-40 disabled:pointer-events-none"
                                    disabled={
                                        currentLocationIndex >=
                                        disasterLocations.length - 1
                                    }
                                    onClick={() =>
                                        onLocationNavigate?.(
                                            currentLocationIndex + 1,
                                        )
                                    }
                                    aria-label="Next location"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                                {disasterLocations.map((loc, i) => (
                                    <li key={loc.imagePairId}>
                                        <button
                                            type="button"
                                            className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
                                                i === currentLocationIndex
                                                    ? "bg-blue-50 font-semibold text-blue-700"
                                                    : "text-slate-700 hover:bg-slate-100"
                                            }`}
                                            onClick={() =>
                                                onLocationNavigate?.(i)
                                            }
                                        >
                                            Tile {i + 1}
                                            <span className="ml-1 text-xs text-slate-400">
                                                ({loc.count} features)
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Quick stats */}
                    {polygons.length > 0 && (
                        <div className="px-4 py-3">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                Location Summary
                            </h3>
                            <p className="mb-2 text-sm font-semibold text-slate-800">
                                {polygons.length} total locations
                            </p>
                            <ul className="space-y-1">
                                {CLASSIFICATION_ORDER.map(
                                    (key) =>
                                        counts[key] > 0 && (
                                            <li
                                                key={key}
                                                className="flex items-center gap-2 text-sm text-slate-700"
                                            >
                                                <span
                                                    className={`h-2.5 w-2.5 rounded-full ${classificationDots[key]}`}
                                                />
                                                {classificationLabels[key]}:
                                                <span className="font-semibold">
                                                    {counts[key]}
                                                </span>
                                            </li>
                                        ),
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default DashboardSidebar;
