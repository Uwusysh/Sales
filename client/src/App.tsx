import { useState, useEffect } from 'react'
import DashboardPage from './pages/Dashboard'
import LeadsPage from './pages/Leads'
import Login from './pages/Login'
import { AuthProvider, AgentProvider, useAuth } from './contexts/AgentContext'

// Placeholder pages for future modules
const ComingSoonPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="max-w-md text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <span className="text-3xl">🚧</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6">{description}</p>
      <button
        onClick={() => {
          window.history.pushState({}, '', '/dashboard')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  </div>
)

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
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading SalesOS...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Connecting to Google Sheets</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Login />

  // Router - Phase 1 routes
  const renderPage = () => {
    // Lead pages
    if (currentPath.startsWith('/leads')) return <LeadsPage />

    // SRF module (Phase 1)
    if (currentPath.startsWith('/srf')) return (
      <ComingSoonPage
        title="SRF Module"
        description="Site Requirement Form management is being integrated. Check back soon!"
      />
    )

    // Quotations module (Phase 1)
    if (currentPath.startsWith('/quotations')) return (
      <ComingSoonPage
        title="Quotation Tracker"
        description="Quotation generation and tracking is being developed."
      />
    )

    // Orders module (Phase 1)
    if (currentPath.startsWith('/orders')) return (
      <ComingSoonPage
        title="Order Punch"
        description="Order management and tracking module coming soon."
      />
    )

    // Future Phase 2 modules
    if (currentPath.startsWith('/transcription')) return (
      <ComingSoonPage
        title="AI Transcription"
        description="Automatic call transcription and analysis - Phase 2 feature."
      />
    )

    if (currentPath.startsWith('/srf-automation')) return (
      <ComingSoonPage
        title="SRF Automation"
        description="AI-powered SRF auto-fill from call transcripts - Phase 2 feature."
      />
    )

    if (currentPath.startsWith('/pi-engine')) return (
      <ComingSoonPage
        title="PI Approval Engine"
        description="Proforma Invoice workflow automation - Phase 2 feature."
      />
    )

    if (currentPath.startsWith('/settings')) return (
      <ComingSoonPage
        title="Settings"
        description="System configuration and user management coming soon."
      />
    )

    // Default: Dashboard
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
