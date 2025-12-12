import { useState, useEffect } from 'react'
import { NewCaseCard, CaseCard } from '../components/cases'
import { api } from '../services/api'
import type { SessionData } from '../services/api'
import type { Case } from '../types'

function sessionToCase(session: SessionData): Case {
  return {
    id: session.id,
    subject: session.subject,
    counterparty: session.counterparty_user_name || session.counterparty_name,
    status: session.status === 'ended' ? 'resolved' : session.status === 'pending' ? 'pending' : 'active',
    createdAt: session.created_at,
    duration: session.started_at && session.ended_at
      ? formatDuration(new Date(session.started_at), new Date(session.ended_at))
      : undefined,
  }
}

function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getSessions()
      .then(({ sessions: data }) => {
        setSessions(data.map(sessionToCase))
      })
      .catch((err) => {
        console.error('Failed to load sessions:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Dispute Resolution</h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          Ump is an impartial automated mediator. It enforces conversation protocols to ensure productive conflict resolution between founders.
        </p>
      </div>

      {/* New Case Card */}
      <div className="mb-10">
        <NewCaseCard />
      </div>

      {/* Divider */}
      <hr className="border-gray-200 mb-8" />

      {/* Recent Cases */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recent Cases</h2>
        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500 text-sm">No sessions yet. Create your first case above.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((caseData) => (
              <CaseCard key={caseData.id} caseData={caseData} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
