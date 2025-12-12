import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { SessionProvider } from './context/SessionContext'
import Layout from './components/layout/Layout'
import { ProtectedRoute } from './components/auth'
import Dashboard from './pages/Dashboard'
import CaseConfig from './pages/CaseConfig'
import SessionLobby from './pages/SessionLobby'
import LiveSession from './pages/LiveSession'
import SessionLog from './pages/SessionLog'
import Login from './pages/Login'
import Register from './pages/Register'
import JoinSession from './pages/JoinSession'

export default function App() {
  return (
    <UserProvider>
      <SessionProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Join session route (requires auth but outside layout) */}
          <Route path="/join/:id" element={
            <ProtectedRoute>
              <JoinSession />
            </ProtectedRoute>
          } />

          {/* Protected routes with layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/case/new" element={
            <ProtectedRoute>
              <Layout>
                <CaseConfig />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/session/:id/lobby" element={
            <ProtectedRoute>
              <Layout>
                <SessionLobby />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/session/:id/live" element={
            <ProtectedRoute>
              <Layout>
                <LiveSession />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/session/:id/log" element={
            <ProtectedRoute>
              <Layout>
                <SessionLog />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </SessionProvider>
    </UserProvider>
  )
}
