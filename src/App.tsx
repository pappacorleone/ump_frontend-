import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { SessionProvider } from './context/SessionContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CaseConfig from './pages/CaseConfig'
import SessionLobby from './pages/SessionLobby'
import LiveSession from './pages/LiveSession'
import SessionLog from './pages/SessionLog'

export default function App() {
  return (
    <UserProvider>
      <SessionProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/case/new" element={<CaseConfig />} />
            <Route path="/session/:id/lobby" element={<SessionLobby />} />
            <Route path="/session/:id/live" element={<LiveSession />} />
            <Route path="/session/:id/log" element={<SessionLog />} />
          </Routes>
        </Layout>
      </SessionProvider>
    </UserProvider>
  )
}

