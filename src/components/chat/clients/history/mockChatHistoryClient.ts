import mockConversations from '../../mockConversations';
import type { ChatHistoryClient } from './types';

export const createMockChatHistoryClient = (): ChatHistoryClient => ({
    mode: 'mock',
    async getConversations() {
        return [...mockConversations.summaries];
    },
    async getConversation(conversationId) {
        const detail = mockConversations.details[conversationId];
        if (!detail) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }

        return detail;
    },
});
