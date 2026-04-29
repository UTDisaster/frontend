const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export interface ChatRuntimeConfig {
    apiBaseUrl: string;
}

export const getChatRuntimeConfig = (): ChatRuntimeConfig => {
    const rawBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? '').trim();
    const apiBaseUrl = rawBaseUrl ? trimTrailingSlash(rawBaseUrl) : '';

    return {
        apiBaseUrl,
    };
};
