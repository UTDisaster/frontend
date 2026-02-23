import { createMockChatTransport } from './mockChatTransport';
import type { ChatTransport } from './types';

export const createChatTransport = (): ChatTransport =>
    createMockChatTransport();
