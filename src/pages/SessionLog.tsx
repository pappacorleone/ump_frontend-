import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, List } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useSession } from '../context/SessionContext'
import { mockCases } from '../data/mockCases'
import type { Case } from '../types'

export default function SessionLog() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, clearSession } = useSession()
  const [caseData, setCaseData] = useState<Case | null>(null)

  // Try to get from session context first, then fall back to mock data
  useEffect(() => {
    if (session && session.status === 'ended') {
      // Create case data from session
      const endTime = session.endTime || new Date()
      const startTime = session.startTime || new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      const minutes = Math.floor(durationMs / 60000)
      const seconds = Math.floor((durationMs % 60000) / 1000)

      setCaseData({
        id: session.id,
        subject: session.subject,
        counterparty: session.counterparty,
        status: 'resolved',
        createdAt: startTime.toISOString().split('T')[0],
        duration: `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
        decisions: session.decisions,
        commitments: session.commitments,
      })
    } else {
      // Fall back to mock data for direct navigation
      const mockCase = mockCases.find(c => c.id === id)
      if (mockCase) {
        setCaseData(mockCase)
      }
    }
  }, [session, id])

  const handleCloseCase = () => {
    clearSession()
    navigate('/')
  }

  if (!caseData) {
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

