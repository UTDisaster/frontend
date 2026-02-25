import type {
    ChatInboundEventEnvelope,
    ChatOutboundEventEnvelope,
} from '../../contracts';
import type { ChatRealtimeClient, ChatRealtimeEventHandler } from './types';

const isInboundEvent = (value: unknown): value is ChatInboundEventEnvelope => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const event = value as Partial<ChatInboundEventEnvelope>;

    if (event.type === 'chat.ack') {
        return (
            typeof event.conversation_id === 'string' &&
            typeof event.message_id === 'string'
        );
    }

    if (event.type === 'chat.error') {
        const hasConversationId =
            typeof event.conversation_id === 'undefined' ||
            typeof event.conversation_id === 'string';
        const hasMessageId =
            typeof event.message_id === 'undefined' ||
            typeof event.message_id === 'string';

        return (
            typeof event.error === 'string' &&
            hasConversationId &&
            hasMessageId
        );
    }

    if (event.type === 'chat.agent_message') {
        const message = event.message;
        if (!message || typeof message !== 'object') {
            return false;
        }

        const hasValidRole =
            message.role === 'user' || message.role === 'assistant';
        const hasValidDisasterId =
            typeof message.disaster_id === 'undefined' ||
            typeof message.disaster_id === 'string';

        return (
            typeof event.conversation_id === 'string' &&
            typeof message.id === 'string' &&
            hasValidRole &&
            typeof message.content === 'string' &&
            typeof message.timestamp === 'string' &&
            hasValidDisasterId
        );
    }

    return false;
};

export const createLiveChatRealtimeClient = (
    wsUrl: string,
): ChatRealtimeClient => {
    let socket: WebSocket | null = null;
    let isConnected = false;
    const listeners = new Set<ChatRealtimeEventHandler>();

    const emit = (event: ChatInboundEventEnvelope) => {
        listeners.forEach((listener) => listener(event));
    };

    return {
        mode: 'live',
        connect() {
            return new Promise<void>((resolve, reject) => {
                if (socket && isConnected) {
                    resolve();
                    return;
                }

                const nextSocket = new WebSocket(wsUrl);
                let isSettled = false;
                socket = nextSocket;

                nextSocket.onopen = () => {
                    isConnected = true;
                    isSettled = true;
                    resolve();
                };

                nextSocket.onerror = () => {
                    if (!isConnected) {
                        if (isSettled) {
                            return;
                        }

                        isSettled = true;
                        reject(new Error('Unable to establish websocket connection'));
                    } else {
                        emit({
                            type: 'chat.error',
                            error: 'Websocket connection error',
                        });
                    }
                };

                nextSocket.onclose = () => {
                    const wasConnected = isConnected;
                    isConnected = false;
                    socket = null;

                    if (!wasConnected && !isSettled) {
                        isSettled = true;
                        reject(
                            new Error(
                                'Websocket connection closed before opening',
                            ),
                        );
                        return;
                    }

                    if (wasConnected) {
                        emit({
                            type: 'chat.error',
                            error: 'Websocket connection closed',
                        });
                    }
                };

                nextSocket.onmessage = (rawEvent) => {
                    let parsed: unknown;
                    try {
                        parsed = JSON.parse(rawEvent.data);
                    } catch {
                        emit({
                            type: 'chat.error',
                            error: 'Received malformed websocket message',
                        });
                        return;
                    }

                    if (!isInboundEvent(parsed)) {
                        emit({
                            type: 'chat.error',
                            error: 'Received unsupported websocket event',
                        });
                        return;
                    }

                    emit(parsed);
                };
            });
        },
        disconnect() {
            isConnected = false;
            if (socket) {
                socket.close();
                socket = null;
            }
            listeners.clear();
        },
        send(event: ChatOutboundEventEnvelope) {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                return;
            }

            socket.send(JSON.stringify(event));
        },
        subscribe(handler) {
            listeners.add(handler);

            return () => {
                listeners.delete(handler);
            };
        },
    };
};
