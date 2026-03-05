import type { ChatRuntimeConfig } from '../../config';
import { createLiveChatHistoryClient } from './liveChatHistoryClient';
import { createMockChatHistoryClient } from './mockChatHistoryClient';
import type { ChatHistoryClient } from './types';

export const createChatHistoryClient = (
    config: ChatRuntimeConfig,
): ChatHistoryClient => {
    if (!config.apiBaseUrl) {
        return createMockChatHistoryClient();
    }

    return createLiveChatHistoryClient(config.apiBaseUrl);
};
