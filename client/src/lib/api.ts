import { authService } from './auth'

export interface Lead {
  rowIndex: number
  leadName: string
  phoneNumber: string
  assignedAgent: string
  followUpDate: string
  followUpTime: string
  followUpMode: 'Call' | 'WhatsApp'
  completed: boolean
  lastUpdated: string
  status: 'Today' | 'Upcoming' | 'Overdue' | 'Completed' | 'Unknown'
}

export interface Reminder {
  id: string
  leadRowIndex: number
  phoneNumber: string
  message: string
  scheduledTime: string
  agentName: string
  status: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  count?: number
  error?: string
  message?: string
  timestamp?: string
}

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'

export const api = {
  async getLeads(): Promise<Lead[]> {
    const response = await fetch(`${API_BASE}/leads`, {
      headers: {
        ...authService.getAuthHeader()
      }
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<Lead[]> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch leads')
    }
    
    return data.data || []
  },

  async getNewLeads(since?: string): Promise<Lead[]> {
    const url = since 
      ? `${API_BASE}/leads/new?since=${encodeURIComponent(since)}`
      : `${API_BASE}/leads/new`
    
    const response = await fetch(url, {
      headers: {
        ...authService.getAuthHeader()
      }
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<Lead[]> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch new leads')
    }
    
    return data.data || []
  },

  async updateFollowUp(
    rowIndex: number, 
    updates: {
      followUpDate?: string
      followUpTime?: string
      followUpMode?: 'Call' | 'WhatsApp'
    }
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/follow-up/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify({ rowIndex, ...updates })
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<null> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update follow-up')
    }
  },

  async completeFollowUp(rowIndex: number, completed: boolean = true): Promise<void> {
    const response = await fetch(`${API_BASE}/follow-up/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify({ rowIndex, completed })
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<null> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to complete follow-up')
    }
  },

  async createReminder(
    leadRowIndex: number,
    phoneNumber: string,
    message?: string,
    scheduledTime?: string
  ): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify({ leadRowIndex, phoneNumber, message, scheduledTime })
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<Reminder> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create reminder')
    }
    
    return data.data!
  },

  async getReminders(): Promise<Reminder[]> {
    const response = await fetch(`${API_BASE}/reminders`, {
      headers: {
        ...authService.getAuthHeader()
      }
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<Reminder[]> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch reminders')
    }
    
    return data.data || []
  },

  async deleteReminder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'DELETE',
      headers: {
        ...authService.getAuthHeader()
      }
    })
    
    if (response.status === 401) {
      authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    const data: ApiResponse<null> = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete reminder')
    }
  }
}

