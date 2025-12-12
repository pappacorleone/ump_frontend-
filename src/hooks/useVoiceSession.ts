import { useState, useEffect, useCallback, useRef } from 'react'
import { createMockVoiceSession, simulateVoiceInput } from '../services/voice'
import type { VoiceSession, ConnectionState } from '../services/voice'

interface UseVoiceSessionReturn {
  isConnected: boolean
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  simulateVoice: (callback: (text: string) => void) => void
  connectionState: ConnectionState | null
}

export function useVoiceSession(roomUrl?: string): UseVoiceSessionReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null)
  const voiceSessionRef = useRef<VoiceSession | null>(null)

  useEffect(() => {
    // Initialize voice session
    voiceSessionRef.current = createMockVoiceSession()

    voiceSessionRef.current.onConnectionChange((state) => {
      setIsConnected(state.isConnected)
      setConnectionState(state)
    })

    // Connect if room URL provided
    if (roomUrl) {
      voiceSessionRef.current.connect(roomUrl)
    }

    return () => {
      voiceSessionRef.current?.disconnect()
    }
  }, [roomUrl])

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
    startRecording,
    stopRecording,
    simulateVoice,
    connectionState,
  }
}

