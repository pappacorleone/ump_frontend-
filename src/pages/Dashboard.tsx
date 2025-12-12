import { NewCaseCard, CaseCard } from '../components/cases'
import { mockCases } from '../data/mockCases'

export default function Dashboard() {
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
        <div className="space-y-3">
          {mockCases.map((caseData) => (
            <CaseCard key={caseData.id} caseData={caseData} />
          ))}
        </div>
      </div>
    </div>
  )
}

