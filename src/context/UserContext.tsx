import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '../services/api'
import { socketService } from '../services/api'

export interface User {
  id: string
  name: string
  email: string
  initials: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const token = api.getToken()
    if (token) {
      api.getMe()
        .then(({ user: userData }) => {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            initials: getInitials(userData.name),
          })
          socketService.connect(token)
        })
        .catch(() => {
          api.setToken(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: userData, token } = await api.login(email, password)
    api.setToken(token)
    setUser({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      initials: getInitials(userData.name),
    })
    socketService.connect(token)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a9316242-7b3b-4110-84f0-712b285e9d22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserContext.tsx:73',message:'Register called',data:{email,nameLen:name.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'entry'})}).catch(()=>{});
    // #endregion
    try {
      const { user: userData, token } = await api.register(email, password, name)
      api.setToken(token)
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        initials: getInitials(userData.name),
      })
      socketService.connect(token)
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a9316242-7b3b-4110-84f0-712b285e9d22',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserContext.tsx:87',message:'Register error caught',data:{error:String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,D'})}).catch(()=>{});
      // #endregion
      throw err;
    }
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    socketService.disconnect()
    setUser(null)
  }, [])

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
