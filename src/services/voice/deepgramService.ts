import type { DeepgramService, TranscriptHandler, SpeakerHandler } from './types'

/**
 * Deepgram speech-to-text service
 * 
 * Uses WebSocket for real-time transcription with speaker diarization
 */
export function createDeepgramService(): DeepgramService {
  let socket: WebSocket | null = null
  let mediaRecorder: MediaRecorder | null = null
  let transcriptHandler: TranscriptHandler | null = null
  let speakerHandler: SpeakerHandler | null = null
  let isTranscribing = false
  let currentSpeaker: string | null = null

  return {
    async connect(apiKey: string): Promise<void> {
      if (socket?.readyState === WebSocket.OPEN) {
        return
      }

      return new Promise((resolve, reject) => {
        // Deepgram WebSocket URL with configuration
        const url = new URL('wss://api.deepgram.com/v1/listen')
        url.searchParams.set('model', 'nova-2')
        url.searchParams.set('language', 'en')
        url.searchParams.set('punctuate', 'true')
        url.searchParams.set('diarize', 'true')
        url.searchParams.set('smart_format', 'true')
        url.searchParams.set('utterances', 'true')
        url.searchParams.set('interim_results', 'true')

        socket = new WebSocket(url.toString(), ['token', apiKey])

        socket.onopen = () => {
          console.log('[Deepgram] Connected')
          resolve()
        }

        socket.onerror = (error) => {
          console.error('[Deepgram] WebSocket error:', error)
          reject(error)
        }

        socket.onclose = (event) => {
          console.log('[Deepgram] Disconnected:', event.code, event.reason)
          isTranscribing = false
        }

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
              const alternative = data.channel.alternatives[0]
              const transcript = alternative.transcript

              if (transcript && transcript.trim()) {
                // Extract speaker from diarization
                const words = alternative.words || []
                let speaker = 'unknown'
                
                if (words.length > 0 && words[0].speaker !== undefined) {
                  speaker = `Speaker ${words[0].speaker}`
                }

                // Notify speaker change
                if (speaker !== currentSpeaker && speakerHandler) {
                  if (currentSpeaker) {
                    speakerHandler({
                      speakerId: currentSpeaker,
                      speakerName: currentSpeaker,
                      isActive: false,
                    })
                  }
                  speakerHandler({
                    speakerId: speaker,
                    speakerName: speaker,
                    isActive: true,
                  })
                  currentSpeaker = speaker
                }

                // Send transcript
                if (transcriptHandler) {
                  transcriptHandler({
                    text: transcript,
                    speaker,
                    speakerConfidence: alternative.confidence || 0,
                    isFinal: data.is_final || false,
                    timestamp: new Date(),
                  })
                }
              }
            }
          } catch (error) {
            console.error('[Deepgram] Error parsing message:', error)
          }
        }
      })
    },

    startTranscription(audioStream: MediaStream): void {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('[Deepgram] Not connected')
        return
      }

      if (isTranscribing) {
        console.log('[Deepgram] Already transcribing')
        return
      }

      console.log('[Deepgram] Starting transcription')
      isTranscribing = true

      // Create MediaRecorder to capture audio
      const options = { mimeType: 'audio/webm;codecs=opus' }
      
      try {
        mediaRecorder = new MediaRecorder(audioStream, options)
      } catch (e) {
        // Fallback for browsers that don't support webm
        try {
          mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/mp4' })
        } catch (e2) {
          mediaRecorder = new MediaRecorder(audioStream)
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
          socket.send(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('[Deepgram] MediaRecorder error:', event)
      }

      // Record in small chunks for real-time streaming
      mediaRecorder.start(250) // 250ms chunks
    },

    stopTranscription(): void {
      console.log('[Deepgram] Stopping transcription')
      isTranscribing = false

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
        mediaRecorder = null
      }
    },

    disconnect(): void {
      this.stopTranscription()
      
      if (socket) {
        socket.close()
        socket = null
      }

      currentSpeaker = null
    },

    onTranscript(handler: TranscriptHandler): void {
      transcriptHandler = handler
    },

    onSpeakerChange(handler: SpeakerHandler): void {
      speakerHandler = handler
    },
  }
}

// Helper to emit mock transcripts (for testing without API key)
export function emitMockTranscript(text: string, speaker: string): void {
  console.log('[Deepgram Mock] Transcript:', text, 'Speaker:', speaker)
}
