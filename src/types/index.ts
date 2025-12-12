export interface User {
  id: string
  name: string
  email: string
  initials: string
}

export interface Case {
  id: string
  subject: string
  counterparty: string
  status: 'active' | 'resolved' | 'pending'
  createdAt: string
  duration?: string
  decisions?: string[]
  commitments?: Commitment[]
}

export interface Commitment {
  owner: string
  text: string
}

export interface TranscriptMessage {
  id: string
  type: 'user' | 'counterparty' | 'system'
  speaker?: string
  content: string
  timestamp: Date
  isViolation?: boolean
  ruleNumber?: number
  ruleName?: string
}

export interface ProtocolRule {
  number: number
  name: string
  description: string
  isActive?: boolean
}

export interface TalkBalance {
  user: number
  counterparty: number
}

export interface SessionState {
  id: string
  subject: string
  counterparty: string
  counterpartyId?: string | null
  isCreator?: boolean
  status: 'waiting' | 'pending' | 'connected' | 'active' | 'ended'
  startTime?: Date
  endTime?: Date
  talkBalance: TalkBalance
  transcript: TranscriptMessage[]
  decisions: string[]
  commitments: Commitment[]
  dailyRoomUrl?: string
}
