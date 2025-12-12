import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Input, TextArea } from '../components/ui'
import { useSession } from '../context/SessionContext'

export default function CaseConfig() {
  const navigate = useNavigate()
  const { createSession, isLoading } = useSession()
  const [counterparty, setCounterparty] = useState('')
  const [subject, setSubject] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const sessionId = await createSession(
        subject || 'General Dispute',
        counterparty || 'Counterparty'
      )
      navigate(`/session/${sessionId}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    }
  }

  const isValid = counterparty.trim().length > 0 || subject.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider">Cancel</span>
        </Link>
        <span className="text-xs uppercase tracking-widest text-gray-400">Case Configuration</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Case Parameters</h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-sm border border-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <Input
            id="counterparty"
            label="Counterparty Name"
            placeholder="e.g. Co-founder Name"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
          />

          <TextArea
            id="subject"
            label="Dispute Subject"
            hint="Define the specific decision or disagreement. This sets the context for the AI referee."
            placeholder="e.g. Disagreement over product roadmap priorities for Q3. I want to focus on enterprise features, they want to focus on PLG growth."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="mt-10">
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Creating Session...' : 'Initialize Session'}
          </Button>
        </div>
      </form>
    </div>
  )
}
