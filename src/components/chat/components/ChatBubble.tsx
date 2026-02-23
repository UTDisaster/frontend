import { formatMessageTime } from '../util';
import type { ChatMessage } from '../types';

interface ChatBubbleProps {
    message: ChatMessage;
}

const ChatBubble = ({ message }: ChatBubbleProps) => {
    const isUser = message.sender === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[90%] rounded-2xl px-3 py-2 shadow-sm ${
                    isUser
                        ? 'rounded-br-md bg-slate-900 text-white'
                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
                }`}
            >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                    className={`mt-1 text-xs ${
                        isUser ? 'text-slate-300' : 'text-slate-500'
                    }`}
                >
                    {formatMessageTime(message.sentAt)}
                </p>
            </div>
        </div>
    );
};

export default ChatBubble;
