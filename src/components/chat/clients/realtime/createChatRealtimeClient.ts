import type { ChatRuntimeConfig } from '../../config';
import { createLiveChatRealtimeClient } from './liveChatRealtimeClient';
import { createMockChatRealtimeClient } from './mockChatRealtimeClient';
import type { ChatRealtimeClient } from './types';

export const createChatRealtimeClient = (
    config: ChatRuntimeConfig,
): ChatRealtimeClient => {
    if (config.chatMode === 'mock') {
        return createMockChatRealtimeClient();
    }

    if (!config.chatWsUrl) {
        if (config.chatMode === 'live') {
            throw new Error('VITE_CHAT_WS_URL is required in live mode');
        }

        return createMockChatRealtimeClient();
    }

    return createLiveChatRealtimeClient(config.chatWsUrl);
};
