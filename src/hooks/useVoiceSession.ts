import { useState, useEffect, useCallback, useRef } from 'react'
import { createVoiceSession, simulateVoiceInput } from '../services/voice'
import type { VoiceSession, ConnectionState, TranscriptEvent } from '../services/voice'
import { api } from '../services/api'

interface UseVoiceSessionOptions {
  sessionId?: string
  autoConnect?: boolean
}

interface UseVoiceSessionReturn {
  isConnected: boolean
  isRecording: boolean
  isSpeaking: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  toggleRecording: () => Promise<void>
  simulateVoice: (callback: (text: string) => void) => void
  connectionState: ConnectionState | null
  lastTranscript: TranscriptEvent | null
  connect: () => Promise<void>
  disconnect: () => void
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}): UseVoiceSessionReturn {
  const { sessionId, autoConnect = false } = options
  
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null)
  const [lastTranscript, setLastTranscript] = useState<TranscriptEvent | null>(null)
  
  const voiceSessionRef = useRef<VoiceSession | null>(null)
  const roomUrlRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)

  // Initialize voice session
  useEffect(() => {
    voiceSessionRef.current = createVoiceSession()

    voiceSessionRef.current.onConnectionChange((state) => {
      setIsConnected(state.isConnected)
      setConnectionState(state)
    })

    voiceSessionRef.current.onTranscript((event) => {
      setLastTranscript(event)
    })

    return () => {
      voiceSessionRef.current?.disconnect()
    }
  }, [])

  // Get room URL and token when sessionId changes
  useEffect(() => {
    if (!sessionId) return

    api.getDailyToken(sessionId)
      .then(({ token, roomUrl }) => {
        roomUrlRef.current = roomUrl
        tokenRef.current = token

        if (autoConnect && voiceSessionRef.current) {
          voiceSessionRef.current.connect(roomUrl, token)
        }
      })
      .catch((error) => {
        console.error('[useVoiceSession] Failed to get Daily token:', error)
      })
  }, [sessionId, autoConnect])

  const connect = useCallback(async () => {
    if (!voiceSessionRef.current || !roomUrlRef.current) {
      console.error('[useVoiceSession] Cannot connect: no room URL')
      return
    }

    await voiceSessionRef.current.connect(roomUrlRef.current, tokenRef.current || undefined)
  }, [])

  const disconnect = useCallback(() => {
    voiceSessionRef.current?.disconnect()
  }, [])

  const startRecording = useCallback(async () => {
    if (voiceSessionRef.current) {
      await voiceSessionRef.current.startRecording()
      setIsRecording(true)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.stopRecording()
      setIsRecording(false)
    }
  }, [])

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const simulateVoice = useCallback((callback: (text: string) => void) => {
    setIsRecording(true)
    simulateVoiceInput(2000).then((text) => {
      setIsRecording(false)
      callback(text)
    })
  }, [])

  return {
    isConnected,
    isRecording,
    isSpeaking,
    startRecording,
    stopRecording,
    toggleRecording,
    simulateVoice,
    connectionState,
    lastTranscript,
    connect,
    disconnect,
  }
}
