import { MapPin } from 'lucide-react';

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const DashboardSidebar = ({ isOpen, onClose }: DashboardSidebarProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                aria-label="Close sidebar"
                className="absolute inset-0 z-20 bg-slate-950/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside
                className="absolute left-0 top-0 z-30 h-full w-72
                           border-r border-white/80 bg-white/90 shadow-xl
                           backdrop-blur-md"
            >
                <div className="flex h-14 items-center justify-between border-b border-slate-900/10 px-4">
                    <p className="font-display text-sm font-bold text-slate-900">
                        Menu
                    </p>
                    <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-lg
                                   bg-slate-900/10 text-slate-900
                                   transition hover:bg-slate-900/20"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        ×
                    </button>
                </div>
                <nav className="p-4">
                    <ul className="space-y-1">
                        <li>
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-lg
                                           px-3 py-2 text-left text-sm font-medium text-slate-900
                                           transition hover:bg-slate-100"
                            >
                                <MapPin className="h-4 w-4 text-slate-600" />
                                Map
                            </button>
                        </li>
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default DashboardSidebar;
