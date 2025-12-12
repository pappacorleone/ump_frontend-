# UMP.ai - AI-Powered Voice Mediation Platform

An AI-powered real-time voice mediation platform for founder disputes. This application provides structured conflict resolution between co-founders with an AI mediator that enforces conversation protocols.

## Features

- **Dashboard**: View recent cases and start new mediation sessions
- **Case Configuration**: Define dispute subjects and counterparty details
- **Session Lobby**: Share session links and wait for counterparty connection
- **Live Session**: Real-time mediation with:
  - Talk balance monitoring
  - Protocol rule enforcement
  - AI mediator interventions for rule violations
  - Real-time transcript sync between parties
  - Voice input support (with API keys)
- **Session Log**: Review decisions and commitments from completed sessions

## Architecture

### Frontend (React + Vite)
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** v4 for styling
- **React Router v6** for navigation
- **Socket.io-client** for real-time sync
- **Daily.co SDK** for WebRTC

### Backend (Node.js + Express)
- **Express** REST API
- **PostgreSQL** database
- **Socket.io** for WebSocket
- **JWT** authentication

### Voice Services
- **Daily.co** - WebRTC infrastructure for multi-party voice
- **Deepgram** - Speech-to-text with speaker diarization
- **ElevenLabs** - Text-to-speech for AI mediator responses

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) API keys for voice services

### 1. Clone and Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Configure Environment

**Frontend** - Create `.env` in root:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001

# Optional voice services
VITE_DEEPGRAM_API_KEY=your-key
VITE_ELEVENLABS_API_KEY=your-key
VITE_ELEVENLABS_VOICE_ID=voice-id
```

**Backend** - Create `.env` in `/server`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ump
JWT_SECRET=your-secret-key
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Optional voice services
DAILY_API_KEY=your-key
DEEPGRAM_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
```

### 3. Set Up Database

```bash
# Create PostgreSQL database
createdb ump

# Run migrations
cd server
npm run db:migrate
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

Visit http://localhost:5173

## Two-User Flow

1. **User A**: Register/login and create a new case
2. **User A**: In the lobby, copy the shareable link
3. **User B**: Open the link, register/login if needed
4. **User B**: Click "Join Session"
5. **Both**: Enter the live session when connected
6. **Both**: Chat in real-time with AI mediator interventions
7. **Either**: End session to see decisions and commitments

## Protocol Rules

The AI mediator enforces four core protocols:

1. **No Interruptions** - Monitors talk balance to ensure equal speaking time
2. **Data Over Opinion** - Detects phrases like "I feel" or "I think" and prompts for data
3. **Future Focused** - Catches references to past issues like "last year" or "you always"
4. **Binary Outcome** - Prompts for decisions by session end

## Project Structure

```
ump/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── auth/          # Authentication
│   │   ├── cases/         # Case cards
│   │   ├── layout/        # Header, Layout
│   │   ├── session/       # Live session UI
│   │   └── ui/            # Reusable primitives
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Route pages
│   ├── services/          # API & voice services
│   │   ├── api/           # REST & WebSocket client
│   │   └── voice/         # Daily, Deepgram, ElevenLabs
│   └── types/             # TypeScript definitions
├── server/                 # Backend source
│   └── src/
│       ├── routes/        # API routes
│       ├── services/      # Business logic
│       ├── websocket/     # Socket.io handlers
│       ├── middleware/    # Auth middleware
│       └── db/            # Database pool & migrations
└── public/                # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Get current user

### Sessions
- `GET /api/sessions` - List user's sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/join` - Join as counterparty
- `PATCH /api/sessions/:id/status` - Update status
- `POST /api/sessions/:id/decisions` - Add decision
- `POST /api/sessions/:id/commitments` - Add commitment
- `GET /api/sessions/:id/outcomes` - Get decisions & commitments

### Transcripts
- `GET /api/transcripts/:sessionId` - Get transcript
- `POST /api/transcripts/:sessionId/messages` - Add message

### Daily.co
- `POST /api/daily/room` - Create video room
- `GET /api/daily/token/:sessionId` - Get meeting token

## WebSocket Events

### Client → Server
- `session:join` - Join session room
- `session:leave` - Leave session room
- `transcript:message` - Send message
- `talkbalance:update` - Update talk balance
- `typing:start/stop` - Typing indicators

### Server → Client
- `session:joined` - Confirmed join
- `session:user-joined` - Another user joined
- `session:counterparty-joined` - Counterparty connected
- `session:status-changed` - Session status update
- `transcript:message` - New message
- `talkbalance:update` - Balance changed
- `decision:add` - New decision
- `commitment:add` - New commitment

## External Service Setup

| Service | Purpose | Signup |
|---------|---------|--------|
| Daily.co | WebRTC rooms | https://dashboard.daily.co |
| Deepgram | Speech-to-text | https://console.deepgram.com |
| ElevenLabs | Text-to-speech | https://elevenlabs.io |

## Development Notes

- The app works without voice API keys (text chat only)
- Daily rooms are mocked when no API key is configured
- AI mediator runs on the backend and broadcasts via WebSocket
- Talk balance is calculated from message word count

## License

MIT
