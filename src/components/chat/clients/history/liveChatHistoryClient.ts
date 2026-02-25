import type {
    ChatConversationResponse,
    ChatConversationsResponse,
    ChatMessageRecord,
    ConversationDetail,
    ConversationSummary,
} from '../../contracts';
import type { ChatHistoryClient } from './types';

const isConversationSummary = (
    value: unknown,
): value is ConversationSummary => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const item = value as ConversationSummary;
    return (
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.updated_at === 'string'
    );
};

const isConversationDetail = (value: unknown): value is ConversationDetail => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const item = value as ConversationDetail;
    return (
        typeof item.id === 'string' &&
        typeof item.updated_at === 'string' &&
        Array.isArray(item.messages) &&
        item.messages.every(isChatMessageRecord)
    );
};

const isChatMessageRecord = (value: unknown): value is ChatMessageRecord => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const message = value as ChatMessageRecord;
    const hasValidRole =
        message.role === 'user' || message.role === 'assistant';
    const hasValidDisasterId =
        typeof message.disaster_id === 'undefined' ||
        typeof message.disaster_id === 'string';

    return (
        typeof message.id === 'string' &&
        hasValidRole &&
        typeof message.content === 'string' &&
        typeof message.timestamp === 'string' &&
        hasValidDisasterId
    );
};

const readJson = async <T>(
    response: Response,
    endpoint: string,
): Promise<T> => {
    if (!response.ok) {
        throw new Error(`History request failed (${endpoint}): ${response.status}`);
    }

    return (await response.json()) as T;
};

export const createLiveChatHistoryClient = (
    apiBaseUrl: string,
): ChatHistoryClient => ({
    mode: 'live',
    async getConversations() {
        const response = await fetch(`${apiBaseUrl}/chat/conversations`);
        const payload = await readJson<ChatConversationsResponse>(
            response,
            '/chat/conversations',
        );

        if (!payload?.conversations?.every(isConversationSummary)) {
            throw new Error('Invalid /chat/conversations payload shape');
        }

        return payload.conversations;
    },
    async getConversation(conversationId) {
        const response = await fetch(`${apiBaseUrl}/chat/${conversationId}`);
        const payload = await readJson<ChatConversationResponse>(
            response,
            `/chat/${conversationId}`,
        );

        if (!isConversationDetail(payload?.conversation)) {
            throw new Error('Invalid /chat/:id payload shape');
        }

        return payload.conversation;
    },
});
