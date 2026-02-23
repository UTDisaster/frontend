import type { ChatMessage } from '../types';
import type {
    ChatTransport,
    TransportInboundMessage,
    TransportMessageHandler,
    TransportOutboundMessage,
} from './types';

const responseTemplates = [
    'Thanks, I am checking that context now.',
    'Noted. I can map that request to the latest disaster snapshot.',
    'Understood. I will keep that thread focused while we continue.',
];

const buildResponseText = (
    messageText: string,
    responseIndex: number,
): string => {
    const prefix = responseTemplates[responseIndex % responseTemplates.length];
    const trimmed = messageText.trim();
    const clippedMessage =
        trimmed.length > 88 ? `${trimmed.slice(0, 88)}...` : trimmed;

    return `${prefix} (mock) "${clippedMessage}"`;
};

const createAgentMessage = (
    outboundMessage: TransportOutboundMessage,
    responseIndex: number,
): ChatMessage => ({
    id: `agent-${Date.now()}-${responseIndex}`,
    sender: 'agent',
    text: buildResponseText(outboundMessage.message.text, responseIndex),
    sentAt: new Date().toISOString(),
});

export const createMockChatTransport = (): ChatTransport => {
    let isConnected = false;
    let responseCount = 0;

    const listeners = new Set<TransportMessageHandler>();
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const emit = (payload: TransportInboundMessage) => {
        listeners.forEach((listener) => listener(payload));
    };

    return {
        async connect() {
            isConnected = true;
        },
        disconnect() {
            isConnected = false;
            pendingTimers.forEach((timer) => clearTimeout(timer));
            pendingTimers.clear();
            listeners.clear();
        },
        send(outboundMessage) {
            if (!isConnected) {
                return;
            }

            const responseIndex = responseCount;
            responseCount += 1;

            const timeout = setTimeout(() => {
                pendingTimers.delete(timeout);
                if (!isConnected) {
                    return;
                }

                emit({
                    conversationId: outboundMessage.conversationId,
                    message: createAgentMessage(outboundMessage, responseIndex),
                });
            }, 650);

            pendingTimers.add(timeout);
        },
        subscribe(handler) {
            listeners.add(handler);

            return () => {
                listeners.delete(handler);
            };
        },
    };
};
