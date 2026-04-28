export type DashboardView = "map" | "vlm";

export const DASHBOARD_VIEW_PATHS: Record<DashboardView, string> = {
    map: "/",
    vlm: "/vlm-assessment",
};

export const getDashboardViewFromPath = (pathname: string): DashboardView => {
    if (pathname === DASHBOARD_VIEW_PATHS.vlm) {
        return "vlm";
    }

    return "map";
};
