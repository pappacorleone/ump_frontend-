import type { ElevenLabsService } from './types'

/**
 * ElevenLabs text-to-speech service
 * 
 * Uses WebSocket for streaming TTS with low latency
 */
export function createElevenLabsService(): ElevenLabsService {
  let socket: WebSocket | null = null
  let audioContext: AudioContext | null = null
  let currentVoiceId = 'EXAVITQu4vr4xnSDxMaL' // Default: Sarah (calm, professional)
  let turnEagerness: 'eager' | 'normal' | 'patient' = 'patient'
  let apiKey: string | null = null
  let isConnected = false
  let audioQueue: AudioBuffer[] = []
  let isPlaying = false
  let speakingStartHandler: (() => void) | null = null
  let speakingEndHandler: (() => void) | null = null

  async function playAudioBuffer(buffer: AudioBuffer) {
    if (!audioContext) return

    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    
    return new Promise<void>((resolve) => {
      source.onended = () => resolve()
      source.start()
    })
  }

  async function processAudioQueue() {
    if (isPlaying || audioQueue.length === 0) return

    isPlaying = true
    if (speakingStartHandler) speakingStartHandler()

    while (audioQueue.length > 0) {
      const buffer = audioQueue.shift()
      if (buffer) {
        await playAudioBuffer(buffer)
      }
    }

    isPlaying = false
    if (speakingEndHandler) speakingEndHandler()
  }

  return {
    async connect(key: string, voiceId?: string): Promise<void> {
      apiKey = key
      if (voiceId) currentVoiceId = voiceId

      // Initialize audio context
      audioContext = new AudioContext()

      console.log('[ElevenLabs] Initialized')
      isConnected = true
    },

    async speak(text: string): Promise<void> {
      if (!apiKey || !audioContext) {
        console.log('[ElevenLabs] Not connected, simulating speech')
        if (speakingStartHandler) speakingStartHandler()
        await new Promise(resolve => setTimeout(resolve, text.length * 50))
        if (speakingEndHandler) speakingEndHandler()
        return
      }

      console.log(`[ElevenLabs] Speaking: "${text.substring(0, 50)}..."`)

      // Use REST API for simpler implementation
      // For production, consider WebSocket streaming for lower latency
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${currentVoiceId}/stream`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_turbo_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true,
              },
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        
        audioQueue.push(audioBuffer)
        processAudioQueue()
      } catch (error) {
        console.error('[ElevenLabs] Speech error:', error)
        throw error
      }
    },

    stop(): void {
      console.log('[ElevenLabs] Stopping speech')
      audioQueue = []
      // Note: Can't stop currently playing audio without more complex management
    },

    disconnect(): void {
      if (socket) {
        socket.close()
        socket = null
      }
      
      if (audioContext) {
        audioContext.close()
        audioContext = null
      }

      isConnected = false
      audioQueue = []
      isPlaying = false
    },

    setVoice(voiceId: string): void {
      console.log(`[ElevenLabs] Setting voice to: ${voiceId}`)
      currentVoiceId = voiceId
    },

    setTurnEagerness(level: 'eager' | 'normal' | 'patient'): void {
      console.log(`[ElevenLabs] Setting turn eagerness to: ${level}`)
      turnEagerness = level
    },

    onSpeakingStart(handler: () => void): void {
      speakingStartHandler = handler
    },

    onSpeakingEnd(handler: () => void): void {
      speakingEndHandler = handler
    },
  }
}

// Available voices for mediation (calm, professional)
export const MEDIATION_VOICES = {
  sarah: 'EXAVITQu4vr4xnSDxMaL', // Calm, professional female
  adam: '29vD33N1CtxCmqQRPOHJ', // Deep, calming male
  rachel: '21m00Tcm4TlvDq8ikWAM', // Clear, neutral female
}
