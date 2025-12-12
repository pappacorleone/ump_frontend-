import type { ElevenLabsService } from './types'

/**
 * ElevenLabs text-to-speech service
 * 
 * In production, this would use ElevenLabs API:
 * - WebSocket for streaming TTS
 * - Multi-context for interruption handling
 * 
 * Voice selection criteria:
 * - Calm, professional, gender-neutral
 * - Avoid voices that sound too young, authoritative, or regionally distinctive
 * 
 * Turn eagerness settings:
 * - 'eager': Responds quickly (inappropriate for mediation)
 * - 'normal': Balanced turn-taking
 * - 'patient': Recommended for mediation - gives parties time to complete thoughts
 */
export function createElevenLabsService(): ElevenLabsService {
  let currentVoice = 'calm-professional'
  let turnEagerness: 'eager' | 'normal' | 'patient' = 'patient'

  return {
    async speak(text: string): Promise<void> {
      console.log(`[ElevenLabs] Speaking with voice ${currentVoice}, eagerness: ${turnEagerness}`)
      console.log(`[ElevenLabs] Text: "${text}"`)
      
      // In production, would stream audio through ElevenLabs WebSocket
      // and play through Web Audio API
      
      // Simulate speech duration based on text length
      const duration = Math.min(text.length * 50, 5000)
      await new Promise(resolve => setTimeout(resolve, duration))
    },

    stop(): void {
      console.log('[ElevenLabs] Stopping speech')
      // Would cancel ongoing TTS stream
    },

    setVoice(voiceId: string): void {
      console.log(`[ElevenLabs] Setting voice to: ${voiceId}`)
      currentVoice = voiceId
    },

    setTurnEagerness(level: 'eager' | 'normal' | 'patient'): void {
      console.log(`[ElevenLabs] Setting turn eagerness to: ${level}`)
      turnEagerness = level
    },
  }
}

