import { ImagePlus, Link2, Moon, Sun, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const THEME_STORAGE_KEY = "vlm-assessment-theme";

type VLMTheme = "dark" | "light";

const VLMPredictionPage = () => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [theme, setTheme] = useState<VLMTheme>(() => {
        if (typeof window === "undefined") return "dark";
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        return storedTheme === "light" ? "light" : "dark";
    });

    const handleFile = (file: File | null) => {
        if (!file) return;
        if (!acceptedTypes.includes(file.type)) return;
    };

    useEffect(() => {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const isDark = theme === "dark";
    const panelClass = isDark
        ? "border-white/10 bg-white/5"
        : "border-slate-300 bg-white";
    const inputClass = isDark
        ? "border-white/15 bg-slate-900/80 text-white placeholder:text-slate-500"
        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400";

    return (
        <div
            className={`min-h-screen transition-colors ${
                isDark ? "bg-slate-950 text-slate-50" : "bg-slate-100 text-slate-950"
            }`}
        >
            <div className="relative min-h-screen px-4">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isDark}
                    aria-label="Toggle dark mode"
                    className={`absolute right-4 top-4 inline-flex h-11 w-20 items-center rounded-full border px-1 transition sm:right-6 sm:top-6 ${
                        isDark
                            ? "border-white/15 bg-slate-900/80"
                            : "border-slate-300 bg-white"
                    }`}
                    onClick={() =>
                        setTheme((currentTheme) =>
                            currentTheme === "dark" ? "light" : "dark",
                        )
                    }
                >
                    <span
                        className={`absolute left-2 transition ${
                            isDark ? "text-slate-500" : "text-amber-500"
                        }`}
                    >
                        <Sun className="h-4 w-4" />
                    </span>
                    <span
                        className={`absolute right-2 transition ${
                            isDark ? "text-cyan-300" : "text-slate-400"
                        }`}
                    >
                        <Moon className="h-4 w-4" />
                    </span>
                    <span
                        className={`h-8 w-8 rounded-full shadow-md transition-transform ${
                            isDark
                                ? "translate-x-9 bg-cyan-400/20"
                                : "translate-x-0 bg-amber-200"
                        }`}
                    />
                </button>
                <h1
                    className={`absolute left-1/2 top-20 -translate-x-1/2 text-center text-3xl font-semibold sm:text-4xl ${
                        isDark ? "text-white" : "text-slate-950"
                    }`}
                >
                    VLM Assessment
                </h1>
                <div className="flex min-h-screen flex-col items-center justify-center text-center">
                    <div
                        className={`mt-6 w-full max-w-xl rounded-2xl border p-6 text-left shadow-lg transition ${
                            panelClass
                        }`}
                    >
                        <div
                            className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
                                isDragging
                                    ? isDark
                                        ? "border-cyan-300 bg-cyan-400/10"
                                        : "border-cyan-600 bg-cyan-50"
                                    : isDark
                                      ? "border-white/15 bg-slate-950/50"
                                      : "border-slate-300 bg-slate-50"
                            }`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(event) => {
                                event.preventDefault();
                                setIsDragging(false);
                                handleFile(event.dataTransfer.files[0] ?? null);
                            }}
                        >
                            <div
                                className={`grid h-14 w-14 place-items-center rounded-full ${
                                    isDark
                                        ? "bg-white/10 text-cyan-300"
                                        : "bg-cyan-100 text-cyan-700"
                                }`}
                            >
                                <Upload className="h-6 w-6" />
                            </div>
                            <p
                                className={`mt-4 text-lg font-semibold ${
                                    isDark ? "text-white" : "text-slate-950"
                                }`}
                            >
                                Drag an image here
                            </p>
                            <p
                                className={`mt-2 text-sm ${
                                    isDark ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                Or upload an image from your device
                            </p>
                            <button
                                type="button"
                                className={`mt-5 inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                                    isDark
                                        ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                                        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                                }`}
                                onClick={() => inputRef.current?.click()}
                            >
                                <ImagePlus className="h-4 w-4" />
                                Upload image
                            </button>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`h-px flex-1 ${
                                        isDark ? "bg-white/10" : "bg-slate-300"
                                    }`}
                                />
                                <span
                                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                                        isDark ? "text-slate-400" : "text-slate-500"
                                    }`}
                                >
                                    Or paste image link
                                </span>
                                <div
                                    className={`h-px flex-1 ${
                                        isDark ? "bg-white/10" : "bg-slate-300"
                                    }`}
                                />
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Link2
                                        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                                            isDark ? "text-slate-500" : "text-slate-400"
                                        }`}
                                    />
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(event) =>
                                            setImageUrl(event.target.value)
                                        }
                                        placeholder="Paste image link"
                                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/40 ${inputClass}`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className={`rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                                        isDark
                                            ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                                            : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                                    }`}
                                    onClick={() => {
                                        const trimmedUrl = imageUrl.trim();
                                        if (!trimmedUrl) return;
                                    }}
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={acceptedTypes.join(",")}
                        className="sr-only"
                        onChange={(event) =>
                            handleFile(event.target.files?.[0] ?? null)
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default VLMPredictionPage;
