const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export interface ChatRuntimeConfig {
    apiBaseUrl: string;
}

export const getChatRuntimeConfig = (): ChatRuntimeConfig => {
    const apiBaseUrl = trimTrailingSlash(
        String(import.meta.env.VITE_API_BASE_URL ?? '').trim(),
    );

    return {
        apiBaseUrl,
    };
};
