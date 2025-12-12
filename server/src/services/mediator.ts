import { Server as SocketServer } from 'socket.io'
import { pool } from '../db/pool.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Protocol rules that the AI mediator enforces
 */
export const PROTOCOL_RULES = [
  {
    number: 1,
    name: 'No Interruptions',
    description: 'Allow complete thoughts before responding',
    triggers: [], // Detected by talk balance and turn-taking
  },
  {
    number: 2,
    name: 'Data Over Opinion',
    description: 'Cite specific metrics or evidence, not feelings',
    triggers: [
      /\b(i feel|i think|i believe|in my opinion|i guess)\b/i,
    ],
    intervention: "Let's ground this in data. Can you cite specific metrics or evidence to support this point?",
  },
  {
    number: 3,
    name: 'Future Focused',
    description: 'No dredging up resolved past issues',
    triggers: [
      /\b(last year|last month|remember when|you always|you never|back when|previously)\b/i,
    ],
    intervention: "Let's stay focused on the current issue and future solutions. What specific outcome are you proposing?",
  },
  {
    number: 4,
    name: 'Binary Outcome',
    description: 'Commit to a decision by session end',
    triggers: [], // Enforced at session end
  },
]

interface TalkBalance {
  [speakerId: string]: number
}

interface SessionMediator {
  sessionId: string
  talkBalance: TalkBalance
  totalTalkTime: number
  lastSpeaker: string | null
  interventionCooldown: boolean
}

// Active mediator instances per session
const activeMediators = new Map<string, SessionMediator>()

/**
 * Initialize mediator for a session
 */
export function initializeMediator(sessionId: string): SessionMediator {
  const mediator: SessionMediator = {
    sessionId,
    talkBalance: {},
    totalTalkTime: 0,
    lastSpeaker: null,
    interventionCooldown: false,
  }
  
  activeMediators.set(sessionId, mediator)
  console.log(`[Mediator] Initialized for session ${sessionId}`)
  
  return mediator
}

/**
 * Get or create mediator for session
 */
export function getMediator(sessionId: string): SessionMediator {
  let mediator = activeMediators.get(sessionId)
  if (!mediator) {
    mediator = initializeMediator(sessionId)
  }
  return mediator
}

/**
 * Clean up mediator when session ends
 */
export function cleanupMediator(sessionId: string): void {
  activeMediators.delete(sessionId)
  console.log(`[Mediator] Cleaned up for session ${sessionId}`)
}

/**
 * Analyze transcript message for protocol violations
 */
export function analyzeMessage(content: string): { isViolation: boolean; ruleNumber?: number; ruleName?: string; intervention?: string } {
  for (const rule of PROTOCOL_RULES) {
    for (const trigger of rule.triggers) {
      if (trigger.test(content)) {
        return {
          isViolation: true,
          ruleNumber: rule.number,
          ruleName: rule.name,
          intervention: rule.intervention,
        }
      }
    }
  }
  
  return { isViolation: false }
}

/**
 * Update talk balance based on speaker
 */
export function updateTalkBalance(mediator: SessionMediator, speakerId: string, duration: number = 1): { user: number; counterparty: number } {
  // Initialize speaker if not seen
  if (!mediator.talkBalance[speakerId]) {
    mediator.talkBalance[speakerId] = 0
  }
  
  mediator.talkBalance[speakerId] += duration
  mediator.totalTalkTime += duration
  mediator.lastSpeaker = speakerId
  
  // Calculate percentages
  const speakers = Object.keys(mediator.talkBalance)
  if (speakers.length < 2) {
    return { user: 50, counterparty: 50 }
  }
  
  const [speaker1, speaker2] = speakers
  const total = mediator.talkBalance[speaker1] + mediator.talkBalance[speaker2]
  
  const userPercent = Math.round((mediator.talkBalance[speaker1] / total) * 100)
  const counterpartyPercent = 100 - userPercent
  
  return { user: userPercent, counterparty: counterpartyPercent }
}

/**
 * Check if talk balance is too imbalanced (one person dominating)
 */
export function checkTalkBalanceViolation(mediator: SessionMediator): { isViolation: boolean; intervention?: string } {
  const speakers = Object.keys(mediator.talkBalance)
  if (speakers.length < 2 || mediator.totalTalkTime < 10) {
    return { isViolation: false }
  }
  
  const [speaker1, speaker2] = speakers
  const total = mediator.talkBalance[speaker1] + mediator.talkBalance[speaker2]
  const ratio = mediator.talkBalance[speaker1] / total
  
  // Trigger if one person has more than 70% of talk time
  if (ratio > 0.7 || ratio < 0.3) {
    return {
      isViolation: true,
      intervention: "I notice the conversation is unbalanced. Let's ensure both parties have equal opportunity to speak.",
    }
  }
  
  return { isViolation: false }
}

