import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { SessionState, TranscriptMessage, Commitment } from '../types'
import { api, socketService } from '../services/api'
import type { SessionData } from '../services/api'
import { useUser } from './UserContext'

interface SessionContextType {
  session: SessionState | null
  isLoading: boolean
  createSession: (subject: string, counterpartyName: string) => Promise<string>
  loadSession: (id: string) => Promise<void>
  joinSession: (id: string) => Promise<void>
  updateStatus: (status: SessionState['status']) => Promise<void>
  addMessage: (message: TranscriptMessage) => void
  sendMessage: (content: string) => Promise<void>
  updateTalkBalance: (user: number, counterparty: number) => void
  addDecision: (decision: string) => Promise<void>
  addCommitment: (commitment: Commitment) => Promise<void>
  endSession: () => Promise<void>
  clearSession: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

function convertApiSessionToState(apiSession: SessionData, userId: string): SessionState {
  const isCreator = apiSession.creator_id === userId
  
  return {
    id: apiSession.id,
    subject: apiSession.subject,
    counterparty: isCreator 
      ? (apiSession.counterparty_user_name || apiSession.counterparty_name)
      : apiSession.creator_name,
    counterpartyId: isCreator ? apiSession.counterparty_id : apiSession.creator_id,
    isCreator,
    status: apiSession.status,
    startTime: apiSession.started_at ? new Date(apiSession.started_at) : undefined,
    endTime: apiSession.ended_at ? new Date(apiSession.ended_at) : undefined,
    talkBalance: { user: 50, counterparty: 50 },
    transcript: [],
    decisions: [],
    commitments: [],
    dailyRoomUrl: apiSession.daily_room_url || undefined,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [session, setSession] = useState<SessionState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Set up WebSocket listeners when session changes
  useEffect(() => {
    if (!session) return

    // Join WebSocket room
    socketService.joinSession(session.id)

    // Listen for incoming messages
    const unsubMessage = socketService.onTranscriptMessage((message) => {
      // Determine speaker type based on who sent it
      const speakerType = message.speakerType === 'system' 
        ? 'system' 
        : (message.speakerId === user?.id ? 'user' : 'counterparty')

      setSession(prev => prev ? {
        ...prev,
        transcript: [...prev.transcript, {
          id: message.id,
          type: speakerType,
          speaker: message.speakerName,
          content: message.content,
          timestamp: new Date(message.timestamp),
          isViolation: message.isViolation,
          ruleNumber: message.ruleNumber,
          ruleName: message.ruleName,
        }],
      } : null)
    })

    // Listen for talk balance updates
    const unsubBalance = socketService.onTalkBalanceUpdate((data) => {
      setSession(prev => prev ? {
        ...prev,
        talkBalance: { user: data.user, counterparty: data.counterparty },
      } : null)
    })

    // Listen for status changes
    const unsubStatus = socketService.onStatusChanged((data) => {
      setSession(prev => prev ? {
        ...prev,
        status: data.status as SessionState['status'],
        startTime: data.status === 'active' ? new Date() : prev.startTime,
        endTime: data.status === 'ended' ? new Date() : prev.endTime,
      } : null)
    })

    // Listen for counterparty joining
    const unsubJoin = socketService.onCounterpartyJoined((data) => {
      setSession(prev => prev ? {
        ...prev,
        status: 'connected',
        counterparty: data.counterpartyName,
        counterpartyId: data.counterpartyId,
      } : null)
    })

    // Listen for user joining
    const unsubUserJoin = socketService.onUserJoined((data) => {
      console.log(`[Session] ${data.userName} joined the session`)
    })

    // Listen for decisions
    const unsubDecision = socketService.onDecisionAdded((data) => {
      setSession(prev => prev ? {
        ...prev,
        decisions: [...prev.decisions, data.content],
      } : null)
    })

    // Listen for commitments
    const unsubCommitment = socketService.onCommitmentAdded((data) => {
      setSession(prev => prev ? {
        ...prev,
        commitments: [...prev.commitments, {
          owner: data.ownerId === user?.id ? user.name : session.counterparty,
          text: data.content,
        }],
      } : null)
    })

    return () => {
      unsubMessage()
      unsubBalance()
      unsubStatus()
      unsubJoin()
      unsubUserJoin()
      unsubDecision()
      unsubCommitment()
      socketService.leaveSession(session.id)
    }
  }, [session?.id, user?.id])

  const createSession = useCallback(async (subject: string, counterpartyName: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated')
    
    setIsLoading(true)
    try {
      const { session: apiSession } = await api.createSession(subject, counterpartyName)
      
      // Create Daily room for the session
      await api.createDailyRoom(apiSession.id)
      
      // Refresh session data
      const { session: updatedSession } = await api.getSession(apiSession.id)
      
      setSession(convertApiSessionToState(updatedSession, user.id))
      return apiSession.id
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadSession = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated')
    
    setIsLoading(true)
    try {
      const { session: apiSession } = await api.getSession(id)
      const sessionState = convertApiSessionToState(apiSession, user.id)
      
      // Load transcript
      const { messages } = await api.getTranscript(id)
      sessionState.transcript = messages.map(msg => ({
        id: msg.id,
        type: msg.speaker_type,
        speaker: msg.speaker_name || undefined,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isViolation: msg.is_violation,
        ruleNumber: msg.rule_number || undefined,
      }))
      
      // Load outcomes
      const { decisions, commitments } = await api.getOutcomes(id)
      sessionState.decisions = decisions.map(d => d.content)
      sessionState.commitments = commitments.map(c => ({
        owner: c.owner_name,
        text: c.content,
      }))
      
      setSession(sessionState)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const joinSession = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated')
    
    await api.joinSession(id)
    await loadSession(id)
  }, [user, loadSession])

  const updateStatus = useCallback(async (status: SessionState['status']) => {
    if (!session) return
    
    await api.updateSessionStatus(session.id, status)
    setSession(prev => prev ? {
      ...prev,
      status,
      startTime: status === 'active' ? new Date() : prev.startTime,
      endTime: status === 'ended' ? new Date() : prev.endTime,
    } : null)
  }, [session])

  const addMessage = useCallback((message: TranscriptMessage) => {
    setSession(prev => prev ? {
      ...prev,
      transcript: [...prev.transcript, message],
    } : null)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!session || !user) return
    
    // Determine speaker type
    const speakerType = session.isCreator ? 'user' : 'counterparty'
    
    // Add message locally first for immediate feedback
    const localMessage: TranscriptMessage = {
      id: `local-${Date.now()}`,
      type: 'user',
      speaker: user.name,
      content,
      timestamp: new Date(),
    }
    addMessage(localMessage)
    
    // Send to API
    await api.addMessage(session.id, content, speakerType)
    
    // Also broadcast via WebSocket for real-time sync
    socketService.sendTranscriptMessage(session.id, content, speakerType)
  }, [session, user, addMessage])

  const updateTalkBalance = useCallback((userPercent: number, counterpartyPercent: number) => {
    if (!session) return
    
    setSession(prev => prev ? {
      ...prev,
      talkBalance: { user: userPercent, counterparty: counterpartyPercent },
    } : null)
    
    // Broadcast to other participant
    socketService.sendTalkBalanceUpdate(session.id, userPercent, counterpartyPercent)
  }, [session])

  const addDecision = useCallback(async (decision: string) => {
    if (!session) return
    
    await api.addDecision(session.id, decision)
    setSession(prev => prev ? {
      ...prev,
      decisions: [...prev.decisions, decision],
    } : null)
  }, [session])

  const addCommitment = useCallback(async (commitment: Commitment) => {
    if (!session || !user) return
    
    const ownerId = commitment.owner === user.name ? user.id : session.counterpartyId
    if (!ownerId) return
    
    await api.addCommitment(session.id, commitment.text, ownerId)
    setSession(prev => prev ? {
      ...prev,
      commitments: [...prev.commitments, commitment],
    } : null)
  }, [session, user])

  const endSession = useCallback(async () => {
    if (!session) return
    
    await api.updateSessionStatus(session.id, 'ended')
    setSession(prev => prev ? {
      ...prev,
      status: 'ended',
      endTime: new Date(),
    } : null)
  }, [session])

  const clearSession = useCallback(() => {
    setSession(null)
  }, [])

  return (
    <SessionContext.Provider value={{
      session,
      isLoading,
      createSession,
      loadSession,
      joinSession,
      updateStatus,
      addMessage,
      sendMessage,
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
