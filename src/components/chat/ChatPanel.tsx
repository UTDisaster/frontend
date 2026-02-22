import { useEffect, useRef, useState } from 'react';
import type { SubmitEventHandler } from 'react';

import ChatInput from './components/ChatInput';
import ChatHeader from './components/ChatHeader';
import ChatMessageList from './components/ChatMessageList';
import type { ChatMessage } from './types';

interface ChatPanelProps {
    setIsOpen: (isOpen: boolean) => void;
}

const ChatPanel = ({ setIsOpen }: ChatPanelProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            sender: 'agent',
            text: 'Hi! Ask me anything about this disaster.',
            sentAt: new Date(),
        },
        {
            id: 2,
            sender: 'user',
            text: 'What locations report the highest severity of damage?',
            sentAt: new Date(),
        },
    ]);
    const [draft, setDraft] = useState('');
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!listRef.current) {
            return;
        }

        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages]);

    const handleSend: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const trimmed = draft.trim();
        if (!trimmed) {
            return;
        }

        setMessages((current) => [
            ...current,
            {
                id: Date.now(),
                sender: 'user',
                text: trimmed,
                sentAt: new Date(),
            },
        ]);
        setDraft('');
    };

    return (
        <section
            className="w-[360px]
                       rounded-xl border border-white/80 bg-white/90 shadow-xl
                       backdrop-blur-md
                       animate-rise
                       overflow-hidden"
        >
            <ChatHeader onClose={() => setIsOpen(false)} />
            <ChatMessageList messages={messages} listRef={listRef} />
            <ChatInput
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
            />
        </section>
    );
};

export default ChatPanel;
