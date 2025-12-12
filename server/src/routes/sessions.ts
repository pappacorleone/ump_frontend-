import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../db/pool.js'
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Create new session
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subject, counterpartyName } = req.body
    const userId = req.user!.id

    if (!subject || !counterpartyName) {
      res.status(400).json({ error: 'Subject and counterparty name are required' })
      return
    }

    const sessionId = uuidv4()

    await pool.query(
      `INSERT INTO sessions (id, subject, creator_id, counterparty_name, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [sessionId, subject, userId, counterpartyName]
    )

    const result = await pool.query(
      `SELECT s.*, u.name as creator_name
       FROM sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.id = $1`,
      [sessionId]
    )

    res.status(201).json({ session: result.rows[0] })
  } catch (error) {
    console.error('[Sessions] Create error:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// Get session by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT s.*, 
              u1.name as creator_name,
              u2.name as counterparty_user_name
       FROM sessions s
       JOIN users u1 ON s.creator_id = u1.id
       LEFT JOIN users u2 ON s.counterparty_id = u2.id
       WHERE s.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    res.json({ session: result.rows[0] })
  } catch (error) {
    console.error('[Sessions] Get error:', error)
    res.status(500).json({ error: 'Failed to get session' })
  }
})

// Get user's sessions
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const result = await pool.query(
      `SELECT s.*, u.name as creator_name
       FROM sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.creator_id = $1 OR s.counterparty_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    )

    res.json({ sessions: result.rows })
  } catch (error) {
    console.error('[Sessions] List error:', error)
    res.status(500).json({ error: 'Failed to list sessions' })
  }
})

// Join session as counterparty
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // Get session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const sessionData = session.rows[0]

    // Check if user is the creator
    if (sessionData.creator_id === userId) {
      res.status(400).json({ error: 'Cannot join your own session as counterparty' })
      return
    }

    // Check if already has a counterparty
    if (sessionData.counterparty_id && sessionData.counterparty_id !== userId) {
      res.status(400).json({ error: 'Session already has a counterparty' })
      return
    }

    // Update session with counterparty
    await pool.query(
      `UPDATE sessions 
       SET counterparty_id = $1, status = 'connected'
       WHERE id = $2`,
      [userId, id]
    )

    // Notify via WebSocket
    const io = req.app.get('io')
    if (io) {
      io.to(`session:${id}`).emit('session:counterparty-joined', {
        sessionId: id,
        counterpartyId: userId,
        counterpartyName: req.user!.name,
      })
    }

    res.json({ success: true, message: 'Joined session successfully' })
  } catch (error) {
    console.error('[Sessions] Join error:', error)
    res.status(500).json({ error: 'Failed to join session' })
  }
})

// Update session status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user!.id

    const validStatuses = ['pending', 'connected', 'active', 'ended']
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    // Verify user is part of session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
      [id, userId]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const updates: string[] = ['status = $1']
    const values: (string | Date)[] = [status]
    let paramIndex = 2

    if (status === 'active') {
      updates.push(`started_at = $${paramIndex}`)
      values.push(new Date())
      paramIndex++
    } else if (status === 'ended') {
      updates.push(`ended_at = $${paramIndex}`)
      values.push(new Date())
      paramIndex++
    }

    values.push(id)

    await pool.query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    // Notify via WebSocket
    const io = req.app.get('io')
    if (io) {
      io.to(`session:${id}`).emit('session:status-changed', { sessionId: id, status })
    }

    res.json({ success: true, status })
  } catch (error) {
    console.error('[Sessions] Update status error:', error)
    res.status(500).json({ error: 'Failed to update session status' })
  }
})

// Add decision to session
router.post('/:id/decisions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const userId = req.user!.id

    // Verify user is part of session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
      [id, userId]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const decisionId = uuidv4()
    await pool.query(
      'INSERT INTO decisions (id, session_id, content) VALUES ($1, $2, $3)',
      [decisionId, id, content]
    )

    // Notify via WebSocket
    const io = req.app.get('io')
    if (io) {
      io.to(`session:${id}`).emit('decision:add', { sessionId: id, decisionId, content })
    }

    res.status(201).json({ id: decisionId, content })
  } catch (error) {
    console.error('[Sessions] Add decision error:', error)
    res.status(500).json({ error: 'Failed to add decision' })
  }
})

// Add commitment to session
router.post('/:id/commitments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { content, ownerId } = req.body
    const userId = req.user!.id

    // Verify user is part of session
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
      [id, userId]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const commitmentId = uuidv4()
    await pool.query(
      'INSERT INTO commitments (id, session_id, owner_id, content) VALUES ($1, $2, $3, $4)',
      [commitmentId, id, ownerId, content]
    )

    // Notify via WebSocket
    const io = req.app.get('io')
    if (io) {
      io.to(`session:${id}`).emit('commitment:add', { sessionId: id, commitmentId, ownerId, content })
    }

    res.status(201).json({ id: commitmentId, ownerId, content })
  } catch (error) {
    console.error('[Sessions] Add commitment error:', error)
    res.status(500).json({ error: 'Failed to add commitment' })
  }
})

// Get session decisions and commitments
router.get('/:id/outcomes', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const decisions = await pool.query(
      'SELECT * FROM decisions WHERE session_id = $1 ORDER BY created_at',
      [id]
    )

    const commitments = await pool.query(
      `SELECT c.*, u.name as owner_name
       FROM commitments c
       JOIN users u ON c.owner_id = u.id
       WHERE c.session_id = $1
       ORDER BY c.created_at`,
      [id]
    )

    res.json({
      decisions: decisions.rows,
      commitments: commitments.rows,
    })
  } catch (error) {
    console.error('[Sessions] Get outcomes error:', error)
    res.status(500).json({ error: 'Failed to get outcomes' })
  }
})

export default router
