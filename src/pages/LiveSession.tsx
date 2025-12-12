import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  TalkBalance,
  ProtocolPanel,
  TranscriptMessage,
  VoiceButton,
  SessionHeader,
  ElevenLabsAgent,
} from '../components/session'
import { useSession } from '../context/SessionContext'
import { useUser } from '../context/UserContext'
import { useElapsedTime, useVoiceSession } from '../hooks'
import { protocolRules } from '../data/protocolRules'
import { initialSystemMessage, mockScriptedResponses } from '../data/mockTranscripts'
import type { TranscriptMessage as TranscriptMessageType } from '../types'

export default function LiveSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { 
    session, 
    loadSession, 
    addMessage, 
    sendMessage,
    updateTalkBalance, 
    endSession, 
    addDecision, 
    addCommitment,
    isLoading 
  } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [activeRule, setActiveRule] = useState<number | undefined>()
  const { isRecording, simulateVoice } = useVoiceSession()
  const transcriptRef = useRef<HTMLDivElement>(null)
  const elapsedTime = useElapsedTime(session?.startTime)

  // Load session if not already loaded
  useEffect(() => {
    if (id && (!session || session.id !== id)) {
      loadSession(id).catch((err) => {
        console.error('Failed to load session:', err)
        navigate('/')
      })
    }
  }, [id, session, loadSession, navigate])

  // Initialize session with system message
  useEffect(() => {
    if (session && session.transcript.length === 0) {
      addMessage(initialSystemMessage(session.subject))
    }
  }, [session?.id, session?.transcript.length, session?.subject, addMessage])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [session?.transcript])

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-gray-500">Loading session...</div>
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Send message (this will add it locally and sync via WebSocket)
    await sendMessage(inputValue)

    // Check for protocol violations (AI mediator logic)
    const trigger = mockScriptedResponses.find(r => r.trigger.test(inputValue))
    if (trigger) {
      setTimeout(() => {
        const interventionMessage: TranscriptMessageType = {
          ...trigger.response,
          id: `sys-${Date.now()}`,
          timestamp: new Date(),
        }
        addMessage(interventionMessage)
        setActiveRule(trigger.response.ruleNumber)
        setTimeout(() => setActiveRule(undefined), 3000)
      }, 800)
    }

    // Update talk balance slightly
    const newUserPercent = Math.max(35, Math.min(65, session.talkBalance.user + (Math.random() - 0.5) * 10))
    updateTalkBalance(Math.round(newUserPercent), Math.round(100 - newUserPercent))

    setInputValue('')
  }

  const handleVoiceToggle = () => {
    simulateVoice((text) => {
      setInputValue(text)
    })
  }

  const handleEndSession = async () => {
    // Add mock decisions and commitments
    await addDecision('Prioritize Enterprise SSO in Q3')
    await addDecision('Acknowledge $100k immediate revenue impact')
    
    if (user) {
      await addCommitment({ owner: user.name, text: 'Send SOW to Enterprise clients by Friday.' })
    }
    await addCommitment({ owner: session.counterparty, text: 'Update Sprint Board to reflect SSO priority.' })
    
    await endSession()
    navigate(`/session/${id}/log`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <SessionHeader
        sessionId={id!}
        subject={session.subject}
        elapsedTime={elapsedTime}
        onEndSession={handleEndSession}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white p-6 overflow-y-auto">
          <TalkBalance
            userPercent={session.talkBalance.user}
            counterpartyPercent={session.talkBalance.counterparty}
            counterpartyName={session.counterparty}
          />
          <hr className="border-gray-200 my-6" />
          <ProtocolPanel rules={protocolRules} activeRule={activeRule} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="flex-1 overflow-y-auto p-6"
          >
            {session.startTime && (
              <div className="text-center text-xs uppercase tracking-wider text-gray-400 mb-4">
                Recording Started
              </div>
            )}
            
            {session.transcript.map((message) => (
              <TranscriptMessage key={message.id} message={message} />
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-center gap-4 max-w-3xl mx-auto">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
              <VoiceButton
                isRecording={isRecording}
                onToggle={handleVoiceToggle}
              />
              <ElevenLabsAgent onMessage={addMessage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
