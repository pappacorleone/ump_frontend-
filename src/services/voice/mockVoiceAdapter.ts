import type {
  VoiceSession,
  TranscriptHandler,
  SpeakerHandler,
  ConnectionHandler,
  DailyService,
  DeepgramService,
  ElevenLabsService,
} from './types'
import { createDailyService } from './dailyService'
import { createDeepgramService } from './deepgramService'
import { createElevenLabsService } from './elevenLabsService'

interface VoiceSessionConfig {
  dailyApiKey?: string
  deepgramApiKey?: string
  elevenLabsApiKey?: string
  elevenLabsVoiceId?: string
}

/**
 * Voice session adapter that combines all voice services
 * Falls back to mock behavior when API keys are not provided
 */
export function createMockVoiceSession(config: VoiceSessionConfig = {}): VoiceSession {
  const daily: DailyService = createDailyService()
  const deepgram: DeepgramService = createDeepgramService()
  const elevenlabs: ElevenLabsService = createElevenLabsService()

  let transcriptHandler: TranscriptHandler | null = null
  let isRecording = false
  let isConnectedToDaily = false
  let isDeepgramConnected = false
  let isElevenLabsConnected = false

  return {
    async connect(roomUrl: string, token?: string): Promise<void> {
      console.log('[VoiceSession] Connecting to room:', roomUrl)
      
      await daily.connect(roomUrl, token)
      isConnectedToDaily = true

      // Connect to Deepgram if API key provided
      if (config.deepgramApiKey) {
        try {
          await deepgram.connect(config.deepgramApiKey)
          isDeepgramConnected = true
        } catch (error) {
          console.error('[VoiceSession] Failed to connect to Deepgram:', error)
        }
      }

      // Connect to ElevenLabs if API key provided
      if (config.elevenLabsApiKey) {
        try {
          await elevenlabs.connect(config.elevenLabsApiKey, config.elevenLabsVoiceId || undefined)
          isElevenLabsConnected = true
        } catch (error) {
          console.error('[VoiceSession] Failed to connect to ElevenLabs:', error)
        }
      }
    },

    disconnect(): void {
      console.log('[VoiceSession] Disconnecting')
      
      this.stopRecording()
      daily.disconnect()
      deepgram.disconnect()
      elevenlabs.disconnect()
      
      isConnectedToDaily = false
      isDeepgramConnected = false
      isElevenLabsConnected = false
    },

    async startRecording(): Promise<void> {
      console.log('[VoiceSession] Starting recording')
      isRecording = true

      // Get audio stream from Daily or microphone
      let audioStream: MediaStream | null = null

      if (isConnectedToDaily) {
        audioStream = daily.getMixedAudioStream()
      }

      // Fall back to direct microphone access
      if (!audioStream) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (error) {
          console.log('[VoiceSession] No microphone available')
          return
        }
      }

      // Start Deepgram transcription if connected
      if (isDeepgramConnected && audioStream) {
        deepgram.startTranscription(audioStream)
      }
    },

    stopRecording(): void {
      console.log('[VoiceSession] Stopping recording')
      isRecording = false
      deepgram.stopTranscription()
    },

    onTranscript(handler: TranscriptHandler): void {
      transcriptHandler = handler
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

    setAudioEnabled(enabled: boolean): void {
      daily.setAudioEnabled(enabled)
    },
  }
}

/**
 * Create a voice session with environment configuration
 */
export function createVoiceSession(): VoiceSession {
  const config: VoiceSessionConfig = {}

  // Read API keys from environment (Vite)
  if (typeof import.meta !== 'undefined') {
    config.deepgramApiKey = import.meta.env?.VITE_DEEPGRAM_API_KEY
    config.elevenLabsApiKey = import.meta.env?.VITE_ELEVENLABS_API_KEY
    config.elevenLabsVoiceId = import.meta.env?.VITE_ELEVENLABS_VOICE_ID
  }

  return createMockVoiceSession(config)
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
