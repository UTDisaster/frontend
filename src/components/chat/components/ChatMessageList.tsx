import React from 'react';

import type { ChatMessage } from '../types';
import ChatBubble from './ChatBubble';

interface ChatMessageListProps {
    messages: ChatMessage[];
    listRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessageList = ({ messages, listRef }: ChatMessageListProps) => {
    return (
        <div
            ref={listRef as React.LegacyRef<HTMLDivElement>}
            className="flex h-[360px] flex-col gap-3 overflow-y-auto px-4 py-4"
        >
            {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
            ))}
        </div>
    );
};

export default ChatMessageList;
