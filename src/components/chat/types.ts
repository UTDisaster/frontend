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
    /** True when the agent response triggered a map flyTo action. */
    hasFlyTo?: boolean;
}

export interface ChatConversation {
    id: string;
    title: string;
    updatedAt: string;
    messages: ChatMessage[];
}

/** Identifies which disaster the user currently has selected in the sidebar. */
export interface DisasterContext {
    id: string;
    name: string;
}
