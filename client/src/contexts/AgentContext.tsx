import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, User } from '../lib/auth';
import { onAuthError, isAuthenticated as checkAuth } from '../lib/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Handle logout - clear user state
   */
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore logout errors
      console.error('Logout error:', e);
    }
    setUser(null);
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = () => {
      // Check if there's a valid token and user in storage
      if (checkAuth()) {
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } else {
        // No valid auth - ensure clean state
        authService.clearStorage();
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Listen for auth errors from API client (e.g., 403 on API calls)
   * This automatically logs out the user when a 401/403 is received
   */
  useEffect(() => {
    const unsubscribe = onAuthError(() => {
      console.log('🔒 Auth error received - clearing user state');
      setUser(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const loggedInUser = await authService.login(username, password);
      setUser(loggedInUser);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await handleLogout();
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

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
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============ Agent Context (for backward compatibility) ============

interface AgentContextType {
  agentName: string;
  setAgentName: (name: string) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [agentName, setAgentName] = useState(user?.agentName || 'Agent');

  useEffect(() => {
    if (user?.agentName) {
      setAgentName(user.agentName);
    }
  }, [user]);

  return (
    <AgentContext.Provider value={{ agentName, setAgentName }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
