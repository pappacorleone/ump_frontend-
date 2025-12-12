import type { DailyService, ConnectionHandler, Participant } from './types'

/**
 * Daily.co WebRTC service
 * 
 * In production, this would use the @daily-co/daily-js SDK:
 * import Daily from '@daily-co/daily-js'
 * 
 * Configuration for mediation rooms:
 * POST https://api.daily.co/v1/rooms
 * {
 *   "name": "founder-mediation-session",
 *   "properties": {
 *     "max_participants": 4,
 *     "enable_recording": true,
 *     "start_audio_off": false
 *   }
 * }
 */
export function createDailyService(): DailyService {
  let connectionHandler: ConnectionHandler | null = null
  let participants: Participant[] = []
  let isConnected = false

  return {
    async connect(roomUrl: string): Promise<void> {
      console.log('[Daily] Connecting to room:', roomUrl)
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      isConnected = true
      participants = [
        { id: 'local', name: 'You', isLocal: true, isSpeaking: false },
        { id: 'remote-1', name: 'Counterparty', isLocal: false, isSpeaking: false },
      ]

      if (connectionHandler) {
        connectionHandler({
          isConnected: true,
          roomUrl,
          participants,
        })
      }
    },

    disconnect(): void {
      console.log('[Daily] Disconnecting')
      isConnected = false
      participants = []
      
      if (connectionHandler) {
        connectionHandler({
          isConnected: false,
          participants: [],
        })
      }
    },

    onConnectionChange(handler: ConnectionHandler): void {
      connectionHandler = handler
      
      // Send initial state
      handler({
        isConnected,
        participants,
      })
    },

    getParticipants(): Participant[] {
      return participants
    },
  }
}

