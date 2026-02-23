import { useEffect, useMemo, useRef, useState } from 'react';
import type { SubmitEventHandler } from 'react';

import ChatInput from './components/ChatInput';
import ChatHeader from './components/ChatHeader';
import ChatMessageList from './components/ChatMessageList';
import mockConversations from './mockConversations';
import { createChatTransport } from './transport/createChatTransport';
import type {
    ChatTransport,
    TransportInboundMessage,
} from './transport/types';
import type {
    ChatConnectionState,
    ChatConversation,
    ChatMessage,
    Sender,
} from './types';

interface ChatPanelProps {
    setIsOpen: (isOpen: boolean) => void;
}

const sortConversationsByUpdatedAt = (
    conversations: ChatConversation[],
): ChatConversation[] =>
    [...conversations].sort(
        (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

const initialConversations = sortConversationsByUpdatedAt(mockConversations);

let messageCounter = 0;
const createMessageId = (sender: Sender): string => {
    messageCounter += 1;
    return `${sender}-${Date.now()}-${messageCounter}`;
};

const appendMessageToConversation = (
    conversations: ChatConversation[],
    conversationId: string,
    message: ChatMessage,
): ChatConversation[] =>
    conversations.map((conversation) => {
        if (conversation.id !== conversationId) {
            return conversation;
        }

        return {
            ...conversation,
            updatedAt: message.sentAt,
            messages: [...conversation.messages, message],
        };
    });

const connectionLabelByState: Record<ChatConnectionState, string> = {
    connecting: 'Connecting...',
    connected: 'Connected (mock)',
    error: 'Connection error (mock)',
    disconnected: 'Disconnected',
};

const ChatPanel = ({ setIsOpen }: ChatPanelProps) => {
    const [conversations, setConversations] =
        useState<ChatConversation[]>(initialConversations);
    const [activeConversationId, setActiveConversationId] = useState<string>(
        initialConversations[0]?.id ?? '',
    );
    const [draft, setDraft] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [connectionState, setConnectionState] =
        useState<ChatConnectionState>('connecting');

    const listRef = useRef<HTMLDivElement | null>(null);
    const transportRef = useRef<ChatTransport | null>(null);

    const sortedConversations = useMemo(
        () => sortConversationsByUpdatedAt(conversations),
        [conversations],
    );

    const activeConversation = useMemo(
        () =>
            conversations.find(
                (conversation) => conversation.id === activeConversationId,
            ) ?? null,
        [conversations, activeConversationId],
    );

    useEffect(() => {
        if (!activeConversation && sortedConversations.length > 0) {
            setActiveConversationId(sortedConversations[0].id);
        }
    }, [activeConversation, sortedConversations]);

    useEffect(() => {
        if (!listRef.current) {
            return;
        }

        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [activeConversation?.messages]);

    useEffect(() => {
        const transport = createChatTransport();
        transportRef.current = transport;

        const handleIncomingMessage = ({
            conversationId,
            message,
        }: TransportInboundMessage) => {
            setConversations((current) =>
                appendMessageToConversation(current, conversationId, message),
            );
        };

        const unsubscribe = transport.subscribe(handleIncomingMessage);
        let isCancelled = false;

        void transport
            .connect()
            .then(() => {
                if (!isCancelled) {
                    setConnectionState('connected');
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setConnectionState('error');
                }
            });

        return () => {
            isCancelled = true;
            unsubscribe();
            transport.disconnect();
            transportRef.current = null;
        };
    }, []);

    const handleSend: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const trimmed = draft.trim();
        if (!trimmed || !activeConversation) {
            return;
        }

        const userMessage: ChatMessage = {
            id: createMessageId('user'),
            sender: 'user',
            text: trimmed,
            sentAt: new Date().toISOString(),
        };

        setConversations((current) =>
            appendMessageToConversation(current, activeConversation.id, userMessage),
        );
        transportRef.current?.send({
            conversationId: activeConversation.id,
            message: userMessage,
        });
        setDraft('');
    };

    const handleSelectConversation = (conversationId: string) => {
        setActiveConversationId(conversationId);
        setIsHistoryOpen(false);
    };

    return (
        <section
            className="w-[360px]
                       rounded-xl border border-white/80 bg-white/90 shadow-xl
                       backdrop-blur-md
                       animate-rise
                       overflow-hidden"
        >
            <ChatHeader
                onClose={() => setIsOpen(false)}
                conversationTitle={
                    activeConversation?.title ?? 'No active conversation'
                }
                connectionLabel={connectionLabelByState[connectionState]}
                isHistoryOpen={isHistoryOpen}
                conversations={sortedConversations}
                activeConversationId={activeConversation?.id ?? ''}
                onToggleHistory={() =>
                    setIsHistoryOpen((currentState) => !currentState)
                }
                onCloseHistory={() => setIsHistoryOpen(false)}
                onSelectConversation={handleSelectConversation}
            />
            <ChatMessageList
                messages={activeConversation?.messages ?? []}
                listRef={listRef}
            />
            <ChatInput
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
            />
        </section>
    );
};

export default ChatPanel;
