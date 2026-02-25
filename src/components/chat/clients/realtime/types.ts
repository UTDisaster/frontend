import type {
    ChatInboundEventEnvelope,
    ChatOutboundEventEnvelope,
} from '../../contracts';

export type ChatRealtimeEventHandler = (
    event: ChatInboundEventEnvelope,
) => void;

export interface ChatRealtimeClient {
    mode: 'mock' | 'live';
    connect: () => Promise<void>;
    disconnect: () => void;
    send: (event: ChatOutboundEventEnvelope) => void;
    subscribe: (handler: ChatRealtimeEventHandler) => () => void;
}
