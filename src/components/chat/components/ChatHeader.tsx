import { History, MapPin, SquarePen, X } from 'lucide-react';

import type { DisasterContext } from '../types';
import type { ChatConversation } from '../types';
import ChatHistoryMenu from './ChatHistoryMenu';

interface ChatHeaderProps {
    onClose: () => void;
    conversationTitle: string;
    connectionLabel: string;
    isHistoryOpen: boolean;
    conversations: ChatConversation[];
    activeConversationId: string;
    newChatId: string;
    onToggleHistory: () => void;
    onCloseHistory: () => void;
    onSelectConversation: (conversationId: string) => void;
    onNewChat: () => void;
    disasterContext?: DisasterContext;
}

const ChatHeader = ({
    onClose,
    conversationTitle,
    connectionLabel,
    isHistoryOpen,
    conversations,
    activeConversationId,
    newChatId,
    onToggleHistory,
    onCloseHistory,
    onSelectConversation,
    onNewChat,
    disasterContext,
}: ChatHeaderProps) => {
    return (
        <header className="relative flex items-center justify-between border-b border-slate-900/10 px-5 py-4">
            <div>
                <p className="font-display text-base font-bold text-slate-900">Chat</p>
                <p className="text-xs text-slate-500">
                    {connectionLabel} · {conversationTitle}
                </p>
                {disasterContext && (
                    <p className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        Talking about: {disasterContext.name}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900/10 text-slate-900 transition hover:bg-slate-900/20"
                    onClick={onNewChat}
                    aria-label="New chat"
                >
                    <SquarePen className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900/10 text-slate-900 transition hover:bg-slate-900/20"
                    onClick={onToggleHistory}
                    aria-expanded={isHistoryOpen}
                    aria-controls="chat-history-menu"
                    aria-label="Show previous chats"
                >
                    <History className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900/10 text-slate-900 transition hover:bg-slate-900/20"
                    onClick={onClose}
                    aria-label="Close chat"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <ChatHistoryMenu
                isOpen={isHistoryOpen}
                conversations={conversations}
                activeConversationId={activeConversationId}
                newChatId={newChatId}
                onSelectConversation={onSelectConversation}
                onClose={onCloseHistory}
            />
        </header>
    );
};

export default ChatHeader;
