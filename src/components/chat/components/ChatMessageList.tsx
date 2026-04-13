import type { RefObject } from 'react';

import type { ChatMessage } from '../types';
import ChatBubble from './ChatBubble';

interface ChatMessageListProps {
    messages: ChatMessage[];
    listRef: RefObject<HTMLDivElement>;
    isThinking?: boolean;
}

const ThinkingBubble = () => (
    <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
    </div>
);

const ChatMessageList = ({ messages, listRef, isThinking = false }: ChatMessageListProps) => {
    return (
        <div
            ref={listRef}
            className="flex h-[360px] flex-col gap-3 overflow-y-auto px-4 py-4"
        >
            {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
            ))}
            {isThinking && <ThinkingBubble />}
        </div>
    );
};

export default ChatMessageList;
