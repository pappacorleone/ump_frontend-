import type { TranscriptMessage as TranscriptMessageType } from '../../types'

interface TranscriptMessageProps {
  message: TranscriptMessageType
}

export default function TranscriptMessage({ message }: TranscriptMessageProps) {
  if (message.type === 'system') {
    return (
      <div className="border-l-4 border-navy-700 bg-gray-50 p-4 my-4">
        <div className="text-xs uppercase tracking-wider text-navy-700 font-semibold mb-2">
          System Intervention
        </div>
        <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  const isUser = message.type === 'user'
  
  return (
    <div className={`p-4 my-3 ${isUser ? 'bg-gray-50' : 'bg-white border border-gray-100'}`}>
      <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
        {message.speaker || (isUser ? 'You' : 'Counterparty')}
      </div>
      <div className="text-gray-800">
        {message.content}
      </div>
    </div>
  )
}

