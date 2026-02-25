import type {
    ChatMessageRecord,
    ChatRole,
    ConversationDetail,
} from './contracts';
import type { ChatConversation, ChatMessage, Sender } from './types';

const roleToSender: Record<ChatRole, Sender> = {
    user: 'user',
    assistant: 'agent',
};

const senderToRole: Record<Sender, ChatRole> = {
    user: 'user',
    agent: 'assistant',
};

export const mapMessageRecordToUiMessage = (
    record: ChatMessageRecord,
): ChatMessage => ({
    id: record.id,
    sender: roleToSender[record.role],
    text: record.content,
    sentAt: record.timestamp,
});

export const mapUiMessageToMessageRecord = (
    message: ChatMessage,
    disasterId?: string,
): ChatMessageRecord => ({
    id: message.id,
    role: senderToRole[message.sender],
    content: message.text,
    timestamp: message.sentAt,
    ...(disasterId ? { disaster_id: disasterId } : {}),
});

export const mapConversationDetailToUiConversation = (
    detail: ConversationDetail,
    title: string,
): ChatConversation => ({
    id: detail.id,
    title,
    updatedAt: detail.updated_at,
    messages: detail.messages.map(mapMessageRecordToUiMessage),
});
