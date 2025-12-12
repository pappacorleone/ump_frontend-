import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import sessionRoutes from './routes/sessions.js'
import dailyRoutes from './routes/daily.js'
import transcriptRoutes from './routes/transcripts.js'
import { setupWebSocket } from './websocket/sessionSync.js'
import { pool } from './db/pool.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}))

app.use(express.json())

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Make io available to routes
app.set('io', io)

// Setup WebSocket handlers
setupWebSocket(io)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/daily', dailyRoutes)
app.use('/api/transcripts', transcriptRoutes)

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`)
  console.log(`[WebSocket] Ready for connections`)
})

export { io }
