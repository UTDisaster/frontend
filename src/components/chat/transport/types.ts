import type { ChatMessage } from '../types';

export interface TransportOutboundMessage {
    conversationId: string;
    message: ChatMessage;
}

export interface TransportInboundMessage {
    conversationId: string;
    message: ChatMessage;
}

export type TransportMessageHandler = (
    payload: TransportInboundMessage,
) => void;

export interface ChatTransport {
    connect: () => Promise<void>;
    disconnect: () => void;
    send: (payload: TransportOutboundMessage) => void;
    subscribe: (handler: TransportMessageHandler) => () => void;
}
