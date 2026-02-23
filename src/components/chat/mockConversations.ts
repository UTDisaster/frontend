import type { ChatConversation } from './types';

const mockConversations: ChatConversation[] = [
    {
        id: 'conv-downtown-damage',
        title: 'Downtown Damage Scan',
        updatedAt: '2026-02-22T23:24:00.000Z',
        messages: [
            {
                id: 'agent-1',
                sender: 'agent',
                text: 'Hi! Ask me anything about this disaster.',
                sentAt: '2026-02-22T23:16:00.000Z',
            },
            {
                id: 'user-1',
                sender: 'user',
                text: 'What locations report the highest severity of damage?',
                sentAt: '2026-02-22T23:19:00.000Z',
            },
            {
                id: 'agent-2',
                sender: 'agent',
                text: 'The downtown blocks near Cedar Avenue currently show the highest severity indicators.',
                sentAt: '2026-02-22T23:24:00.000Z',
            },
        ],
    },
    {
        id: 'conv-shelter-resources',
        title: 'Shelter Resource Check',
        updatedAt: '2026-02-22T22:11:00.000Z',
        messages: [
            {
                id: 'agent-3',
                sender: 'agent',
                text: 'Need a quick shelter and supplies summary?',
                sentAt: '2026-02-22T22:04:00.000Z',
            },
            {
                id: 'user-2',
                sender: 'user',
                text: 'Yes, focus on shelter capacity and available med kits.',
                sentAt: '2026-02-22T22:07:00.000Z',
            },
            {
                id: 'agent-4',
                sender: 'agent',
                text: 'North Hall Shelter has the most open capacity, and med kit inventory is stable in zones 2 and 3.',
                sentAt: '2026-02-22T22:11:00.000Z',
            },
        ],
    },
    {
        id: 'conv-road-closures',
        title: 'Road Closure Questions',
        updatedAt: '2026-02-22T21:37:00.000Z',
        messages: [
            {
                id: 'agent-5',
                sender: 'agent',
                text: 'I can summarize road closure status and reroute options.',
                sentAt: '2026-02-22T21:30:00.000Z',
            },
            {
                id: 'user-3',
                sender: 'user',
                text: 'Which routes are still open for emergency vehicles?',
                sentAt: '2026-02-22T21:33:00.000Z',
            },
            {
                id: 'agent-6',
                sender: 'agent',
                text: 'Route 8 and West Loop remain open for emergency traffic. East Bridge is closed pending inspection.',
                sentAt: '2026-02-22T21:37:00.000Z',
            },
        ],
    },
];

export default mockConversations;
