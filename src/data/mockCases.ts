import type { Case } from '../types'

export const mockCases: Case[] = [
  {
    id: 'prev-001',
    subject: 'Equity Dilution Event',
    counterparty: 'Alex',
    status: 'resolved',
    createdAt: '2025-12-05',
    duration: '12m 34s',
    decisions: [
      'Prioritize Enterprise SSO in Q3',
      'Acknowledge $100k immediate revenue impact',
    ],
    commitments: [
      { owner: 'User', text: 'Send SOW to Enterprise clients by Friday.' },
      { owner: 'Alex', text: 'Update Sprint Board to reflect SSO priority.' },
    ],
  },
  {
    id: 'prev-002',
    subject: 'Marketing Budget Allocation',
    counterparty: 'Sarah',
    status: 'resolved',
    createdAt: '2025-11-28',
    duration: '08m 45s',
    decisions: [
      'Allocate 60% to digital channels',
      'Defer trade show investment to Q4',
    ],
    commitments: [
      { owner: 'User', text: 'Draft revised budget proposal by Monday.' },
      { owner: 'Sarah', text: 'Review agency contracts for flexibility.' },
    ],
  },
]

export function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part1}-${part2}`
}

