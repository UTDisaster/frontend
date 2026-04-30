import type { ChatRuntimeConfig } from '../../config';
import { createMockChatRealtimeClient } from './mockChatRealtimeClient';
import { createPassthroughChatRealtimeClient } from './passthroughChatRealtimeClient';
import type { ChatRealtimeClient } from './types';

export const createChatRealtimeClient = (
    config: ChatRuntimeConfig,
): ChatRealtimeClient => {
    if (config.enableMockChat) {
        return createMockChatRealtimeClient();
    }

    return createPassthroughChatRealtimeClient();
};
