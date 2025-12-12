import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// In-memory storage for development when PostgreSQL is not available
interface MockUser { id: string; email: string; password_hash: string; name: string; created_at: Date }
interface MockSession { id: string; subject: string; creator_id: string; counterparty_name: string; counterparty_id: string | null; status: string; daily_room_url: string | null; daily_room_name: string | null; started_at: Date | null; ended_at: Date | null; created_at: Date }

const mockStorage: {
  users: Map<string, MockUser>
  sessions: Map<string, MockSession>
} = {
  users: new Map(),
  sessions: new Map(),
}

// Mock pool that uses in-memory storage
const createMockPool = () => {
  console.log('[Database] Using in-memory mock database (PostgreSQL not available)')
  
  return {
    query: async (text: string, params?: unknown[]) => {
      // Parse simple queries for auth
      if (text.includes('SELECT') && text.includes('FROM users WHERE email')) {
        const email = params?.[0] as string
        const user = Array.from(mockStorage.users.values()).find(u => u.email === email)
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 }
      }
      if (text.includes('SELECT') && text.includes('FROM users WHERE id')) {
        const id = params?.[0] as string
        const user = mockStorage.users.get(id)
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 }
      }
      if (text.includes('INSERT INTO users')) {
        const [id, email, password_hash, name] = params as string[]
        const user = { id, email, password_hash, name, created_at: new Date() }
        mockStorage.users.set(id, user)
        return { rows: [user], rowCount: 1 }
      }
      if (text.includes('SELECT 1')) {
        return { rows: [{ '?column?': 1 }], rowCount: 1 }
      }
      
      // Session queries
      if (text.includes('INSERT INTO sessions')) {
        const [id, subject, creator_id, counterparty_name, status] = params as string[]
        const session: MockSession = { 
          id, subject, creator_id, counterparty_name, 
          counterparty_id: null, status, 
          daily_room_url: null, daily_room_name: null,
          started_at: null, ended_at: null,
          created_at: new Date() 
        }
        mockStorage.sessions.set(id, session)
        return { rows: [session], rowCount: 1 }
      }
      
      // Match both "WHERE s.id = $1" (with alias) and "WHERE id = $1" (without alias)
      if (text.includes('SELECT') && text.includes('FROM sessions') && text.includes('WHERE') && (text.includes('s.id') || /WHERE\s+id\s*=/.test(text))) {
        const id = params?.[0] as string
        const session = mockStorage.sessions.get(id)
        if (session) {
          const creator = mockStorage.users.get(session.creator_id)
          const counterpartyUser = session.counterparty_id ? mockStorage.users.get(session.counterparty_id) : null
          return { 
            rows: [{ ...session, creator_name: creator?.name || 'Unknown', counterparty_user_name: counterpartyUser?.name || null }], 
            rowCount: 1 
          }
        }
        return { rows: [], rowCount: 0 }
      }
      
      if (text.includes('SELECT') && text.includes('FROM sessions') && (text.includes('creator_id') || text.includes('counterparty_id'))) {
        const userId = params?.[0] as string
        const sessions = Array.from(mockStorage.sessions.values()).filter(
          s => s.creator_id === userId || s.counterparty_id === userId
        ).map(s => {
          const creator = mockStorage.users.get(s.creator_id)
          return { ...s, creator_name: creator?.name || 'Unknown' }
        })
        return { rows: sessions, rowCount: sessions.length }
      }
      
      if (text.includes('UPDATE sessions')) {
        // Handle various UPDATE scenarios
        const id = params?.[params.length - 1] as string
        const session = mockStorage.sessions.get(id)
        if (session) {
          if (text.includes('daily_room_url')) {
            session.daily_room_url = params?.[0] as string
            session.daily_room_name = params?.[1] as string
          }
          if (text.includes('counterparty_id')) {
            session.counterparty_id = params?.[0] as string
            session.status = 'connected'
          }
          if (text.includes('status')) {
            session.status = params?.[0] as string
          }
          return { rows: [session], rowCount: 1 }
        }
        return { rows: [], rowCount: 0 }
      }
      
      // Default empty result for other queries
      return { rows: [], rowCount: 0 }
    },
    on: () => {},
  }
}

// Try to create real pool, fall back to mock
let pool: pg.Pool | ReturnType<typeof createMockPool>

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client', err)
  })

  pool.on('connect', () => {
    console.log('[Database] Connected to PostgreSQL')
  })
} else {
  pool = createMockPool()
}

export { pool }
