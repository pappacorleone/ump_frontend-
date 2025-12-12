import { Router, Response } from 'express'
import { pool } from '../db/pool.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

// Create a Daily room for a session
router.post('/room', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body

    if (!DAILY_API_KEY) {
      // Return mock room for development
      const mockRoomUrl = `https://ump.daily.co/session-${sessionId}`
      await pool.query(
        'UPDATE sessions SET daily_room_url = $1, daily_room_name = $2 WHERE id = $3',
        [mockRoomUrl, `session-${sessionId}`, sessionId]
      )
      res.json({ 
        url: mockRoomUrl, 
        name: `session-${sessionId}`,
        mock: true 
      })
      return
    }

    // Create room via Daily API
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `session-${sessionId}`,
        properties: {
          max_participants: 4,
          enable_recording: true,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Daily] Create room error:', error)
      res.status(500).json({ error: 'Failed to create Daily room' })
      return
    }

    const room = await response.json() as { url: string; name: string }

    // Update session with room info
    await pool.query(
      'UPDATE sessions SET daily_room_url = $1, daily_room_name = $2 WHERE id = $3',
      [room.url, room.name, sessionId]
    )

    res.json({ url: room.url, name: room.name })
  } catch (error) {
    console.error('[Daily] Create room error:', error)
    res.status(500).json({ error: 'Failed to create Daily room' })
  }
})

// Get meeting token for a session
router.get('/token/:sessionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params
    const userId = req.user!.id
    const userName = req.user!.name

    // Get session to verify user is part of it
    const session = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
      [sessionId, userId]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const sessionData = session.rows[0]

    if (!DAILY_API_KEY) {
      // Return mock token for development
      res.json({ 
        token: `mock-token-${userId}-${sessionId}`,
        roomUrl: sessionData.daily_room_url || `https://ump.daily.co/session-${sessionId}`,
        mock: true 
      })
      return
    }

    // Generate meeting token
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: sessionData.daily_room_name,
          user_name: userName,
          user_id: userId,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Daily] Create token error:', error)
      res.status(500).json({ error: 'Failed to create meeting token' })
      return
    }

    const tokenData = await response.json() as { token: string }

    res.json({ 
      token: tokenData.token, 
      roomUrl: sessionData.daily_room_url 
    })
  } catch (error) {
    console.error('[Daily] Get token error:', error)
    res.status(500).json({ error: 'Failed to get meeting token' })
  }
})

export default router
