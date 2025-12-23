import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { AuthProvider, AgentProvider, useAuth } from './contexts/AgentContext'

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!loading) {
      if (!isAuthenticated && currentPath !== '/login') {
        window.history.pushState({}, '', '/login')
        setCurrentPath('/login')
      } else if (isAuthenticated && (currentPath === '/login' || currentPath === '/')) {
        window.history.pushState({}, '', '/dashboard')
        setCurrentPath('/dashboard')
      }
    }
  }, [isAuthenticated, loading, currentPath])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <AgentProvider>
      <Dashboard />
    </AgentProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

