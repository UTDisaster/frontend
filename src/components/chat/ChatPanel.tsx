import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEventHandler } from 'react';

import type { ViewportBBox } from '@components/map/MapView';

import type { ChatAction } from './ChatDock';
import { createChatHistoryClient } from './clients/history/createChatHistoryClient';
import { createMockChatHistoryClient } from './clients/history/mockChatHistoryClient';
import type { ChatHistoryClient } from './clients/history/types';
import { createMockChatRealtimeClient } from './clients/realtime/mockChatRealtimeClient';
import type { ChatRealtimeClient } from './clients/realtime/types';
import ChatInput from './components/ChatInput';
import ChatHeader from './components/ChatHeader';
import ChatMessageList from './components/ChatMessageList';
import { getChatRuntimeConfig } from './config';
import type {
    ChatInboundEventEnvelope,
    ChatOutboundEventEnvelope,
} from './contracts';
import {
    mapConversationDetailToUiConversation,
    mapMessageRecordToUiMessage,
    mapUiMessageToMessageRecord,
} from './mappers';
import mockConversations from './mockConversations';
import type {
    ChatConnectionState,
    ChatConversation,
    ChatMessage,
    Sender,
} from './types';

interface ChatPanelProps {
    setIsOpen: (isOpen: boolean) => void;
    viewport: ViewportBBox | null;
    onAction?: (action: ChatAction) => void;
}

const runtimeConfig = getChatRuntimeConfig();

