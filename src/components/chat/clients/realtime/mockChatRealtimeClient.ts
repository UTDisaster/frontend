import type {
    ChatAgentMessageEvent,
    ChatOutboundEventEnvelope,
} from '../../contracts';
import type { ChatRealtimeClient, ChatRealtimeEventHandler } from './types';

const responseTemplates = [
    'Thanks, I am checking that context now.',
    'Noted. I can map that request to the latest disaster snapshot.',
    'Understood. I will keep that thread focused while we continue.',
];

const buildResponseText = (
    content: string,
    responseIndex: number,
): string => {
    const prefix = responseTemplates[responseIndex % responseTemplates.length];
    const clippedContent =
        content.length > 88 ? `${content.slice(0, 88)}...` : content;

    return `${prefix} (mock) "${clippedContent}"`;
};

export const createMockChatRealtimeClient = (): ChatRealtimeClient => {
    let isConnected = false;
    let responseIndex = 0;

    const listeners = new Set<ChatRealtimeEventHandler>();
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const emit = (event: Parameters<ChatRealtimeEventHandler>[0]) => {
        listeners.forEach((listener) => listener(event));
    };

    return {
        mode: 'mock',
        async connect() {
            isConnected = true;
        },
        disconnect() {
            isConnected = false;
            pendingTimers.forEach((timer) => clearTimeout(timer));
            pendingTimers.clear();
            listeners.clear();
        },
        send(event: ChatOutboundEventEnvelope) {
            if (!isConnected) {
                return;
            }

            if (event.type !== 'chat.user_message') {
                return;
            }

            emit({
                type: 'chat.ack',
                conversation_id: event.conversation_id,
                message_id: event.message.id,
            });

            const currentResponseIndex = responseIndex;
            responseIndex += 1;

            const timer = setTimeout(() => {
                pendingTimers.delete(timer);
                if (!isConnected) {
                    return;
                }

                const responseEvent: ChatAgentMessageEvent = {
                    type: 'chat.agent_message',
                    conversation_id: event.conversation_id,
                    message: {
                        id: `agent-${Date.now()}-${currentResponseIndex}`,
                        role: 'assistant',
                        content: buildResponseText(
                            event.message.content,
                            currentResponseIndex,
                        ),
                        timestamp: new Date().toISOString(),
                        ...(event.message.disaster_id
                            ? { disaster_id: event.message.disaster_id }
                            : {}),
                    },
                };

                emit(responseEvent);
            }, 650);

            pendingTimers.add(timer);
        },
        subscribe(handler) {
            listeners.add(handler);

            return () => {
                listeners.delete(handler);
            };
        },
    };
};
