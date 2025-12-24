import { useState, useEffect } from 'react'
import DashboardPage from './pages/Dashboard'
import LeadsPage from './pages/Leads'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading SalesOS...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Login />

  // Simple router
  const renderPage = () => {
    if (currentPath.startsWith('/leads')) return <LeadsPage />
    // Add more routes here as needed
    return <DashboardPage />
  }

  return (
    <AgentProvider>
      {renderPage()}
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
