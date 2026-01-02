/**
 * Authentication Service
 *
 * Uses the centralized apiClient for all auth operations.
 * Token management is handled by apiClient.
 */

import {
  login as apiLogin,
  logout as apiLogout,
  getToken,
  getStoredUser,
  clearAuthData,
  isAuthenticated as checkAuth
} from './apiClient';

// Test users that should be blocked
const TEST_USERNAMES = ['agent.smith', 'agent.jones', 'admin', 'test', 'demo'];

export interface User {
  username: string;
  agentName: string;
  role: string;
}

export const authService = {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<User> {
    // Block test users
    if (TEST_USERNAMES.includes(username.toLowerCase())) {
      throw new Error('Test accounts are no longer available. Please use your Lead_Owner credentials.');
    }

    return apiLogin(username, password);
  },

  /**
   * Logout and clear all auth data
   */
  async logout(): Promise<void> {
    return apiLogout();
  },

  /**
   * Get current token
   */
  getToken(): string | null {
    return getToken();
  },

  /**
   * Get current user from localStorage
   */
  getUser(): User | null {
    const user = getStoredUser();

    if (!user) return null;

    // Auto-logout test users that somehow got stored
    if (TEST_USERNAMES.includes(user.username.toLowerCase())) {
      console.warn('⚠️ Test user detected in storage. Forcing logout...');
      clearAuthData();
      return null;
    }

    return user;
  },

  /**
   * Clear all auth data
   */
  clearStorage(): void {
    clearAuthData();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return checkAuth();
  },

  /**
   * Get auth header for manual requests (rarely needed)
   */
  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default authService;