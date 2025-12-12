import { createContext, useContext, useState, type ReactNode } from 'react'
import type { SessionState, TranscriptMessage, Commitment } from '../types'

interface SessionContextType {
  session: SessionState | null
  createSession: (id: string, subject: string, counterparty: string) => void
  updateStatus: (status: SessionState['status']) => void
  addMessage: (message: TranscriptMessage) => void
  updateTalkBalance: (user: number, counterparty: number) => void
  addDecision: (decision: string) => void
  addCommitment: (commitment: Commitment) => void
  endSession: () => void
  clearSession: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null)

  const createSession = (id: string, subject: string, counterparty: string) => {
    setSession({
      id,
      subject,
      counterparty,
      status: 'waiting',
      talkBalance: { user: 50, counterparty: 50 },
      transcript: [],
      decisions: [],
      commitments: [],
    })
  }

  const updateStatus = (status: SessionState['status']) => {
    setSession(prev => prev ? { ...prev, status, startTime: status === 'active' ? new Date() : prev.startTime } : null)
  }

  const addMessage = (message: TranscriptMessage) => {
    setSession(prev => prev ? { ...prev, transcript: [...prev.transcript, message] } : null)
  }

  const updateTalkBalance = (user: number, counterparty: number) => {
    setSession(prev => prev ? { ...prev, talkBalance: { user, counterparty } } : null)
  }

  const addDecision = (decision: string) => {
    setSession(prev => prev ? { ...prev, decisions: [...prev.decisions, decision] } : null)
  }

  const addCommitment = (commitment: Commitment) => {
    setSession(prev => prev ? { ...prev, commitments: [...prev.commitments, commitment] } : null)
  }

  const endSession = () => {
    setSession(prev => prev ? { ...prev, status: 'ended', endTime: new Date() } : null)
  }

  const clearSession = () => {
    setSession(null)
  }

  return (
    <SessionContext.Provider value={{
      session,
      createSession,
      updateStatus,
      addMessage,
      updateTalkBalance,
      addDecision,
      addCommitment,
      endSession,
      clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

