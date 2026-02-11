import ChatDock from '@components/chat/ChatDock';
import ControlPanel from '@components/controls/ControlPanel';

const Dashboard = () => {
    return (
        <div className="relative h-full w-full overflow-hidden text-slate-950">
            <div className="absolute inset-0 bg-slate-200" />

            <ControlPanel />
            <ChatDock />
        </div>
    );
};

export default Dashboard;
