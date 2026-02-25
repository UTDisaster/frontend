export type ChatRole = 'user' | 'assistant';

export interface ChatMessageRecord {
    id: string;
    role: ChatRole;
    content: string;
    timestamp: string;
    disaster_id?: string;
}

export interface ConversationSummary {
    id: string;
    title: string;
    updated_at: string;
}

export interface ConversationDetail {
    id: string;
    messages: ChatMessageRecord[];
    updated_at: string;
}

export interface ChatConversationsResponse {
    conversations: ConversationSummary[];
}

export interface ChatConversationResponse {
    conversation: ConversationDetail;
}

export interface ChatUserMessageEvent {
    type: 'chat.user_message';
    conversation_id: string;
    message: ChatMessageRecord;
}

export interface ChatAgentMessageEvent {
    type: 'chat.agent_message';
    conversation_id: string;
    message: ChatMessageRecord;
}

export interface ChatAckEvent {
    type: 'chat.ack';
    conversation_id: string;
    message_id: string;
}

export interface ChatErrorEvent {
    type: 'chat.error';
    error: string;
    conversation_id?: string;
    message_id?: string;
}

export type ChatOutboundEventEnvelope = ChatUserMessageEvent;

export type ChatInboundEventEnvelope =
    | ChatAgentMessageEvent
    | ChatAckEvent
    | ChatErrorEvent;
