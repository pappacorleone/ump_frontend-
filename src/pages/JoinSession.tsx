import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Check } from 'lucide-react'
import { Button } from '../components/ui'
import { useUser } from '../context/UserContext'
import { api, socketService } from '../services/api'
import type { SessionData } from '../services/api'

export default function JoinSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useUser()
  const [session, setSession] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [hasJoined, setHasJoined] = useState(false)

  // Fetch session details
  useEffect(() => {
    if (!id) return

    api.getSession(id)
      .then(({ session: sessionData }) => {
        setSession(sessionData)
        // Check if already joined
        if (user && sessionData.counterparty_id === user.id) {
          setHasJoined(true)
        }
      })
      .catch((err) => {
        setError(err.message || 'Session not found')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [id, user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: `/join/${id}` } })
    }
  }, [authLoading, isAuthenticated, navigate, id])

  const handleJoin = async () => {
    if (!id) return

    setIsJoining(true)
    setError('')

    try {
      await api.joinSession(id)
      setHasJoined(true)
      // Join the WebSocket room
      socketService.joinSession(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session')
    } finally {
      setIsJoining(false)
    }
  }

  const handleEnterSession = () => {
    navigate(`/session/${id}/live`)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link to="/" className="text-green-600 hover:text-green-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!session) return null

  // Check if user is the creator
  const isCreator = user?.id === session.creator_id

  if (isCreator) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">This is Your Session</h1>
          <p className="text-gray-500 mb-8">
            You created this session. Share the link with your counterparty.
          </p>
          <Button onClick={() => navigate(`/session/${id}/lobby`)}>
            Go to Session Lobby
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-16">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider">Back</span>
        </Link>
        <span className="text-xs uppercase tracking-widest text-gray-400">Join Session</span>
      </div>

      {/* Main content */}
      <div className="text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
          <Users className="w-7 h-7 text-blue-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Join Mediation Session
        </h1>
        <p className="text-gray-500 mb-6">
          <span className="font-semibold text-gray-700">{session.creator_name}</span> has invited you to a mediation session.
        </p>

        {/* Session details */}
        <div className="border border-gray-200 rounded-sm p-6 mb-8 text-left">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Subject</div>
            <div className="text-gray-900 font-medium">{session.subject}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Initiated by</div>
            <div className="text-gray-900 font-medium">{session.creator_name}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-sm border border-red-200 mb-6">
            {error}
          </div>
        )}

        {hasJoined ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-5 h-5 border-2 border-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-green-500" />
              </div>
              <span className="text-sm uppercase tracking-wider text-green-500">Joined Successfully</span>
            </div>
            <Button onClick={handleEnterSession} className="w-full">
              Enter Session
            </Button>
          </>
        ) : (
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </Button>
        )}

        <p className="text-xs text-gray-400 mt-6">
          By joining, you agree to participate in good faith and follow the mediation protocols.
        </p>
      </div>
    </div>
  )
}
