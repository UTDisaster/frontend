import { X } from 'lucide-react';

const ChatPanel = () => {
    return (
        <section
            className="w-[360px]
                       rounded-xl border border-white/80 bg-white/90 shadow-xl
                       backdrop-blur-md
                       animate-rise
                       overflow-hidden"
        >
            <header className="flex items-center justify-between
                               px-5 py-4
                               border-b border-slate-900/10">
                <div>
                    <p className="font-display text-base font-bold text-slate-900">
                        Chat
                    </p>
                    <p className="text-xs text-slate-500">Ask questions</p>
                </div>
                <button
                    className="grid h-8 w-8
                               place-items-center
                               rounded-lg
                               bg-slate-900/10 text-slate-900
                               transition hover:bg-slate-900/20"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                </button>
            </header>
            <div className="p-4">
                { /* chat bubbles etc */ }
                chat stuff here
            </div>
        </section>
    );
};

export default ChatPanel;
