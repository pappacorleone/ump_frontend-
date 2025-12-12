import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// In-memory storage for development when PostgreSQL is not available
const mockStorage: {
  users: Map<string, { id: string; email: string; password_hash: string; name: string; created_at: Date }>
  sessions: Map<string, unknown>
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
