import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AgentContext'
import { useNavigate } from '../hooks/useNavigate'
import { Loader2 } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-lg">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6 shadow-inner ring-1 ring-white/50">
              <span className="text-2xl font-bold text-primary">S</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">SalesOS</h1>
            <p className="text-muted-foreground mt-2 text-sm">Enterprise Lead Management</p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-transparent rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                placeholder="agent.id"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-secondary/50 border border-transparent rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-center text-xs text-muted-foreground">
              Restricted Access. Authorized Personnel Only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
