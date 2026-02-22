export type Sender = 'user' | 'agent';

export interface ChatMessage {
    id: number;
    sender: Sender;
    text: string;
    sentAt: Date;
}
