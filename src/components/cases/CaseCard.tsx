import { useNavigate } from 'react-router-dom'
import type { Case } from '../../types'
import { Card, Badge } from '../ui'

interface CaseCardProps {
  caseData: Case
}

export default function CaseCard({ caseData }: CaseCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (caseData.status === 'resolved') {
      navigate(`/session/${caseData.id}/log`)
    } else if (caseData.status === 'active') {
      navigate(`/session/${caseData.id}/live`)
    }
  }

  return (
    <Card
      hover
      padding="md"
      onClick={handleClick}
      className="flex items-center justify-between"
    >
      <span className="text-gray-800">{caseData.subject}</span>
      <Badge variant={caseData.status === 'resolved' ? 'success' : 'default'}>
        {caseData.status}
      </Badge>
    </Card>
  )
}

