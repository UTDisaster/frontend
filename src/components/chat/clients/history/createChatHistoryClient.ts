import type { ChatRuntimeConfig } from '../../config';
import { createLiveChatHistoryClient } from './liveChatHistoryClient';
import { createMockChatHistoryClient } from './mockChatHistoryClient';
import type { ChatHistoryClient } from './types';

export const createChatHistoryClient = (
    config: ChatRuntimeConfig,
): ChatHistoryClient => {
    if (config.chatMode === 'mock') {
        return createMockChatHistoryClient();
    }

    if (!config.apiBaseUrl) {
        if (config.chatMode === 'live') {
            throw new Error('VITE_API_BASE_URL is required in live mode');
        }

        return createMockChatHistoryClient();
    }

    return createLiveChatHistoryClient(config.apiBaseUrl);
};
