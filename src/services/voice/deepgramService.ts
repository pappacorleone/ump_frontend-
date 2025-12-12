import type { DeepgramService, TranscriptHandler, SpeakerHandler } from './types'

/**
 * Deepgram Flux speech-to-text service
 * 
 * In production, this would use WebSocket connection:
 * wss://api.deepgram.com/v2/listen
 * 
 * Parameters:
 *   model=flux-general-en    # Conversational speech recognition
 *   diarize=true             # Speaker identification
 *   punctuate=true           # Auto-punctuation
 *   smart_format=true        # Format numbers, dates
 *   utterances=true          # Semantic segmentation
 * 
 * Flux provides ~260ms end-of-turn latency with events:
 * - StartOfTurn: User began speaking
 * - Update: Ongoing transcription
 * - EagerEndOfTurn: Moderate confidence turn complete
 * - EndOfTurn: High confidence turn complete
 * - TurnResumed: User continued speaking
 */
export function createDeepgramService(): DeepgramService {
  let _transcriptHandler: TranscriptHandler | null = null
  let _speakerHandler: SpeakerHandler | null = null
  let _isTranscribing = false

  return {
    startTranscription(_audioStream: MediaStream): void {
      console.log('[Deepgram] Starting transcription')
      _isTranscribing = true
      
      // In production, would pipe audioStream to Deepgram WebSocket
      // const socket = new WebSocket('wss://api.deepgram.com/v2/listen?...')
      // socket.send(audioData)
    },

    stopTranscription(): void {
      console.log('[Deepgram] Stopping transcription')
      _isTranscribing = false
    },

    onTranscript(handler: TranscriptHandler): void {
      _transcriptHandler = handler
      
      // Expose for mock adapter to use
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__deepgramTranscriptHandler = handler
      }
    },

    onSpeakerChange(handler: SpeakerHandler): void {
      _speakerHandler = handler
      
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__deepgramSpeakerHandler = handler
      }
    },
  }
}

// Helper to emit mock transcripts (used by mock adapter)
export function emitMockTranscript(text: string, speaker: string): void {
  const handler = (window as unknown as Record<string, TranscriptHandler | undefined>).__deepgramTranscriptHandler
  if (handler) {
    handler({
      text,
      speaker,
      speakerConfidence: 0.95,
      isFinal: true,
      timestamp: new Date(),
    })
  }
}

