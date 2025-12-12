import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, List } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useSession } from '../context/SessionContext'
import { api } from '../services/api'
import type { Case } from '../types'

export default function SessionLog() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, loadSession, clearSession, isLoading } = useSession()
  const [caseData, setCaseData] = useState<Case | null>(null)

  // Load session if not in context
  useEffect(() => {
    if (id && (!session || session.id !== id)) {
      loadSession(id).catch((err) => {
        console.error('Failed to load session:', err)
      })
    }
  }, [id, session, loadSession])

  // Build case data from session
  useEffect(() => {
    if (session) {
      const endTime = session.endTime || new Date()
      const startTime = session.startTime || new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      const minutes = Math.floor(durationMs / 60000)
      const seconds = Math.floor((durationMs % 60000) / 1000)

      setCaseData({
        id: session.id,
        subject: session.subject,
        counterparty: session.counterparty,
        status: session.status === 'ended' ? 'resolved' : 'active',
        createdAt: startTime.toISOString().split('T')[0],
        duration: `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
        decisions: session.decisions,
        commitments: session.commitments,
      })
    } else if (id && !isLoading) {
      // Try to load outcomes directly from API
      Promise.all([
        api.getSession(id),
        api.getOutcomes(id),
      ]).then(([{ session: apiSession }, { decisions, commitments }]) => {
        const endTime = apiSession.ended_at ? new Date(apiSession.ended_at) : new Date()
        const startTime = apiSession.started_at ? new Date(apiSession.started_at) : new Date()
        const durationMs = endTime.getTime() - startTime.getTime()
        const minutes = Math.floor(durationMs / 60000)
        const seconds = Math.floor((durationMs % 60000) / 1000)

        setCaseData({
          id: apiSession.id,
          subject: apiSession.subject,
          counterparty: apiSession.counterparty_user_name || apiSession.counterparty_name,
          status: 'resolved',
          createdAt: startTime.toISOString().split('T')[0],
          duration: `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
          decisions: decisions.map(d => d.content),
          commitments: commitments.map(c => ({ owner: c.owner_name, text: c.content })),
        })
      }).catch((err) => {
        console.error('Failed to load session outcomes:', err)
      })
    }
  }, [session, id, isLoading])

  const handleCloseCase = () => {
    clearSession()
    navigate('/')
  }

  if (isLoading || !caseData) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">Loading session data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Log</h1>
        <p className="text-gray-600 mb-4">{caseData.subject}</p>
        <div className="flex items-center gap-6 text-sm text-gray-500 uppercase tracking-wider">
          <span>Duration: <span className="text-gray-700">{caseData.duration}</span></span>
          <span>Outcome: <span className="text-green-accent font-medium">Decision Locked</span></span>
        </div>
      </div>

      <hr className="border-gray-200 mb-8" />

      {/* Decisions */}
      {caseData.decisions && caseData.decisions.length > 0 && (
        <Card padding="lg" className="mb-6">
          <div className="flex items-center gap-2 text-green-accent mb-4">
            <Check className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-medium">Decisions</span>
          </div>
          <ul className="space-y-3">
            {caseData.decisions.map((decision, index) => (
              <li key={index} className="text-gray-800">
                {decision}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Commitments */}
      {caseData.commitments && caseData.commitments.length > 0 && (
        <Card padding="lg" className="mb-10">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <List className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-medium">Commitments</span>
          </div>
          <ul className="space-y-3">
            {caseData.commitments.map((commitment, index) => (
              <li key={index} className="text-gray-800">
                <span className="font-semibold">{commitment.owner}:</span> {commitment.text}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <hr className="border-gray-200 mb-8" />

      {/* Close Case Button */}
      <Button onClick={handleCloseCase} className="w-full">
        Close Case
      </Button>
    </div>
  )
}
