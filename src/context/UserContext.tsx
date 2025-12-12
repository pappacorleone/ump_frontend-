import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'

interface UserContextType {
  user: User
  setUser: (user: User) => void
}

const defaultUser: User = {
  id: 'user-1',
  name: 'John Doe',
  initials: 'JD',
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser)

  return (
    <UserContext.Provider value={{ user, setUser }}>
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

