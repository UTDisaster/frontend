import type {
    ChatConversationResponse,
    ChatConversationsResponse,
    ChatMessageRecord,
    ConversationDetail,
    ConversationSummary,
} from '../../contracts';
import type { ChatHistoryClient } from './types';

type BackendConversationSummary = {
    id: number | string;
    title?: string | null;
    created_at?: string;
    updated_at?: string;
    last_reply?: string | null;
};

type BackendConversationMessage = {
    turn_index?: number;
    role?: string;
    content?: string;
    created_at?: string;
    timestamp?: string;
    id?: string | number;
    disaster_id?: string;
};

type BackendConversationDetail = {
    id?: number | string;
    title?: string | null;
    created_at?: string;
    updated_at?: string;
    messages?: BackendConversationMessage[];
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

const normalizeSummary = (
    value: BackendConversationSummary,
): ConversationSummary => ({
    id: String(value.id),
    title: value.title ?? 'Untitled chat',
    updated_at: value.updated_at ?? value.created_at ?? new Date(0).toISOString(),
});

const normalizeMessage = (
    conversationId: string,
    value: BackendConversationMessage | ChatMessageRecord,
    index: number,
): ChatMessageRecord => {
    if (isChatMessageRecord(value)) {
        return value;
    }

    const role = value.role === 'assistant' ? 'assistant' : 'user';
    const timestamp =
        value.timestamp ?? value.created_at ?? new Date(0).toISOString();
    const id = value.id
        ? String(value.id)
        : `${conversationId}-${value.turn_index ?? index}`;

    return {
        id,
        role,
        content: value.content ?? '',
        timestamp,
        ...(value.disaster_id ? { disaster_id: value.disaster_id } : {}),
    };
};

const normalizeDetail = (
    payload: unknown,
    conversationId: string,
): ConversationDetail => {
    if (isConversationDetail(payload)) {
        return payload;
    }

    const record = payload as BackendConversationDetail | null;
    const messages = Array.isArray(record?.messages)
        ? record.messages.map((message, index) =>
              normalizeMessage(conversationId, message, index),
          )
        : [];
    const updatedAt =
        record?.updated_at ??
        messages[messages.length - 1]?.timestamp ??
        record?.created_at ??
        new Date(0).toISOString();

    return {
        id: String(record?.id ?? conversationId),
        updated_at: updatedAt,
        messages,
    };
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
        const payload = await readJson<unknown>(response, '/chat/conversations');

        if (Array.isArray(payload)) {
            return payload.map((item) => normalizeSummary(item as BackendConversationSummary));
        }

        const wrapper = payload as ChatConversationsResponse & {
            conversations?: BackendConversationSummary[];
        };
        if (Array.isArray(wrapper?.conversations)) {
            return wrapper.conversations.map((item) => normalizeSummary(item));
        }

        throw new Error('Invalid /chat/conversations payload shape');
    },
    async getConversation(conversationId) {
        const primaryPath = `/chat/conversations/${conversationId}`;
        let response = await fetch(`${apiBaseUrl}${primaryPath}`);
        if (response.status === 404) {
            response = await fetch(`${apiBaseUrl}/chat/${conversationId}`);
        }

        const payload = await readJson<unknown>(response, primaryPath);
        if (
            payload &&
            typeof payload === 'object' &&
            'conversation' in payload &&
            isConversationDetail((payload as ChatConversationResponse).conversation)
        ) {
            return (payload as ChatConversationResponse).conversation;
        }

        return normalizeDetail(payload, conversationId);
    },
});
