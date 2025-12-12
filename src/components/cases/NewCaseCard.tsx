import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card } from '../ui'

export default function NewCaseCard() {
  const navigate = useNavigate()

  return (
    <Card
      hover
      padding="lg"
      onClick={() => navigate('/case/new')}
      className="flex flex-col items-start gap-4"
    >
      <div className="flex items-center justify-between w-full">
        <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center">
          <Plus className="w-5 h-5 text-gray-600" />
        </div>
        <span className="text-xs uppercase tracking-widest text-gray-400">New Session</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Open New Case</h3>
        <p className="text-gray-500">Define the conflict subject and generate a secure mediation link.</p>
      </div>
    </Card>
  )
}

