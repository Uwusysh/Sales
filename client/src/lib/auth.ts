const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Test users that should be removed
const TEST_USERNAMES = ['agent.smith', 'agent.jones', 'admin', 'test', 'demo'];

export interface User {
  username: string
  agentName: string
  role: string
}

export interface LoginResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  error?: string
}

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

export const authService = {
  async login(username: string, password: string): Promise<User> {
    // 🚫 Prevent test users from logging in
    if (TEST_USERNAMES.includes(username.toLowerCase())) {
      throw new Error('Test accounts are no longer available. Please use your Lead_Owner credentials.');
    }

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data: LoginResponse = await response.json();

    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token and user
    localStorage.setItem(TOKEN_KEY, data.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

    return data.data.user;
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearStorage();
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      
      // 🚫 Auto-logout test users
      if (TEST_USERNAMES.includes(user.username.toLowerCase())) {
        console.warn('⚠️ Test user detected in storage. Forcing logout...');
        this.clearStorage();
        return null;
      }
      
      return user;
    } catch {
      return null;
    }
  },

  clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  },

  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

