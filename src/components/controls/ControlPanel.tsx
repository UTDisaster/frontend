import { Layers, Menu } from 'lucide-react';

const leftItems = [
  { label: 'Overlays', icon: Layers, id: 'overlays' },
  { label: '', icon: Layers, id: 'some-toggle' },
];

const ControlPanel = () => {
    return (
        <div className="absolute left-4 right-4 top-4 z-10
                        flex items-center justify-between
                        pointer-events-none"
        >
            <button className="grid h-12 w-12
                               place-items-center
                               rounded-xl border border-white/70 bg-white/75
                               shadow-md backgrop-blur-md
                               transition hover:-translate-y-0.5 hover:shadow-lg
                               pointer-events-auto" >
                <Menu className="h-6 w-6 text-slate-900" />
            </button>
            <div className="flex items-center gap-2
                            p-2
                            rounded-xl
                            border border-white/75 bg-white/75
                            shadow-md backdrop-blur-md
                            pointer-events-auto"
            >
                {leftItems.map(({ label, icon: Icon }) => (
                    <button
                        key={label}
                        className="flex items-center gap-2
                                   px-4 py-2
                                   text-sm font-semibold text-slate-900
                                   rounded-lg
                                   transition hover:bg-white/90 hover:text-blue-600"
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ControlPanel;
