import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import { getMediator, cleanupMediator, processTranscript } from '../services/mediator.js'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthenticatedSocket extends Socket {
  user?: AuthUser
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export function setupWebSocket(io: SocketServer): void {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const user = jwt.verify(token, JWT_SECRET) as AuthUser
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] User connected: ${socket.user?.name} (${socket.id})`)

    // Join session room
    socket.on('session:join', async (sessionId: string) => {
      try {
        // Verify user is part of session
        const session = await pool.query(
          'SELECT * FROM sessions WHERE id = $1 AND (creator_id = $2 OR counterparty_id = $2)',
          [sessionId, socket.user!.id]
        )

        if (session.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to join this session' })
          return
        }

        const roomName = `session:${sessionId}`
        socket.join(roomName)
        console.log(`[WebSocket] ${socket.user?.name} joined ${roomName}`)

        // Notify others in the room
        socket.to(roomName).emit('session:user-joined', {
          userId: socket.user!.id,
          userName: socket.user!.name,
        })

        // Send current room members
        const room = io.sockets.adapter.rooms.get(roomName)
        const memberCount = room ? room.size : 1
        socket.emit('session:joined', { 
          sessionId, 
          memberCount,
          session: session.rows[0],
        })
      } catch (error) {
        console.error('[WebSocket] Join session error:', error)
        socket.emit('error', { message: 'Failed to join session' })
      }
    })

    // Leave session room
    socket.on('session:leave', (sessionId: string) => {
      const roomName = `session:${sessionId}`
      socket.leave(roomName)
      console.log(`[WebSocket] ${socket.user?.name} left ${roomName}`)

      socket.to(roomName).emit('session:user-left', {
        userId: socket.user!.id,
        userName: socket.user!.name,
      })
    })

    // Transcript message (for real-time sync)
    socket.on('transcript:message', async (data: {
      sessionId: string
      content: string
      speakerType: 'user' | 'counterparty'
    }) => {
      const roomName = `session:${data.sessionId}`
      
      // Broadcast to others in the room
      socket.to(roomName).emit('transcript:message', {
        id: `msg-${Date.now()}`,
        speakerId: socket.user!.id,
        speakerName: socket.user!.name,
        speakerType: data.speakerType,
        content: data.content,
        timestamp: new Date(),
      })

      // Process through AI mediator for violations
      try {
        await processTranscript(
          io,
          data.sessionId,
          socket.user!.id,
          socket.user!.name,
          data.content
        )
      } catch (error) {
        console.error('[WebSocket] Mediator processing error:', error)
      }
    })

    // Talk balance update
    socket.on('talkbalance:update', (data: {
      sessionId: string
      user: number
      counterparty: number
    }) => {
      const roomName = `session:${data.sessionId}`
      socket.to(roomName).emit('talkbalance:update', {
        user: data.user,
        counterparty: data.counterparty,
      })
    })

    // Typing indicator
    socket.on('typing:start', (sessionId: string) => {
      const roomName = `session:${sessionId}`
      socket.to(roomName).emit('typing:start', {
        userId: socket.user!.id,
        userName: socket.user!.name,
      })
    })

    socket.on('typing:stop', (sessionId: string) => {
      const roomName = `session:${sessionId}`
      socket.to(roomName).emit('typing:stop', {
        userId: socket.user!.id,
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[WebSocket] User disconnected: ${socket.user?.name} (${socket.id})`)
    })
  })
}
