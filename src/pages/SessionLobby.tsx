import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Link as LinkIcon, Copy, Check } from 'lucide-react'
import { Button } from '../components/ui'
import { useSession } from '../context/SessionContext'
import { socketService } from '../services/api'

export default function SessionLobby() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, loadSession, updateStatus, isLoading } = useSession()
  const [copied, setCopied] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Load session if not already loaded
  useEffect(() => {
    if (id && (!session || session.id !== id)) {
      loadSession(id).catch((err) => {
        console.error('Failed to load session:', err)
        navigate('/')
      })
    }
  }, [id, session, loadSession, navigate])

  // Check if counterparty has connected
  useEffect(() => {
    if (session?.status === 'connected' || session?.counterpartyId) {
      setIsConnected(true)
    }
  }, [session?.status, session?.counterpartyId])

  // Listen for counterparty joining via WebSocket
  useEffect(() => {
    if (!session) return

    const unsub = socketService.onCounterpartyJoined(() => {
      setIsConnected(true)
    })

    return () => {
      unsub?.()
    }
  }, [session])

  const sessionUrl = `${window.location.origin}/join/${id}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sessionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnterSession = async () => {
    try {
      await updateStatus('active')
      navigate(`/session/${id}/live`)
    } catch (err) {
      console.error('Failed to start session:', err)
    }
  }

  if (isLoading || !session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  const counterpartyName = session.counterparty || 'Counterparty'

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
        <span className="text-xs uppercase tracking-widest text-gray-400">Session Lobby</span>
      </div>

      {/* Main content */}
      <div className="text-center">
        {/* Link icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-green-light rounded-full flex items-center justify-center">
          <LinkIcon className="w-7 h-7 text-green-accent" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Ready</h1>
        <p className="text-gray-500 mb-4">
          {isConnected ? (
            <>
              <span className="font-semibold text-gray-700">{counterpartyName}</span> has connected.
            </>
          ) : (
            <>
              Waiting for <span className="font-semibold text-gray-700">{counterpartyName}</span> to connect.
            </>
          )}
        </p>

        {/* Session subject */}
        <div className="text-sm text-gray-400 mb-8">
          Subject: <span className="text-gray-600">{session.subject}</span>
        </div>

        {/* Shareable link */}
        <div className="border border-gray-200 rounded-sm p-4 flex items-center justify-between mb-6">
          <span className="text-gray-600 font-mono text-sm truncate flex-1 text-left">{sessionUrl}</span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
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

        {!isConnected && (
          <p className="text-xs text-gray-400 mt-6">
            Share the link above with your counterparty. The session will start once they connect.
          </p>
        )}
      </div>
    </div>
  )
}
