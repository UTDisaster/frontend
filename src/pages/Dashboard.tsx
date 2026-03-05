import { useState } from 'react';

import ChatDock from '@components/chat/ChatDock';
import ControlPanel, {
    type ImageOverlayMode,
    type LocationToggleState,
} from '@components/controls/ControlPanel';
import DashboardSidebar from '@components/dashboard/DashboardSidebar';
import ErrorBoundary from '@components/ErrorBoundary';
import MapView from '@components/map/MapView';

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [imageOverlayMode, setImageOverlayMode] = useState<ImageOverlayMode>('post');
    const [imageOverlayOpacity, setImageOverlayOpacity] = useState(0.8);
    const [disableAllArtifacts, setDisableAllArtifacts] = useState(false);
    const [locationToggles, setLocationToggles] = useState<LocationToggleState>({
        unknown: true,
        none: true,
        some: true,
        moderate: true,
        severe: true,
    });

    return (
        <div className="relative min-h-screen h-full w-full overflow-hidden text-slate-950">
            <div className="absolute inset-0 z-0">
                <ErrorBoundary
                    fallback={
                        <div className="h-full w-full bg-slate-300" aria-hidden />
                    }
                >
                    <MapView
                        imageOverlayMode={imageOverlayMode}
                        imageOverlayOpacity={imageOverlayOpacity}
                    />
                </ErrorBoundary>
            </div>

            <ControlPanel
                onMenuClick={() => setIsSidebarOpen(true)}
                imageOverlayMode={imageOverlayMode}
                onImageOverlayModeChange={setImageOverlayMode}
                imageOverlayOpacity={imageOverlayOpacity}
                onImageOverlayOpacityChange={setImageOverlayOpacity}
                disableAllArtifacts={disableAllArtifacts}
                onDisableAllArtifactsChange={setDisableAllArtifacts}
                locationToggles={locationToggles}
                onLocationToggleChange={(key, enabled) => {
                    setLocationToggles((previous) => ({ ...previous, [key]: enabled }));
                }}
            />
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <ChatDock />
        </div>
    );
};

export default Dashboard;
