import type {
    ChatRealtimeClient,
    ChatRealtimeEventHandler,
} from './types';

export const createPassthroughChatRealtimeClient = (): ChatRealtimeClient => {
    const listeners = new Set<ChatRealtimeEventHandler>();

    return {
        mode: 'passthrough',
        async connect() {},
        disconnect() {
            listeners.clear();
        },
        send() {},
        subscribe(handler) {
            listeners.add(handler);

            return () => {
                listeners.delete(handler);
            };
        },
    };
};
