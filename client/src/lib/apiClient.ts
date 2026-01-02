/**
 * Centralized API Client
 * 
 * This module provides a single, stable API client that:
 * 1. Automatically injects JWT token into every request
 * 2. Handles 401/403 errors with automatic logout
 * 3. Prevents retry loops on auth failures
 * 4. Provides consistent error handling
 */

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Flag to prevent multiple simultaneous logout redirects
let isLoggingOut = false;

// Event for auth state changes (allows components to react)
type AuthEventCallback = () => void;
const authEventListeners: Set<AuthEventCallback> = new Set();

export const onAuthError = (callback: AuthEventCallback) => {
  authEventListeners.add(callback);
  return () => authEventListeners.delete(callback);
};

const notifyAuthError = () => {
  authEventListeners.forEach(callback => callback());
};

/**
 * Get token from localStorage
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Set token in localStorage
 */
export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to store token:', e);
  }
};

/**
 * Get stored user from localStorage
 */
export const getStoredUser = (): { username: string; agentName: string; role: string } | null => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * Set user in localStorage
 */
export const setStoredUser = (user: { username: string; agentName: string; role: string }): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to store user:', e);
  }
};

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to clear auth data:', e);
  }
};

/**
 * Check if user is authenticated (has valid token in storage)
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getStoredUser();
  return !!(token && user);
};

/**
 * Handle authentication failure - clear data and redirect to login
 * Prevents multiple simultaneous logout attempts
 */
const handleAuthFailure = (errorCode?: string): void => {
  if (isLoggingOut) return;
  
  isLoggingOut = true;
  console.warn('🔒 Authentication failed:', errorCode || 'Unknown error');
  
  // Clear stored auth data
  clearAuthData();
  
  // Notify listeners (e.g., AuthContext)
  notifyAuthError();
  
  // Redirect to login after a brief delay to allow state updates
  setTimeout(() => {
    isLoggingOut = false;
    if (window.location.pathname !== '/login') {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, 100);
};

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Core fetch wrapper with automatic token injection and error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Don't make API calls if already logging out
  if (isLoggingOut) {
    throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
  }

  const token = getToken();
  
  // Build headers with token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle auth errors - DO NOT retry, logout immediately
    if (response.status === 401 || response.status === 403) {
      let errorData: { error?: string; code?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        // Response might not be JSON
      }
      
      // Special case: Don't logout on /auth/login 403 (wrong credentials)
      if (!endpoint.includes('/auth/login')) {
        handleAuthFailure(errorData.code);
      }
      
      throw new ApiError(
        errorData.error || 'Authentication failed',
        response.status,
        errorData.code
      );
    }

    // Handle other errors
    if (!response.ok) {
      let errorData: { error?: string; message?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        // Response might not be JSON
      }
      
      throw new ApiError(
        errorData.error || errorData.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    // Parse successful response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw ApiErrors as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) => 
    apiRequest<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Login function - stores token and user on success
 */
export async function login(username: string, password: string): Promise<{
  username: string;
  agentName: string;
  role: string;
}> {
  const response = await api.post<{
    success: boolean;
    data?: {
      token: string;
      user: { username: string; agentName: string; role: string };
    };
    error?: string;
  }>('/auth/login', { username, password });

  if (!response.success || !response.data) {
    throw new ApiError(response.error || 'Login failed', 401);
  }

  // Store token and user
  setToken(response.data.token);
  setStoredUser(response.data.user);

  return response.data.user;
}

/**
 * Logout function - clears auth data
 */
export async function logout(): Promise<void> {
  const token = getToken();
  
  if (token) {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors - we're clearing local state anyway
    }
  }
  
  clearAuthData();
}

export default api;

