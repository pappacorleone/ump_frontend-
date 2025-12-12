import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui'

interface SessionHeaderProps {
  sessionId: string
  subject: string
  elapsedTime: string
  onEndSession: () => void
}

export default function SessionHeader({
  sessionId,
  subject,
  elapsedTime,
  onEndSession,
}: SessionHeaderProps) {
  const navigate = useNavigate()

  const handleEnd = () => {
    onEndSession()
    navigate(`/session/${sessionId}/log`)
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="live">Live</Badge>
          <span className="text-gray-700 font-medium uppercase tracking-wide text-sm">
            {subject}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-gray-500 font-mono text-sm">{elapsedTime}</span>
          <button
            onClick={handleEnd}
            className="text-red-accent hover:text-red-600 text-sm font-medium transition-colors"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  )
}

