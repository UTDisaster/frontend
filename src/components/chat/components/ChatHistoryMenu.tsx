import type { ChatConversation } from '../types';
import { formatMessageTime } from '../util';

interface ChatHistoryMenuProps {
    isOpen: boolean;
    conversations: ChatConversation[];
    activeConversationId: string;
    newChatId: string;
    onSelectConversation: (conversationId: string) => void;
    onClose: () => void;
}

const ChatHistoryMenu = ({
    isOpen,
    conversations,
    activeConversationId,
    newChatId,
    onSelectConversation,
    onClose,
}: ChatHistoryMenuProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            id="chat-history-menu"
            className="absolute right-12 top-14 z-20 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
            <div className="border-b border-slate-200 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Previous chats
                </p>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
                <button
                    type="button"
                    onClick={() => {
                        onSelectConversation(newChatId);
                        onClose();
                    }}
                    className={`mb-2 w-full rounded-lg px-3 py-2 text-left transition ${
                        activeConversationId === newChatId
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    <p className="text-sm font-semibold">New chat</p>
                    <p
                        className={`text-xs ${
                            activeConversationId === newChatId
                                ? 'text-slate-300'
                                : 'text-slate-500'
                        }`}
                    >
                        Start a new conversation
                    </p>
                </button>
                {conversations.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-slate-500">
                        No previous chats yet.
                    </p>
                ) : (
                    conversations.map((conversation) => {
                        const lastMessage =
                            conversation.messages[
                                conversation.messages.length - 1
                            ];
                        const isActive =
                            conversation.id === activeConversationId;

                        return (
                            <button
                                key={conversation.id}
                                type="button"
                                onClick={() => {
                                    onSelectConversation(conversation.id);
                                    onClose();
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left transition ${
                                    isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold">
                                        {conversation.title}
                                    </p>
                                    <p
                                        className={`text-[11px] ${
                                            isActive
                                                ? 'text-slate-300'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {formatMessageTime(
                                            conversation.updatedAt,
                                        )}
                                    </p>
                                </div>
                                <p
                                    className={`mt-1 truncate text-xs ${
                                        isActive
                                            ? 'text-slate-200'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {lastMessage?.text ?? 'No messages yet'}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatHistoryMenu;
