import { useState } from 'react'
import { useAuth, useAgent } from '../contexts/AgentContext'
import { useLeads } from '../hooks/useLeads'
import Header from '../components/Header'
import FilterBar from '../components/FilterBar'
import LeadsTable from '../components/LeadsTable'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import NewLeadsDashboard from './NewLeadsDashboard'

type FilterType = 'All' | 'Today' | 'Upcoming' | 'Overdue' | 'Completed'
type ViewType = 'follow-ups' | 'new-leads'

const Dashboard = () => {
  const { user } = useAuth()
  const { agentName } = useAgent()
  const { leads, loading, error, refresh, updateFollowUp, completeFollowUp } = useLeads()
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')
  const [activeView, setActiveView] = useState<ViewType>('new-leads')

  const filteredLeads = leads.filter(lead => {
    if (activeFilter === 'All') return true
    return lead.status === activeFilter
  })

  const counts = {
    all: leads.length,
    today: leads.filter(l => l.status === 'Today').length,
    upcoming: leads.filter(l => l.status === 'Upcoming').length,
    overdue: leads.filter(l => l.status === 'Overdue').length,
    completed: leads.filter(l => l.status === 'Completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header agentName={agentName} onRefresh={refresh} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('new-leads')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeView === 'new-leads'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Real-Time Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveView('follow-ups')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeView === 'follow-ups'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Follow-Ups Management
              </div>
            </button>
          </nav>
        </div>

        {activeView === 'new-leads' ? (
          <NewLeadsDashboard />
        ) : (
          <>
            <FilterBar 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
              counts={counts}
            />

            {loading && <LoadingSpinner />}
            
            {error && <ErrorMessage message={error} onRetry={refresh} />}

            {!loading && !error && (
              <>
                {filteredLeads.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No leads found</h3>
                    <p className="text-gray-500">
                      {activeFilter === 'All' 
                        ? 'No leads are assigned to you yet.'
                        : `No ${activeFilter.toLowerCase()} follow-ups.`
                      }
                    </p>
                  </div>
                ) : (
                  <LeadsTable 
                    leads={filteredLeads}
                    onUpdate={updateFollowUp}
                    onComplete={completeFollowUp}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard

