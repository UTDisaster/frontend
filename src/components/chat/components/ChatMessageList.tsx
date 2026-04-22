import type { RefObject } from 'react';

import type { DisasterContext } from '../types';
import type { ChatMessage } from '../types';
import ChatBubble from './ChatBubble';

interface SuggestedPrompt {
    label: string;
    text: string;
}

const buildSuggestedPrompts = (disasterContext: DisasterContext | undefined): SuggestedPrompt[] => {
    const name = disasterContext?.name ?? 'this disaster';
    return [
        { label: 'Damage summary', text: `Damage summary for ${name}` },
        { label: 'Severely damaged buildings', text: 'How many severely damaged buildings are there?' },
        { label: 'Nearby damage', text: 'Show me damage near the city center' },
    ];
};

interface ChatMessageListProps {
    messages: ChatMessage[];
    listRef: RefObject<HTMLDivElement>;
    isThinking?: boolean;
    isEmptyChat?: boolean;
    disasterContext?: DisasterContext;
    onSuggestedPrompt?: (prompt: string) => void;
}

const ThinkingBubble = () => (
    <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
    </div>
);

const EmptyChatState = ({
    disasterContext,
    onSuggestedPrompt,
}: {
    disasterContext?: DisasterContext;
    onSuggestedPrompt?: (prompt: string) => void;
}) => {
    const prompts = buildSuggestedPrompts(disasterContext);
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
            <div>
                <p className="text-sm font-semibold text-slate-700">How can I help?</p>
                <p className="text-xs text-slate-500 mt-1">
                    Ask about damage levels, specific addresses, or streets.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {prompts.map((prompt) => (
                    <button
                        key={prompt.label}
                        type="button"
                        onClick={() => onSuggestedPrompt?.(prompt.text)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2
                                   text-left text-xs text-slate-700 shadow-sm
                                   transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        {prompt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ChatMessageList = ({
    messages,
    listRef,
    isThinking = false,
    isEmptyChat = false,
    disasterContext,
    onSuggestedPrompt,
}: ChatMessageListProps) => {
    return (
        <div
            ref={listRef}
            className="flex h-[360px] flex-col gap-3 overflow-y-auto px-4 py-4"
        >
            {isEmptyChat && !isThinking ? (
                <EmptyChatState
                    disasterContext={disasterContext}
                    onSuggestedPrompt={onSuggestedPrompt}
                />
            ) : (
                messages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                ))
            )}
            {isThinking && <ThinkingBubble />}
        </div>
    );
};

export default ChatMessageList;
