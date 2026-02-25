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
                content: 'I can help you explore Hurricane Florence damage assessments from our VLM pipeline. Ask about specific areas, severity, or comparisons with ground truth.',
                timestamp: '2026-02-22T23:16:00.000Z',
            },
            {
                id: 'user-1',
                role: 'user',
                content: 'Which blocks have the highest damage severity in the Florence dataset?',
                timestamp: '2026-02-22T23:19:00.000Z',
            },
            {
                id: 'agent-2',
                role: 'assistant',
                content: 'The worst-hit blocks in the current view are along the coastal corridor—roof collapse and debris fields are most common there. The VLM classified 12 structures as "major" or "destroyed" in that sector. I can highlight them on the map if you’d like.',
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
                content: 'You can ask about damage by street, building, or severity class. I’ll use our stored predictions and, when relevant, FEMA ground truth.',
                timestamp: '2026-02-22T22:04:00.000Z',
            },
            {
                id: 'user-2',
                role: 'user',
                content: 'Summarize the damage for the houses on Oak Street between 1st and 5th.',
                timestamp: '2026-02-22T22:07:00.000Z',
            },
            {
                id: 'agent-4',
                role: 'assistant',
                content: 'On that stretch we have 8 assessed structures: 3 minor, 2 major, 2 destroyed, 1 no visible change. The VLM noted roof damage and standing water for the major/destroyed ones. I can show the pre/post crops for any address if you click a polygon on the map.',
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
                content: 'Ask about predictions, ground truth, or where the model disagrees with FEMA labels.',
                timestamp: '2026-02-22T21:30:00.000Z',
            },
            {
                id: 'user-3',
                role: 'user',
                content: 'Are there any buildings where VLM predictions and FEMA ground truth don’t match?',
                timestamp: '2026-02-22T21:33:00.000Z',
            },
            {
                id: 'agent-6',
                role: 'assistant',
                content: 'Yes. In the current disaster view there are 7 mismatches: 4 where the VLM said "major" but ground truth is "minor" (often shadows or occlusion), and 3 the other way. Those are flagged in the evaluation module for confusion-matrix and per-class F1. I can list addresses or show them on the map.',
                timestamp: '2026-02-22T21:37:00.000Z',
            },
        ],
    },
};

const summaries: ConversationSummary[] = [
    {
        id: 'conv-downtown-damage',
        title: 'Worst-hit blocks (Florence)',
        updated_at: details['conv-downtown-damage'].updated_at,
    },
    {
        id: 'conv-shelter-resources',
        title: 'Oak St damage summary',
        updated_at: details['conv-shelter-resources'].updated_at,
    },
    {
        id: 'conv-road-closures',
        title: 'VLM vs FEMA mismatches',
        updated_at: details['conv-road-closures'].updated_at,
    },
];

const mockConversations: MockConversationsDataset = {
    summaries,
    details,
};

export default mockConversations;
