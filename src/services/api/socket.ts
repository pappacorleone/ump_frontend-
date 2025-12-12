import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

class SocketService {
  private socket: Socket | null = null
  private sessionId: string | null = null

  connect(token: string) {
    if (this.socket?.connected) {
      return
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('[Socket] Connected')
      // Rejoin session if we were in one
      if (this.sessionId) {
        this.joinSession(this.sessionId)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message)
    })

    this.socket.on('error', (error: { message: string }) => {
      console.error('[Socket] Error:', error.message)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.sessionId = null
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Session management
  joinSession(sessionId: string) {
    this.sessionId = sessionId
    this.socket?.emit('session:join', sessionId)
  }

  leaveSession(sessionId: string) {
    this.socket?.emit('session:leave', sessionId)
    if (this.sessionId === sessionId) {
      this.sessionId = null
    }
  }

  // Event listeners
  onSessionJoined(callback: (data: { sessionId: string; memberCount: number; session: unknown }) => void) {
    this.socket?.on('session:joined', callback)
    return () => this.socket?.off('session:joined', callback)
  }

  onUserJoined(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('session:user-joined', callback)
    return () => this.socket?.off('session:user-joined', callback)
  }

  onUserLeft(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('session:user-left', callback)
    return () => this.socket?.off('session:user-left', callback)
  }

  onCounterpartyJoined(callback: (data: { sessionId: string; counterpartyId: string; counterpartyName: string }) => void) {
    this.socket?.on('session:counterparty-joined', callback)
    return () => this.socket?.off('session:counterparty-joined', callback)
  }

  onStatusChanged(callback: (data: { sessionId: string; status: string }) => void) {
    this.socket?.on('session:status-changed', callback)
    return () => this.socket?.off('session:status-changed', callback)
  }

  onTranscriptMessage(callback: (message: {
    id: string
    speakerId: string
    speakerName: string
    speakerType: 'user' | 'counterparty' | 'system'
    content: string
    isViolation?: boolean
    ruleNumber?: number
    ruleName?: string
    timestamp: Date
  }) => void) {
    this.socket?.on('transcript:message', callback)
    return () => this.socket?.off('transcript:message', callback)
  }

  onTalkBalanceUpdate(callback: (data: { user: number; counterparty: number }) => void) {
    this.socket?.on('talkbalance:update', callback)
    return () => this.socket?.off('talkbalance:update', callback)
  }

  onDecisionAdded(callback: (data: { sessionId: string; decisionId: string; content: string }) => void) {
    this.socket?.on('decision:add', callback)
    return () => this.socket?.off('decision:add', callback)
  }

  onCommitmentAdded(callback: (data: { sessionId: string; commitmentId: string; ownerId: string; content: string }) => void) {
    this.socket?.on('commitment:add', callback)
    return () => this.socket?.off('commitment:add', callback)
  }

  onTypingStart(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('typing:start', callback)
    return () => this.socket?.off('typing:start', callback)
  }

  onTypingStop(callback: (data: { userId: string }) => void) {
    this.socket?.on('typing:stop', callback)
    return () => this.socket?.off('typing:stop', callback)
  }

  // Emit events
  sendTranscriptMessage(sessionId: string, content: string, speakerType: 'user' | 'counterparty') {
    this.socket?.emit('transcript:message', { sessionId, content, speakerType })
  }

  sendTalkBalanceUpdate(sessionId: string, user: number, counterparty: number) {
    this.socket?.emit('talkbalance:update', { sessionId, user, counterparty })
  }

  sendTypingStart(sessionId: string) {
    this.socket?.emit('typing:start', sessionId)
  }

  sendTypingStop(sessionId: string) {
    this.socket?.emit('typing:stop', sessionId)
  }
}

export const socketService = new SocketService()
