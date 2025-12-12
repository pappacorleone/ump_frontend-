import { useCallback, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { Mic, MicOff } from 'lucide-react'
import type { TranscriptMessage } from '../../types'

const AGENT_ID = 'agent_0701kc7yyjwsf3gbh9f1rhz5s9y5'

interface ElevenLabsAgentProps {
  onMessage: (message: TranscriptMessage) => void
}

export default function ElevenLabsAgent({ onMessage }: ElevenLabsAgentProps) {
  const [isSessionActive, setIsSessionActive] = useState(false)

  const conversation = useConversation({
    onMessage: (message) => {
      // Handle messages from the conversation
      const transcriptMessage: TranscriptMessage = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: message.source === 'user' ? 'user' : 'system',
        speaker: message.source === 'user' ? undefined : 'AI Mediator',
        content: message.message,
        timestamp: new Date(),
      }
      onMessage(transcriptMessage)
    },
    onError: (error) => {
      console.error('[ElevenLabs Agent] Error:', error)
    },
    onConnect: () => {
      console.log('[ElevenLabs Agent] Connected')
    },
    onDisconnect: () => {
      console.log('[ElevenLabs Agent] Disconnected')
      setIsSessionActive(false)
    },
  })

  const handleToggle = useCallback(async () => {
    if (isSessionActive) {
      await conversation.endSession()
      setIsSessionActive(false)
    } else {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        await conversation.startSession({
          agentId: AGENT_ID,
          connectionType: 'webrtc',
        })
        setIsSessionActive(true)
      } catch (error) {
        console.error('[ElevenLabs Agent] Failed to start session:', error)
      }
    }
  }, [isSessionActive, conversation])

  const isConnecting = conversation.status === 'connecting'
  const isConnected = conversation.status === 'connected'

  return (
    <button
      onClick={handleToggle}
      disabled={isConnecting}
      className={`
        w-14 h-14 rounded-full flex items-center justify-center
        transition-all duration-200
        ${isSessionActive || isConnected
          ? 'bg-red-accent text-white shadow-lg scale-110' 
          : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
        }
        ${isConnecting ? 'opacity-50 cursor-not-allowed animate-pulse' : 'cursor-pointer'}
        ${conversation.isSpeaking ? 'ring-4 ring-blue-accent ring-opacity-50' : ''}
      `}
      title={isSessionActive ? 'Stop AI conversation' : 'Start AI conversation'}
    >
      {isSessionActive || isConnected ? (
        <MicOff className="w-6 h-6" />
      ) : (
        <Mic className="w-6 h-6" />
      )}
    </button>
  )
}
