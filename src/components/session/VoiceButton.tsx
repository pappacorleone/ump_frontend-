import { Mic } from 'lucide-react'

interface VoiceButtonProps {
  isRecording: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function VoiceButton({ isRecording, onToggle, disabled }: VoiceButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        w-14 h-14 rounded-full flex items-center justify-center
        transition-all duration-200
        ${isRecording 
          ? 'bg-red-accent text-white shadow-lg scale-110' 
          : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Mic className="w-6 h-6" />
    </button>
  )
}

