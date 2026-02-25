import { useEffect, useMemo, useRef, useState } from 'react';
import type { SubmitEventHandler } from 'react';

import { createChatHistoryClient } from './clients/history/createChatHistoryClient';
import { createMockChatHistoryClient } from './clients/history/mockChatHistoryClient';
import type { ChatHistoryClient } from './clients/history/types';
import { createChatRealtimeClient } from './clients/realtime/createChatRealtimeClient';
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

const buildConnectionLabel = (
    state: ChatConnectionState,
    mode: 'mock' | 'live',
): string => {
    if (state === 'connecting') {
        return `Connecting (${mode})...`;
    }

    if (state === 'connected') {
        return `Connected (${mode})`;
    }

    if (state === 'error') {
        return `Connection error (${mode})`;
    }

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

const ChatPanel = ({ setIsOpen }: ChatPanelProps) => {
    const [conversations, setConversations] =
        useState<ChatConversation[]>(initialConversations);
    const [activeConversationId, setActiveConversationId] =
        useState<string>(NEW_CHAT_ID);
    const [draft, setDraft] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [connectionState, setConnectionState] =
        useState<ChatConnectionState>('connecting');
    const [connectionMode, setConnectionMode] = useState<'mock' | 'live'>(
        'mock',
    );

    const listRef = useRef<HTMLDivElement | null>(null);
    const realtimeClientRef = useRef<ChatRealtimeClient | null>(null);

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
        () => buildConnectionLabel(connectionState, connectionMode),
        [connectionState, connectionMode],
    );

    useEffect(() => {
        if (!listRef.current) {
            return;
        }

        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [activeConversation?.messages]);

    useEffect(() => {
        let isCancelled = false;

        const load = async () => {
            let historyClient: ChatHistoryClient | null = null;

            try {
                historyClient = createChatHistoryClient(runtimeConfig);
            } catch {
                if (runtimeConfig.chatMode === 'live') {
                    return;
                }

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
                if (
                    runtimeConfig.chatMode === 'auto' &&
                    historyClient.mode === 'live'
                ) {
                    const mockHistoryClient = createMockChatHistoryClient();
                    await hydrateAndApply(mockHistoryClient);
                }
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

        const attachClient = async (
            client: ChatRealtimeClient,
            allowFallbackToMock: boolean,
        ) => {
            realtimeClientRef.current = client;
            setConnectionMode(client.mode);
            setConnectionState('connecting');

            const handleInboundEvent = (event: ChatInboundEventEnvelope) => {
                if (event.type === 'chat.error') {
                    setConnectionState('error');
                    return;
                }

                if (event.type !== 'chat.agent_message') {
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

            try {
                await client.connect();
                if (!isCancelled) {
                    setConnectionState('connected');
                }
            } catch {
                unsubscribe();
                client.disconnect();

                if (!isCancelled && allowFallbackToMock) {
                    const mockRealtimeClient = createMockChatRealtimeClient();
                    await attachClient(mockRealtimeClient, false);
                    return;
                }

                if (!isCancelled) {
                    setConnectionState('error');
                }
            }
        };

        const start = async () => {
            let realtimeClient: ChatRealtimeClient | null = null;

            try {
                realtimeClient = createChatRealtimeClient(runtimeConfig);
            } catch {
                if (runtimeConfig.chatMode === 'live') {
                    setConnectionState('error');
                    return;
                }

                realtimeClient = createMockChatRealtimeClient();
            }

            if (!realtimeClient) {
                setConnectionState('error');
                return;
            }

            const allowFallbackToMock =
                runtimeConfig.chatMode === 'auto' &&
                realtimeClient.mode === 'live';
            await attachClient(realtimeClient, allowFallbackToMock);
        };

        void start();

        return () => {
            isCancelled = true;
            unsubscribe();
            realtimeClientRef.current?.disconnect();
            realtimeClientRef.current = null;
        };
    }, []);

    const handleSend: SubmitEventHandler<HTMLFormElement> = (event) => {
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

        if (effectiveActiveId === NEW_CHAT_ID) {
            const newConversation = createNewConversation(userMessage);
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
