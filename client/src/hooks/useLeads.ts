import { useState, useEffect } from 'react'
import { api, Lead } from '../lib/api'

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getLeads()
      setLeads(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const updateFollowUp = async (
    rowIndex: number,
    updates: {
      followUpDate?: string
      followUpTime?: string
      followUpMode?: 'Call' | 'WhatsApp'
    }
  ) => {
    try {
      await api.updateFollowUp(rowIndex, updates)
      await fetchLeads() // Refresh data
    } catch (err) {
      throw err
    }
  }

  const completeFollowUp = async (rowIndex: number, completed: boolean = true) => {
    try {
      await api.completeFollowUp(rowIndex, completed)
      await fetchLeads() // Refresh data
    } catch (err) {
      throw err
    }
  }

  return {
    leads,
    loading,
    error,
    refresh: fetchLeads,
    updateFollowUp,
    completeFollowUp
  }
}

