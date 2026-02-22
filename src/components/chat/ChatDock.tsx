import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

import ChatPanel from './ChatPanel';

const ChatDock = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    return (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-4">
            { isOpen && <ChatPanel setIsOpen={() => setIsOpen(false)} /> }
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
