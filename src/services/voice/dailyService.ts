import Daily from '@daily-co/daily-js'
import type { DailyCall, DailyParticipant } from '@daily-co/daily-js'
import type { DailyService, ConnectionHandler, Participant } from './types'

/**
 * Daily.co WebRTC service
 * 
 * Provides real-time audio/video communication between participants
 */
export function createDailyService(): DailyService {
  let callFrame: DailyCall | null = null
  let connectionHandler: ConnectionHandler | null = null
  let participants: Participant[] = []
  let isConnected = false

  function mapParticipant(p: DailyParticipant): Participant {
    return {
      id: p.user_id || p.session_id,
      name: p.user_name || 'Unknown',
      isLocal: p.local,
      isSpeaking: p.tracks?.audio?.state === 'playable',
    }
  }

  function updateParticipants() {
    if (!callFrame) return

    const dailyParticipants = callFrame.participants()
    participants = Object.values(dailyParticipants).map(mapParticipant)

    if (connectionHandler) {
      connectionHandler({
        isConnected,
        roomUrl: (callFrame as DailyCall & { properties?: { url?: string } }).properties?.url,
        participants,
      })
    }
  }

  return {
    async connect(roomUrl: string, token?: string): Promise<void> {
      console.log('[Daily] Connecting to room:', roomUrl)

      try {
        // Create call frame if not exists
        if (!callFrame) {
          callFrame = Daily.createCallObject({
            audioSource: true,
            videoSource: false, // Audio only for mediation
          })

          // Set up event listeners
          callFrame.on('joined-meeting', () => {
            console.log('[Daily] Joined meeting')
            isConnected = true
            updateParticipants()
          })

          callFrame.on('left-meeting', () => {
            console.log('[Daily] Left meeting')
            isConnected = false
            participants = []
            if (connectionHandler) {
              connectionHandler({
                isConnected: false,
                participants: [],
              })
            }
          })

          callFrame.on('participant-joined', () => {
            console.log('[Daily] Participant joined')
            updateParticipants()
          })

          callFrame.on('participant-left', () => {
            console.log('[Daily] Participant left')
            updateParticipants()
          })

          callFrame.on('participant-updated', () => {
            updateParticipants()
          })

          callFrame.on('error', (event) => {
            console.error('[Daily] Error:', event)
          })
        }

        // Join the room
        const joinOptions: { url: string; token?: string } = { url: roomUrl }
        if (token) {
          joinOptions.token = token
        }

        await callFrame.join(joinOptions)
      } catch (error) {
        console.error('[Daily] Failed to connect:', error)
        throw error
      }
    },

    disconnect(): void {
      console.log('[Daily] Disconnecting')
      if (callFrame) {
        callFrame.leave()
        callFrame.destroy()
        callFrame = null
      }
      isConnected = false
      participants = []
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

    // Get the audio track for transcription
    getLocalAudioTrack(): MediaStreamTrack | null {
      if (!callFrame) return null

      const localParticipant = callFrame.participants().local
      if (!localParticipant?.tracks?.audio?.persistentTrack) {
        return null
      }

      return localParticipant.tracks.audio.persistentTrack
    },

    // Get all audio tracks (for mixing and sending to STT)
    getMixedAudioStream(): MediaStream | null {
      if (!callFrame) return null

      // Create a new MediaStream with all audio tracks
      const stream = new MediaStream()
      const participants = callFrame.participants()

      Object.values(participants).forEach(p => {
        if (p.tracks?.audio?.persistentTrack) {
          stream.addTrack(p.tracks.audio.persistentTrack)
        }
      })

      return stream.getTracks().length > 0 ? stream : null
    },

    // Set local audio enabled/disabled
    setAudioEnabled(enabled: boolean): void {
      if (callFrame) {
        callFrame.setLocalAudio(enabled)
      }
    },
  }
}
