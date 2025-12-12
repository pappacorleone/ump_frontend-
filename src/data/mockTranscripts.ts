import type { TranscriptMessage } from '../types'

export const initialSystemMessage = (subject: string): TranscriptMessage => ({
  id: 'sys-init',
  type: 'system',
  content: `Session initialized. I have parsed the dispute subject: ${subject}.

My role is strictly to enforce the protocols on the left. I will only intervene if a rule is violated.

User, state your proposed decision in one sentence.`,
  timestamp: new Date(),
})

export const mockScriptedResponses: Array<{
  trigger: RegExp
  response: TranscriptMessage
}> = [
  {
    trigger: /last year|previous|before/i,
    response: {
      id: 'sys-violation-future',
      type: 'system',
      content: `PROTOCOL VIOLATION (Rule 3): Future Focused.
Referring to 'last year' is not relevant to the Q3 sprint decision. Please restate your objection using forward-looking impact.`,
      timestamp: new Date(),
      isViolation: true,
      ruleNumber: 3,
      ruleName: 'Future Focused',
    },
  },
  {
    trigger: /i feel|i think|i believe/i,
    response: {
      id: 'sys-warning-data',
      type: 'system',
      content: `PROTOCOL WARNING (Rule 2): Data Over Opinion.
Avoid starting sentences with 'I feel'. Counter the 20% drop-off statistic with data about Enterprise contract value.`,
      timestamp: new Date(),
      isViolation: false,
      ruleNumber: 2,
      ruleName: 'Data Over Opinion',
    },
  },
]

export const mockCounterpartyResponses: string[] = [
  "Fine. If we delay the dashboard, we risk losing 20% of our PLG funnel signups based on the current drop-off rate.",
  "I understand your position, but the enterprise clients have been waiting for 6 months already.",
  "Let me propose a compromise: we split the engineering team 60/40 between the two priorities.",
  "The data shows enterprise deals average $150k ARR versus $2k for self-serve. We need to prioritize accordingly.",
]

export function getCounterpartyResponse(index: number): string {
  return mockCounterpartyResponses[index % mockCounterpartyResponses.length]
}

