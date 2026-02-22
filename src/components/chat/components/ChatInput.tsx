import { useLayoutEffect, useRef } from 'react';
import type { SubmitEventHandler } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    draft: string;
    onDraftChange: (value: string) => void;
    onSend: SubmitEventHandler<HTMLFormElement>;
}

const ChatInput = ({ draft, onDraftChange, onSend }: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useLayoutEffect(() => {
        if (!textareaRef.current) {
            return;
        }

        const maxHeight = 112;
        textareaRef.current.style.height = '0px';
        const nextHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
        textareaRef.current.style.height = `${nextHeight}px`;
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [draft]);

    return (
        <form
            onSubmit={onSend}
            className="border-t border-slate-900/10 bg-white/80 p-3"
        >
            <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-slate-900/40 focus-within:ring-2 focus-within:ring-slate-900/10">
                <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                        }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full resize-none bg-transparent py-1 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    aria-label="Send message"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </form>
    );
};

export default ChatInput;
