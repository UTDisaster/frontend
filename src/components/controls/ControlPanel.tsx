import { useEffect, useRef, useState } from "react";

import { Layers, Menu } from "lucide-react";

export type ImageOverlayMode = "pre" | "post" | "none";

export interface LocationToggleState {
    destroyed: boolean;
    minor: boolean;
    none: boolean;
    severe: boolean;
    unknown: boolean;
}

interface ControlPanelProps {
    disableAllArtifacts: boolean;
    imageOverlayOpacity: number;
    imageOverlayMode: ImageOverlayMode;
    locationToggles: LocationToggleState;
    onDisableAllArtifactsChange: (value: boolean) => void;
    onImageOverlayOpacityChange: (value: number) => void;
    onImageOverlayModeChange: (mode: ImageOverlayMode) => void;
    onLocationToggleChange: (
        key: keyof LocationToggleState,
        enabled: boolean,
    ) => void;
    onMenuClick?: () => void;
    isSidebarOpen?: boolean;
}

const imageOptions: { label: string; value: ImageOverlayMode }[] = [
    { label: "Pre", value: "pre" },
    { label: "Post", value: "post" },
    { label: "None", value: "none" },
];

const locationOptions: {
    colorClass: string;
    key: keyof LocationToggleState;
    label: string;
}[] = [
    { key: "unknown", label: "Unknown", colorClass: "bg-slate-400" },
    { key: "none", label: "None", colorClass: "bg-green-500" },
    { key: "minor", label: "Minor", colorClass: "bg-yellow-400" },
    { key: "severe", label: "Severe", colorClass: "bg-orange-500" },
    { key: "destroyed", label: "Destroyed", colorClass: "bg-red-500" },
];

const ControlPanel = ({
    disableAllArtifacts,
    imageOverlayOpacity,
    imageOverlayMode,
    locationToggles,
    onDisableAllArtifactsChange,
    onImageOverlayOpacityChange,
    onImageOverlayModeChange,
    onLocationToggleChange,
    onMenuClick,
    isSidebarOpen,
}: ControlPanelProps) => {
    const [isOverlayMenuOpen, setIsOverlayMenuOpen] = useState(false);
    const overlayMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOverlayMenuOpen) return;

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;

            if (
                overlayMenuRef.current &&
                !overlayMenuRef.current.contains(target)
            ) {
                setIsOverlayMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [isOverlayMenuOpen]);

    return (
        <div
            className="absolute left-4 right-4 top-4 z-[1000]
                        flex items-start justify-between
                        pointer-events-none"
        >
            {!isSidebarOpen && (
                <button
                    type="button"
                    className="grid h-12 w-12
                               place-items-center
                               rounded-xl border border-white/70 bg-white/75
                               shadow-md backdrop-blur-md
                               transition hover:-translate-y-0.5 hover:shadow-lg
                               pointer-events-auto"
                    onClick={() => {
                        setIsOverlayMenuOpen(false);
                        onMenuClick?.();
                    }}
                    aria-label="Open menu"
                >
                    <Menu className="h-6 w-6 text-slate-900" />
                </button>
            )}
            {!isSidebarOpen && <div
                ref={overlayMenuRef}
                className="relative flex items-center gap-2
                                        p-2
                                        rounded-xl
                                        border border-white/80 bg-white/90
                                        shadow-md backdrop-blur-md
                                        pointer-events-auto"
            >
                <button
                    type="button"
                    className="flex items-center gap-2
                               px-4 py-2
                               text-sm font-semibold text-slate-900
                               rounded-lg
                               transition hover:bg-white/90 hover:text-blue-600"
                    onClick={() => setIsOverlayMenuOpen((open) => !open)}
                    aria-expanded={isOverlayMenuOpen}
                    aria-haspopup="true"
                    aria-controls="overlays-popup-menu"
                >
                    <Layers className="h-4 w-4" />
                    Overlays
                </button>

                {isOverlayMenuOpen ? (
                    <div
                        id="overlays-popup-menu"
                        className="absolute right-0 top-full mt-2 w-80
                                   rounded-xl border border-slate-200 bg-white p-3
                                   shadow-xl"
                    >
                        <section className="mb-3 border-b border-slate-200 pb-3">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                Images
                            </h3>
                            <div className="flex gap-2">
                                {imageOptions.map((option) => {
                                    const isActive =
                                        option.value === imageOverlayMode;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                                                isActive
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                                            }`}
                                            onClick={() =>
                                                onImageOverlayModeChange(
                                                    option.value,
                                                )
                                            }
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-3">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Opacity
                                    </span>
                                    <span className="text-xs font-semibold text-slate-600">
                                        {Math.round(imageOverlayOpacity * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={Math.round(
                                        imageOverlayOpacity * 100,
                                    )}
                                    onChange={(event) =>
                                        onImageOverlayOpacityChange(
                                            Number(event.target.value) / 100,
                                        )
                                    }
                                    className="w-full accent-blue-600"
                                    aria-label="Image overlay opacity"
                                />
                            </div>
                        </section>

                        <section>
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Artifacts
                                </h3>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!disableAllArtifacts}
                                    aria-label="Toggle artifacts"
                                    className={`relative h-5 w-9 rounded-full transition ${
                                        disableAllArtifacts
                                            ? "bg-slate-300"
                                            : "bg-blue-600"
                                    }`}
                                    onClick={() =>
                                        onDisableAllArtifactsChange(
                                            !disableAllArtifacts,
                                        )
                                    }
                                >
                                    <span
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                                            disableAllArtifacts
                                                ? "left-0.5"
                                                : "left-[18px]"
                                        }`}
                                    />
                                </button>
                            </div>

                            {!disableAllArtifacts ? (
                                <div className="rounded-md border border-slate-200 p-2">
                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Locations
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {locationOptions.map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                className={`group relative h-7 w-7 rounded-full border-2 transition ${
                                                    locationToggles[option.key]
                                                        ? `${option.colorClass} border-white ring-2 ring-slate-300`
                                                        : `${option.colorClass} border-slate-300 saturate-50 brightness-110`
                                                }`}
                                                onClick={() =>
                                                    onLocationToggleChange(
                                                        option.key,
                                                        !locationToggles[
                                                            option.key
                                                        ],
                                                    )
                                                }
                                                aria-label={option.label}
                                            >
                                                <span
                                                    className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
                                                    aria-hidden
                                                >
                                                    {option.label}
                                                </span>
                                                {!locationToggles[
                                                    option.key
                                                ] ? (
                                                    <span
                                                        className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-slate-700"
                                                        aria-hidden
                                                    />
                                                ) : null}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </section>
                    </div>
                ) : null}
            </div>}
        </div>
    );
};

export default ControlPanel;