const sortConversationsByUpdatedAt = (
    conversations: ChatConversation[],
): ChatConversation[] =>
    [...conversations].sort(
        (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

const initialConversations = sortConversationsByUpdatedAt(
    mockConversations.summaries
        .map((summary) => {
            const detail = mockConversations.details[summary.id];
            if (!detail) {
                return null;
            }

            return mapConversationDetailToUiConversation(detail, summary.title);
        })
        .filter((conversation): conversation is ChatConversation =>
            Boolean(conversation),
        ),
);

const buildConnectionLabel = (state: ChatConnectionState): string => {
    if (state === 'connecting') return 'Connecting...';
    if (state === 'connected') return 'Mock';
    if (state === 'error') return 'Connection error';
    return 'Disconnected';
};

let messageCounter = 0;
const createMessageId = (sender: Sender): string => {
    messageCounter += 1;
    return `${sender}-${Date.now()}-${messageCounter}`;
};

const NEW_CHAT_ID = '';

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

const createNewConversation = (
    firstMessage: ChatMessage,
): ChatConversation => {
    const id = `conv-new-${Date.now()}`;
    const title =
        firstMessage.text.length > 40
            ? `${firstMessage.text.slice(0, 40)}…`
            : firstMessage.text;
    return {
        id,
        title,
        updatedAt: firstMessage.sentAt,
        messages: [firstMessage],
    };
};

const hydrateConversations = async (
    historyClient: ChatHistoryClient,
): Promise<ChatConversation[]> => {
    const summaries = await historyClient.getConversations();
    const detailsByConversation = await Promise.all(
        summaries.map(async (summary) => ({
            summary,
            detail: await historyClient.getConversation(summary.id),
        })),
    );

    return sortConversationsByUpdatedAt(
        detailsByConversation.map(({ summary, detail }) =>
            mapConversationDetailToUiConversation(detail, summary.title),
        ),
    );
};

const ChatPanel = ({ setIsOpen, viewport, onAction }: ChatPanelProps) => {
    const [conversations, setConversations] =
        useState<ChatConversation[]>(initialConversations);
    const [activeConversationId, setActiveConversationId] =
        useState<string>(NEW_CHAT_ID);
    const [draft, setDraft] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [connectionState, setConnectionState] =
        useState<ChatConnectionState>('connecting');
    const [isThinking, setIsThinking] = useState(false);

    const listRef = useRef<HTMLDivElement | null>(null);
    const realtimeClientRef = useRef<ChatRealtimeClient | null>(null);
    const backendConversationIdRef = useRef<number | null>(null);
    const suppressMockRef = useRef(false);
    const inflightCountRef = useRef(0);

    const sortedConversations = useMemo(
        () => sortConversationsByUpdatedAt(conversations),
        [conversations],
    );

    const effectiveActiveId = useMemo(() => {
        if (activeConversationId === NEW_CHAT_ID) return NEW_CHAT_ID;
        const isCurrentInList = sortedConversations.some(
            (c) => c.id === activeConversationId,
        );
        if (isCurrentInList) return activeConversationId;
        return NEW_CHAT_ID;
    }, [activeConversationId, sortedConversations]);

    const activeConversation = useMemo(
        () =>
            conversations.find(
                (conversation) => conversation.id === effectiveActiveId,
            ) ?? null,
        [conversations, effectiveActiveId],
    );

    const connectionLabel = useMemo(
        () => buildConnectionLabel(connectionState),
        [connectionState],
    );

    useEffect(() => {
        if (!listRef.current) {
            return;
        }

        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [activeConversation?.messages, isThinking]);

    useEffect(() => {
        let isCancelled = false;

        const load = async () => {
            let historyClient: ChatHistoryClient | null = null;

            try {
                historyClient = createChatHistoryClient(runtimeConfig);
            } catch {
                historyClient = createMockChatHistoryClient();
            }

            if (!historyClient) {
                return;
            }

            const hydrateAndApply = async (client: ChatHistoryClient) => {
                const nextConversations = await hydrateConversations(client);
                if (isCancelled || nextConversations.length === 0) {
                    return;
                }

                setConversations(nextConversations);
                setActiveConversationId((currentConversationId) => {
                    if (currentConversationId === NEW_CHAT_ID) {
                        return NEW_CHAT_ID;
                    }
                    if (
                        currentConversationId &&
                        nextConversations.some(
                            (conversation) =>
                                conversation.id === currentConversationId,
                        )
                    ) {
                        return currentConversationId;
                    }

                    return NEW_CHAT_ID;
                });
            };

            try {
                await hydrateAndApply(historyClient);
            } catch {
                const mockHistoryClient = createMockChatHistoryClient();
                await hydrateAndApply(mockHistoryClient);
            }
        };

        void load();

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        let isCancelled = false;
        let unsubscribe = () => {};

        const client: ChatRealtimeClient = createMockChatRealtimeClient();
        realtimeClientRef.current = client;
        setConnectionState('connecting');

        const handleInboundEvent = (event: ChatInboundEventEnvelope) => {
            if (event.type === 'chat.error') {
                setConnectionState('error');
                return;
            }

            if (event.type !== 'chat.agent_message') {
                return;
            }

            // Skip mock response when backend already replied
            if (suppressMockRef.current) {
                return;
            }

            const inboundMessage = mapMessageRecordToUiMessage(event.message);
            setConversations((current) =>
                appendMessageToConversation(
                    current,
                    event.conversation_id,
                    inboundMessage,
                ),
            );
        };

        unsubscribe = client.subscribe(handleInboundEvent);

        const start = async () => {
            try {
                await client.connect();
                if (!isCancelled) {
                    setConnectionState('connected');
                }
            } catch {
                unsubscribe();
                client.disconnect();
                if (!isCancelled) {
                    setConnectionState('error');
                }
            }
        };

        void start();

        return () => {
            isCancelled = true;
            unsubscribe();
            realtimeClientRef.current?.disconnect();
            realtimeClientRef.current = null;
        };
    }, []);

    const handleSend: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const trimmed = draft.trim();
        if (!trimmed) {
            return;
        }

        const userMessage: ChatMessage = {
            id: createMessageId('user'),
            sender: 'user',
            text: trimmed,
            sentAt: new Date().toISOString(),
        };

        let targetConversationId = effectiveActiveId;

        if (effectiveActiveId === NEW_CHAT_ID) {
            const newConversation = createNewConversation(userMessage);
            targetConversationId = newConversation.id;
            setConversations((current) =>
                sortConversationsByUpdatedAt([newConversation, ...current]),
            );
            setActiveConversationId(newConversation.id);

            const outboundEvent: ChatOutboundEventEnvelope = {
                type: 'chat.user_message',
                conversation_id: newConversation.id,
                message: mapUiMessageToMessageRecord(userMessage),
            };
            realtimeClientRef.current?.send(outboundEvent);
        } else if (activeConversation) {
            setConversations((current) =>
                appendMessageToConversation(
                    current,
                    activeConversation.id,
                    userMessage,
                ),
            );

            const outboundEvent: ChatOutboundEventEnvelope = {
                type: 'chat.user_message',
                conversation_id: activeConversation.id,
                message: mapUiMessageToMessageRecord(userMessage),
            };
            realtimeClientRef.current?.send(outboundEvent);
        }

        setDraft('');

        const { apiBaseUrl } = getChatRuntimeConfig();
        if (apiBaseUrl) {
            // Suppress mock while any backend request is in-flight
            inflightCountRef.current += 1;
            suppressMockRef.current = true;
            setIsThinking(true);

            const body: Record<string, unknown> = {
                message: trimmed,
                conversation_id: backendConversationIdRef.current,
            };
            if (viewport) {
                body.viewport = viewport;
            }
            fetch(`${apiBaseUrl}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
                .then((data: { conversation_id: number; reply: string; actions?: ChatAction[] }) => {
                    backendConversationIdRef.current = data.conversation_id;
                    const agentMessage: ChatMessage = {
                        id: createMessageId('agent'),
                        sender: 'agent',
                        text: data.reply,
                        sentAt: new Date().toISOString(),
                    };
                    setConversations((current) =>
                        appendMessageToConversation(
                            current,
                            targetConversationId,
                            agentMessage,
                        ),
                    );
                    if (data.actions && Array.isArray(data.actions)) {
                        for (const action of data.actions) {
                            onAction?.(action);
                        }
                    }
                })
                .catch(() => {
                    // Backend unavailable — allow mock client to respond as fallback
                })
                .finally(() => {
                    inflightCountRef.current -= 1;
                    if (inflightCountRef.current <= 0) {
                        inflightCountRef.current = 0;
                        setIsThinking(false);
                        suppressMockRef.current = false;
                    }
                });
        } else {
            // No backend configured — allow mock to respond as fallback
            suppressMockRef.current = false;
            setIsThinking(false);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        setActiveConversationId(conversationId);
        setIsHistoryOpen(false);
    };

    return (
        <section
            className="w-[720px]
                       rounded-xl border border-white/80 bg-white/90 shadow-xl
                       backdrop-blur-md
                       animate-rise
                       overflow-hidden"
        >
            <ChatHeader
                onClose={() => setIsOpen(false)}
                conversationTitle={
                    activeConversation?.title ?? 'New chat'
                }
                connectionLabel={connectionLabel}
                isHistoryOpen={isHistoryOpen}
                conversations={sortedConversations}
                activeConversationId={effectiveActiveId}
                newChatId={NEW_CHAT_ID}
                onToggleHistory={() =>
                    setIsHistoryOpen((currentState) => !currentState)
                }
                onCloseHistory={() => setIsHistoryOpen(false)}
                onSelectConversation={handleSelectConversation}
            />
            <ChatMessageList
                messages={activeConversation?.messages ?? []}
                listRef={listRef}
                isThinking={isThinking}
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
