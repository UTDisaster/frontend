import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

import type { ViewportBBox } from '@components/map/MapView';

import ChatPanel from './ChatPanel';
import type { DisasterContext } from './types';

export interface ChatAction {
    type: "flyTo" | "setOpacity" | "setOverlayMode" | "setFilters";
    lat?: number;
    lng?: number;
    zoom?: number;
    value?: number;
    mode?: "pre" | "post" | "none";
    [key: string]: unknown;
}

export type { DisasterContext };

interface ChatDockProps {
    viewport: ViewportBBox | null;
    onAction?: (action: ChatAction) => void;
    disasterContext?: DisasterContext;
}

const ChatDock = ({ viewport, onAction, disasterContext }: ChatDockProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-4">
            {isOpen && (
                <ChatPanel
                    setIsOpen={setIsOpen}
                    viewport={viewport}
                    onAction={onAction}
                    disasterContext={disasterContext}
                />
            )}
            <button
                className="grid h-14 w-14 place-items-center rounded-xl
                           bg-slate-950 text-white shadow-md
                           transition hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => setIsOpen((prevstate) => !prevstate)}
            >
                <MessageCircle className="h-6 w-6" />
            </button>
        </div>
    );
};

export default ChatDock;
