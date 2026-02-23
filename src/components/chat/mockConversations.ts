import type { ConversationDetail, ConversationSummary } from './contracts';

interface MockConversationsDataset {
    summaries: ConversationSummary[];
    details: Record<string, ConversationDetail>;
}

const details: Record<string, ConversationDetail> = {
    'conv-downtown-damage': {
        id: 'conv-downtown-damage',
        updated_at: '2026-02-22T23:24:00.000Z',
        messages: [
            {
                id: 'agent-1',
                role: 'assistant',
                content: 'Hi! Ask me anything about this disaster.',
                timestamp: '2026-02-22T23:16:00.000Z',
            },
            {
                id: 'user-1',
                role: 'user',
                content: 'What locations report the highest severity of damage?',
                timestamp: '2026-02-22T23:19:00.000Z',
            },
            {
                id: 'agent-2',
                role: 'assistant',
                content: 'The downtown blocks near Cedar Avenue currently show the highest severity indicators.',
                timestamp: '2026-02-22T23:24:00.000Z',
            },
        ],
    },
    'conv-shelter-resources': {
        id: 'conv-shelter-resources',
        updated_at: '2026-02-22T22:11:00.000Z',
        messages: [
            {
                id: 'agent-3',
                role: 'assistant',
                content: 'Need a quick shelter and supplies summary?',
                timestamp: '2026-02-22T22:04:00.000Z',
            },
            {
                id: 'user-2',
                role: 'user',
                content: 'Yes, focus on shelter capacity and available med kits.',
                timestamp: '2026-02-22T22:07:00.000Z',
            },
            {
                id: 'agent-4',
                role: 'assistant',
                content: 'North Hall Shelter has the most open capacity, and med kit inventory is stable in zones 2 and 3.',
                timestamp: '2026-02-22T22:11:00.000Z',
            },
        ],
    },
    'conv-road-closures': {
        id: 'conv-road-closures',
        updated_at: '2026-02-22T21:37:00.000Z',
        messages: [
            {
                id: 'agent-5',
                role: 'assistant',
                content: 'I can summarize road closure status and reroute options.',
                timestamp: '2026-02-22T21:30:00.000Z',
            },
            {
                id: 'user-3',
                role: 'user',
                content: 'Which routes are still open for emergency vehicles?',
                timestamp: '2026-02-22T21:33:00.000Z',
            },
            {
                id: 'agent-6',
                role: 'assistant',
                content: 'Route 8 and West Loop remain open for emergency traffic. East Bridge is closed pending inspection.',
                timestamp: '2026-02-22T21:37:00.000Z',
            },
        ],
    },
};

const summaries: ConversationSummary[] = [
    {
        id: 'conv-downtown-damage',
        title: 'Downtown Damage Scan',
        updated_at: details['conv-downtown-damage'].updated_at,
    },
    {
        id: 'conv-shelter-resources',
        title: 'Shelter Resource Check',
        updated_at: details['conv-shelter-resources'].updated_at,
    },
    {
        id: 'conv-road-closures',
        title: 'Road Closure Questions',
        updated_at: details['conv-road-closures'].updated_at,
    },
];

const mockConversations: MockConversationsDataset = {
    summaries,
    details,
};

export default mockConversations;
