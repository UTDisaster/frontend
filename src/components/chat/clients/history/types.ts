import type { ConversationDetail, ConversationSummary } from '../../contracts';

export interface ChatHistoryClient {
    mode: 'mock' | 'live';
    getConversations: () => Promise<ConversationSummary[]>;
    getConversation: (conversationId: string) => Promise<ConversationDetail>;
}
