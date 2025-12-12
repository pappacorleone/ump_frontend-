import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../db/pool.js'
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Add message to transcript
router.post('/:sessionId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params
    const { content, speakerType, isViolation, ruleNumber } = req.body
    const userId = req.user!.id

    // Verify user is part of session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
      [sessionId, userId]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const messageId = uuidv4()
    await pool.query(
      `INSERT INTO transcript_messages 
       (id, session_id, speaker_id, speaker_type, content, is_violation, rule_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [messageId, sessionId, userId, speakerType || 'user', content, isViolation || false, ruleNumber || null]
    )

    const message = {
      id: messageId,
      sessionId,
      speakerId: userId,
      speakerName: req.user!.name,
      speakerType: speakerType || 'user',
      content,
      isViolation: isViolation || false,
      ruleNumber: ruleNumber || null,
      timestamp: new Date(),
    }

    // Notify via WebSocket
    const io = req.app.get('io')
    if (io) {
      io.to(`session:${sessionId}`).emit('transcript:message', message)
    }

    res.status(201).json(message)
  } catch (error) {
    console.error('[Transcripts] Add message error:', error)
    res.status(500).json({ error: 'Failed to add message' })
  }
})

// Add system message (for AI mediator)
router.post('/:sessionId/system-message', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params
    const { content, isViolation, ruleNumber, ruleName } = req.body
    const userId = req.user!.id

    // Verify user is part of session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
      [sessionId, userId]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const messageId = uuidv4()
    await pool.query(
      `INSERT INTO transcript_messages 
       (id, session_id, speaker_id, speaker_type, content, is_violation, rule_number)
       VALUES ($1, $2, NULL, 'system', $3, $4, $5)`,
      [messageId, sessionId, content, isViolation || false, ruleNumber || null]
    )

    const message = {
      id: messageId,
      sessionId,
      speakerType: 'system',
      content,
      isViolation: isViolation || false,
      ruleNumber: ruleNumber || null,
      ruleName: ruleName || null,
      timestamp: new Date(),
    }

    // Notify via WebSocket
    const io = req.app.get('io')
    if (io) {
      io.to(`session:${sessionId}`).emit('transcript:message', message)
    }

    res.status(201).json(message)
  } catch (error) {
    console.error('[Transcripts] Add system message error:', error)
    res.status(500).json({ error: 'Failed to add system message' })
  }
})

// Get transcript for session
router.get('/:sessionId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params

    const result = await pool.query(
      `SELECT t.*, u.name as speaker_name
       FROM transcript_messages t
       LEFT JOIN users u ON t.speaker_id = u.id
       WHERE t.session_id = $1
       ORDER BY t.created_at`,
      [sessionId]
    )

    res.json({ messages: result.rows })
  } catch (error) {
    console.error('[Transcripts] Get error:', error)
    res.status(500).json({ error: 'Failed to get transcript' })
  }
})

export default router
