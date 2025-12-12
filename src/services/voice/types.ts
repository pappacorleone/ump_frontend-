// Voice service interfaces for real API integration

export interface TranscriptEvent {
  text: string
  speaker: string
  speakerConfidence: number
  isFinal: boolean
  timestamp: Date
}

export interface SpeakerChangeEvent {
  speakerId: string
  speakerName: string
  isActive: boolean
}

export interface ConnectionState {
  isConnected: boolean
  roomUrl?: string
  participants: Participant[]
}

export interface Participant {
  id: string
  name: string
  isLocal: boolean
  isSpeaking: boolean
}

export type TranscriptHandler = (event: TranscriptEvent) => void
export type SpeakerHandler = (event: SpeakerChangeEvent) => void
export type ConnectionHandler = (state: ConnectionState) => void

// Daily.co service interface
export interface DailyService {
  connect(roomUrl: string): Promise<void>
  disconnect(): void
  onConnectionChange(handler: ConnectionHandler): void
  getParticipants(): Participant[]
}

// Deepgram service interface
export interface DeepgramService {
  startTranscription(audioStream: MediaStream): void
  stopTranscription(): void
  onTranscript(handler: TranscriptHandler): void
  onSpeakerChange(handler: SpeakerHandler): void
}

// ElevenLabs service interface
export interface ElevenLabsService {
  speak(text: string): Promise<void>
  stop(): void
  setVoice(voiceId: string): void
  setTurnEagerness(level: 'eager' | 'normal' | 'patient'): void
}

// Unified voice session interface
export interface VoiceSession {
  connect(roomUrl: string): Promise<void>
  disconnect(): void
  startRecording(): Promise<void>
  stopRecording(): void
  onTranscript(handler: TranscriptHandler): void
  onSpeakerChange(handler: SpeakerHandler): void
  onConnectionChange(handler: ConnectionHandler): void
  speak(text: string): Promise<void>
}

