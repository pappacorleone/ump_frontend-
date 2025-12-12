import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Link as LinkIcon, Copy, Check } from 'lucide-react'
import { Button } from '../components/ui'
import { useSession } from '../context/SessionContext'

export default function SessionLobby() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, updateStatus } = useSession()
  const [copied, setCopied] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const sessionUrl = `ump.ai/live/${id}`

  // Simulate connection after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true)
      updateStatus('connected')
    }, 3000)
    return () => clearTimeout(timer)
  }, [updateStatus])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sessionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnterSession = () => {
    updateStatus('active')
    navigate(`/session/${id}/live`)
  }

  const handleForceConnect = () => {
    setIsConnected(true)
    updateStatus('connected')
  }

  const counterpartyName = session?.counterparty || 'Counterparty'

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-16">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider">Cancel</span>
        </Link>
        <span className="text-xs uppercase tracking-widest text-gray-400">Case Configuration</span>
      </div>

      {/* Main content */}
      <div className="text-center">
        {/* Link icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-green-light rounded-full flex items-center justify-center">
          <LinkIcon className="w-7 h-7 text-green-accent" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Ready</h1>
        <p className="text-gray-500 mb-10">
          Waiting for <span className="font-semibold text-gray-700">{counterpartyName}</span> to connect.
        </p>

        {/* Shareable link */}
        <div className="border border-gray-200 rounded-sm p-4 flex items-center justify-between mb-6">
          <span className="text-gray-600 font-mono text-sm">{sessionUrl}</span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-green-accent" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Connection status */}
        {isConnected && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-5 h-5 border-2 border-green-accent rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-green-accent" />
            </div>
            <span className="text-sm uppercase tracking-wider text-green-accent">Connection Established</span>
          </div>
        )}

        {/* Enter Session button */}
        <Button
          onClick={handleEnterSession}
          disabled={!isConnected}
          className="w-full"
        >
          Enter Session
        </Button>

        {/* Dev force connect */}
        {!isConnected && (
          <button
            onClick={handleForceConnect}
            className="mt-6 text-xs text-gray-400 hover:text-gray-500 transition-colors"
          >
            [DEV: FORCE CONNECT]
          </button>
        )}
      </div>
    </div>
  )
}

