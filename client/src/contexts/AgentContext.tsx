import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User } from '../lib/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getUser()
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser)
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const loggedInUser = await authService.login(username, password)
    setUser(loggedInUser)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Keep the old AgentContext for backward compatibility
interface AgentContextType {
  agentName: string
  setAgentName: (name: string) => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [agentName, setAgentName] = useState(user?.agentName || 'Agent')

  useEffect(() => {
    if (user?.agentName) {
      setAgentName(user.agentName)
    }
  }, [user])

  return (
    <AgentContext.Provider value={{ agentName, setAgentName }}>
      {children}
    </AgentContext.Provider>
  )
}

export const useAgent = () => {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}

