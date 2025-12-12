import type {
  VoiceSession,
  TranscriptHandler,
  SpeakerHandler,
  ConnectionHandler,
} from './types'
import { createDailyService } from './dailyService'
import { createDeepgramService } from './deepgramService'
import { createElevenLabsService } from './elevenLabsService'

/**
 * Mock voice adapter that combines all services
 * with simulated behavior for development/demo
 */
export function createMockVoiceSession(): VoiceSession {
  const daily = createDailyService()
  const deepgram = createDeepgramService()
  const elevenlabs = createElevenLabsService()

  let _transcriptHandler: TranscriptHandler | null = null
  let _isRecording = false

  return {
    async connect(roomUrl: string): Promise<void> {
      await daily.connect(roomUrl)
    },

    disconnect(): void {
      daily.disconnect()
      this.stopRecording()
    },

    async startRecording(): Promise<void> {
      console.log('[MockVoice] Starting recording')
      _isRecording = true

      // Simulate microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        deepgram.startTranscription(stream)
      } catch (error) {
        console.log('[MockVoice] No microphone available, using simulation')
      }
    },

    stopRecording(): void {
      console.log('[MockVoice] Stopping recording')
      _isRecording = false
      deepgram.stopTranscription()
    },

    onTranscript(handler: TranscriptHandler): void {
      _transcriptHandler = handler
      deepgram.onTranscript(handler)
    },

    onSpeakerChange(handler: SpeakerHandler): void {
      deepgram.onSpeakerChange(handler)
    },

    onConnectionChange(handler: ConnectionHandler): void {
      daily.onConnectionChange(handler)
    },

    async speak(text: string): Promise<void> {
      await elevenlabs.speak(text)
    },
  }
}

/**
 * Simulate a voice input for demo purposes
 * Returns a promise that resolves with the "transcribed" text
 */
export function simulateVoiceInput(durationMs: number = 2000): Promise<string> {
  const phrases = [
    "I think we should focus on enterprise",
    "The metrics show strong PLG growth",
    "I feel like this isn't being considered",
    "Last year we tried something similar",
  ]

  return new Promise((resolve) => {
    setTimeout(() => {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]
      resolve(phrase)
    }, durationMs)
  })
}

