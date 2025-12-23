import { useState, useEffect } from 'react'
import { api, Lead } from '../lib/api'
import { useAuth } from '../contexts/AgentContext'
import WhatsAppReminderModal from '../components/WhatsAppReminderModal'

const NewLeadsDashboard = () => {
  const { user } = useAuth()
  const [newLeads, setNewLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<string>(new Date().toISOString())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showReminderModal, setShowReminderModal] = useState(false)

  const fetchNewLeads = async () => {
    try {
      setError(null)
      const leads = await api.getNewLeads(lastCheck)
      
      if (leads.length > 0) {
        setNewLeads(prev => [...leads, ...prev])
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('New Leads Available!', {
            body: `${leads.length} new lead(s) assigned to you`,
            icon: '/vite.svg'
          })
        }
      }
      
      setLastCheck(new Date().toISOString())
    } catch (err) {
      console.error('Error fetching new leads:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch new leads')
    }
  }

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Initial load
    const loadInitialLeads = async () => {
      try {
        setLoading(true)
        const leads = await api.getLeads()
        setNewLeads(leads)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leads')
      } finally {
        setLoading(false)
      }
    }

    loadInitialLeads()

    // Poll for new leads every 30 seconds
    const interval = setInterval(fetchNewLeads, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleSetReminder = (lead: Lead) => {
    setSelectedLead(lead)
    setShowReminderModal(true)
  }

  const handleReminderCreated = () => {
    setShowReminderModal(false)
    setSelectedLead(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Today':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-green-100 text-green-800'
      case 'Overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Real-Time Leads Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing leads for <span className="font-medium text-primary-600">{user?.agentName}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Auto-refreshing every 30s
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {newLeads.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
              <p className="mt-1 text-sm text-gray-500">New leads will appear here automatically</p>
            </div>
          ) : (
            newLeads.map((lead) => (
              <div
                key={lead.rowIndex}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  lead.status === 'Overdue' ? 'border-red-300 bg-red-50' :
                  lead.status === 'Today' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{lead.leadName}</h3>
                    <p className="text-sm text-gray-600">{lead.phoneNumber}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {lead.followUpDate} at {lead.followUpTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    {lead.followUpMode === 'WhatsApp' ? (
                      <>
                        <span className="mr-2">📱</span>
                        WhatsApp
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📞</span>
                        Call
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSetReminder(lead)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Set WhatsApp Reminder
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showReminderModal && selectedLead && (
        <WhatsAppReminderModal
          lead={selectedLead}
          onClose={() => setShowReminderModal(false)}
          onSuccess={handleReminderCreated}
        />
      )}
    </div>
  )
}

export default NewLeadsDashboard

