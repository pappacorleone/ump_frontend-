import type { ProtocolRule } from '../../types'
import { Badge } from '../ui'

interface ProtocolPanelProps {
  rules: ProtocolRule[]
  activeRule?: number
}

export default function ProtocolPanel({ rules, activeRule }: ProtocolPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-widest text-gray-400">Protocol</h3>
        <Badge variant="success">Active</Badge>
      </div>

      <div className="space-y-1">
        {rules.map((rule) => {
          const isHighlighted = activeRule === rule.number
          
          return (
            <div
              key={rule.number}
              className={`
                py-3 px-3 -mx-3 rounded-sm transition-colors duration-200
                ${isHighlighted ? 'bg-red-50 border-l-4 border-red-accent' : ''}
              `}
            >
              <div className={`text-sm font-medium ${isHighlighted ? 'text-red-accent' : 'text-gray-800'}`}>
                {rule.number}. {rule.name}
              </div>
              <div className={`text-xs mt-0.5 ${isHighlighted ? 'text-red-accent/80' : 'text-gray-500'}`}>
                {rule.description}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

