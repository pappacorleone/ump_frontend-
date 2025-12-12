# UMP.ai - AI-Powered Voice Mediation Platform

An AI-powered real-time voice mediation skill for founder disputes. This frontend application provides the user interface for structured conflict resolution between co-founders.

## Features

- **Dashboard**: View recent cases and start new mediation sessions
- **Case Configuration**: Define dispute subjects and counterparty details
- **Session Lobby**: Share session links and wait for counterparty connection
- **Live Session**: Real-time mediation with:
  - Talk balance monitoring
  - Protocol rule enforcement
  - System interventions for rule violations
  - Voice input support (scaffolded)
- **Session Log**: Review decisions and commitments from completed sessions

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** v4 for styling
- **React Router v6** for navigation
- **Lucide React** for icons

## Voice Service Scaffolding

The application includes scaffolded integrations for:

- **Daily.co** - WebRTC infrastructure for multi-party voice
- **Deepgram Flux** - Speech-to-text with speaker diarization
- **ElevenLabs** - Text-to-speech for AI mediator responses

Currently using mock implementations for demo purposes.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/      # Header, Layout wrapper
│   ├── session/     # Live session components
│   ├── cases/       # Case cards and forms
│   └── ui/          # Reusable UI primitives
├── pages/           # Route pages
├── services/voice/  # Voice API scaffolding
├── context/         # React context providers
├── data/            # Mock data
├── hooks/           # Custom React hooks
└── types/           # TypeScript definitions
```

## Demo Flow

1. Visit the Dashboard at `/`
2. Click "Open New Case" to create a new mediation session
3. Enter counterparty name and dispute subject
4. Wait in the lobby (connection simulates after 3 seconds)
5. Enter the live session
6. Send messages - try phrases like "I feel like..." or "last year..." to trigger protocol interventions
7. End the session to view the summary log

## Protocol Rules

The AI mediator enforces four core protocols:

1. **No Interruptions** - Allow complete thoughts
2. **Data Over Opinion** - Cite specific metrics or evidence
3. **Future Focused** - No dredging up resolved past issues
4. **Binary Outcome** - Commit to a decision by session end

