interface TalkBalanceProps {
  userPercent: number
  counterpartyPercent: number
  counterpartyName: string
}

export default function TalkBalance({
  userPercent,
  counterpartyPercent,
  counterpartyName,
}: TalkBalanceProps) {
  return (
    <div className="mb-8">
      <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Talk Balance</h3>
      
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-600">
          <span className="font-semibold">YOU</span> {userPercent}%
        </span>
        <span className="text-gray-600">
          {counterpartyPercent}% <span className="font-semibold uppercase">{counterpartyName}</span>
        </span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        <div
          className="bg-navy-900 transition-all duration-500"
          style={{ width: `${userPercent}%` }}
        />
        <div
          className="bg-green-accent transition-all duration-500"
          style={{ width: `${counterpartyPercent}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Aim for equal distribution of voice.
      </p>
    </div>
  )
}