/**
 * Process incoming transcript and generate interventions
 */
export async function processTranscript(
  io: SocketServer,
  sessionId: string,
  speakerId: string,
  speakerName: string,
  content: string
): Promise<void> {
  const mediator = getMediator(sessionId)
  
  // Update talk balance
  const talkBalance = updateTalkBalance(mediator, speakerId, content.split(' ').length)
  
  // Broadcast talk balance update
  io.to(`session:${sessionId}`).emit('talkbalance:update', talkBalance)
  
  // Check for protocol violations (with cooldown to avoid spamming)
  if (mediator.interventionCooldown) {
    return
  }
  
  // Analyze message content
  const analysis = analyzeMessage(content)
  
  if (analysis.isViolation && analysis.intervention) {
    mediator.interventionCooldown = true
    
    // Create system intervention message
    const messageId = uuidv4()
    
    // Store in database
    await pool.query(
      `INSERT INTO transcript_messages 
       (id, session_id, speaker_id, speaker_type, content, is_violation, rule_number)
       VALUES ($1, $2, NULL, 'system', $3, true, $4)`,
      [messageId, sessionId, analysis.intervention, analysis.ruleNumber]
    )
    
    // Broadcast intervention
    io.to(`session:${sessionId}`).emit('transcript:message', {
      id: messageId,
      speakerId: null,
      speakerName: 'AI Mediator',
      speakerType: 'system',
      content: analysis.intervention,
      isViolation: true,
      ruleNumber: analysis.ruleNumber,
      ruleName: analysis.ruleName,
      timestamp: new Date(),
    })
    
    console.log(`[Mediator] Intervention for rule ${analysis.ruleNumber}: ${analysis.ruleName}`)
    
    // Reset cooldown after 10 seconds
    setTimeout(() => {
      mediator.interventionCooldown = false
    }, 10000)
  }
  
  // Check talk balance (less frequently)
  if (mediator.totalTalkTime % 20 === 0) {
    const balanceCheck = checkTalkBalanceViolation(mediator)
    
    if (balanceCheck.isViolation && balanceCheck.intervention) {
      mediator.interventionCooldown = true
      
      const messageId = uuidv4()
      
      await pool.query(
        `INSERT INTO transcript_messages 
         (id, session_id, speaker_id, speaker_type, content, is_violation, rule_number)
         VALUES ($1, $2, NULL, 'system', $3, true, 1)`,
        [messageId, sessionId, balanceCheck.intervention]
      )
      
      io.to(`session:${sessionId}`).emit('transcript:message', {
        id: messageId,
        speakerId: null,
        speakerName: 'AI Mediator',
        speakerType: 'system',
        content: balanceCheck.intervention,
        isViolation: true,
        ruleNumber: 1,
        ruleName: 'No Interruptions',
        timestamp: new Date(),
      })
      
      setTimeout(() => {
        mediator.interventionCooldown = false
      }, 30000)
    }
  }
}

/**
 * Generate session summary with decisions prompts
 */
export function generateSessionSummary(transcript: { content: string; speakerType: string }[]): {
  suggestedDecisions: string[]
  suggestedCommitments: string[]
} {
  // In a real implementation, this would use an LLM to analyze the transcript
  // For now, return placeholder suggestions
  
  const hasEnterpriseMention = transcript.some(m => 
    /enterprise|b2b|sso|sales/i.test(m.content)
  )
  
  const hasPLGMention = transcript.some(m => 
    /plg|product.led|self.serve|growth/i.test(m.content)
  )
  
  const suggestedDecisions: string[] = []
  const suggestedCommitments: string[] = []
  
  if (hasEnterpriseMention && hasPLGMention) {
    suggestedDecisions.push('Prioritize enterprise features in Q3 while maintaining PLG foundation')
    suggestedDecisions.push('Allocate 60% engineering to enterprise, 40% to PLG')
  } else if (hasEnterpriseMention) {
    suggestedDecisions.push('Focus on enterprise sales enablement')
  } else if (hasPLGMention) {
    suggestedDecisions.push('Double down on PLG growth strategy')
  }
  
  suggestedCommitments.push('Review decision in 30 days')
  suggestedCommitments.push('Share progress in weekly sync')
  
  return { suggestedDecisions, suggestedCommitments }
}
