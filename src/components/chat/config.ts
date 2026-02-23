export type ChatMode = 'mock' | 'live' | 'auto';

export interface ChatRuntimeConfig {
    apiBaseUrl: string;
    chatWsUrl: string;
    chatMode: ChatMode;
}

const normalizeMode = (value: string | undefined): ChatMode => {
    if (value === 'mock' || value === 'live' || value === 'auto') {
        return value;
    }

    return 'mock';
};

const withLeadingSlash = (value: string): string =>
    value.startsWith('/') ? value : `/${value}`;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const toWebsocketUrl = (rawUrl: string): string => {
    if (!rawUrl) {
        return '';
    }

    if (rawUrl.startsWith('/')) {
        if (typeof window === 'undefined') {
            return '';
        }

        const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
        return `${scheme}://${window.location.host}${rawUrl}`;
    }

    if (rawUrl.startsWith('ws://') || rawUrl.startsWith('wss://')) {
        return rawUrl;
    }

    if (rawUrl.startsWith('http://')) {
        return `ws://${rawUrl.slice('http://'.length)}`;
    }

    if (rawUrl.startsWith('https://')) {
        return `wss://${rawUrl.slice('https://'.length)}`;
    }

    return '';
};

export const getChatRuntimeConfig = (): ChatRuntimeConfig => {
    const apiBaseUrl = trimTrailingSlash(
        String(import.meta.env.VITE_API_BASE_URL ?? '').trim(),
    );
    const chatWsUrlRaw = String(import.meta.env.VITE_CHAT_WS_URL ?? '').trim();
    const chatMode = normalizeMode(
        String(import.meta.env.VITE_CHAT_MODE ?? '').trim(),
    );

    const chatWsUrlFromApi = apiBaseUrl
        ? `${toWebsocketUrl(apiBaseUrl)}${withLeadingSlash('/chat/ws')}`
        : '';
    const chatWsUrl = chatWsUrlRaw
        ? toWebsocketUrl(chatWsUrlRaw)
        : chatWsUrlFromApi;

    return {
        apiBaseUrl,
        chatWsUrl,
        chatMode,
    };
};
