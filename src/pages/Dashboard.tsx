import { useEffect, useState } from 'react';

import ChatDock from '@components/chat/ChatDock';
import DashboardSidebar from '@components/dashboard/DashboardSidebar';
import ControlPanel from '@components/controls/ControlPanel';
import ErrorBoundary from '@components/ErrorBoundary';
import MapView from '@components/map/MapView';

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setMapReady(true);
    }, []);

    return (
        <div className="relative min-h-screen h-full w-full overflow-hidden text-slate-950">
            <div className="absolute inset-0 z-0">
                <ErrorBoundary
                    fallback={
                        <div className="h-full w-full bg-slate-300" aria-hidden />
                    }
                >
                    {mapReady ? <MapView /> : <div className="h-full w-full bg-slate-300" />}
                </ErrorBoundary>
            </div>

            <ControlPanel onMenuClick={() => setIsSidebarOpen(true)} />
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <ChatDock />
        </div>
    );
};

export default Dashboard;
