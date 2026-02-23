export type Sender = 'user' | 'agent';

export type ChatConnectionState =
    | 'connecting'
    | 'connected'
    | 'error'
    | 'disconnected';

export interface ChatMessage {
    id: string;
    sender: Sender;
    text: string;
    sentAt: string;
}

export interface ChatConversation {
    id: string;
    title: string;
    updatedAt: string;
    messages: ChatMessage[];
}
