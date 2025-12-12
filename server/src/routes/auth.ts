import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../db/pool.js'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Register new user
router.post('/register', async (req, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' })
      return
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = uuidv4()

    // Create user
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [userId, email.toLowerCase(), passwordHash, name]
    )

    const user = { id: userId, email: email.toLowerCase(), name }
    const token = generateToken(user)

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('[Auth] Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const dbUser = result.rows[0]

    // Check password
    const validPassword = await bcrypt.compare(password, dbUser.password_hash)
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const user = { id: dbUser.id, email: dbUser.email, name: dbUser.name }
    const token = generateToken(user)

    res.json({ user, token })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('[Auth] Get me error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
