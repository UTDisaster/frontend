const API_BASE_FALLBACK = 'http://127.0.0.1:8000';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const parseBooleanEnv = (value: unknown): boolean => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === '1' || normalized === 'true' ||
        normalized === 'yes' || normalized === 'on';
};

export interface ChatRuntimeConfig {
    apiBaseUrl: string;
    enableMockChat: boolean;
}

export const getChatRuntimeConfig = (): ChatRuntimeConfig => {
    const configuredApiBaseUrl = String(
        import.meta.env.VITE_API_BASE_URL ?? '',
    ).trim();
    const apiBaseUrl = trimTrailingSlash(
        configuredApiBaseUrl || API_BASE_FALLBACK,
    );

    return {
        apiBaseUrl,
        enableMockChat: parseBooleanEnv(import.meta.env.VITE_ENABLE_MOCK_CHAT),
    };
};
