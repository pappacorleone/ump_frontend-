import { pool } from './pool.js'

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  subject TEXT NOT NULL,
  creator_id UUID REFERENCES users(id),
  counterparty_id UUID REFERENCES users(id),
  counterparty_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  daily_room_url TEXT,
  daily_room_name VARCHAR(255),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transcript messages table
CREATE TABLE IF NOT EXISTS transcript_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES users(id),
  speaker_type VARCHAR(50),
  content TEXT NOT NULL,
  is_violation BOOLEAN DEFAULT FALSE,
  rule_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commitments table
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_creator ON sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_counterparty ON sessions(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcript_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_decisions_session ON decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_commitments_session ON commitments(session_id);
`

async function migrate() {
  console.log('[Migration] Starting database migration...')
  
  try {
    await pool.query(schema)
    console.log('[Migration] Database schema created successfully')
  } catch (error) {
    console.error('[Migration] Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
