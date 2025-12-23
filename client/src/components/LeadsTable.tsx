import React, { useState } from 'react'
import { Lead } from '../lib/api'
import LeadRow from './LeadRow'

interface LeadsTableProps {
  leads: Lead[]
  onUpdate: (rowIndex: number, updates: any) => Promise<void>
  onComplete: (rowIndex: number, completed: boolean) => Promise<void>
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onUpdate, onComplete }) => {
  const [editingRow, setEditingRow] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map(lead => (
              <LeadRow
                key={lead.rowIndex}
                lead={lead}
                isEditing={editingRow === lead.rowIndex}
                onEdit={() => setEditingRow(lead.rowIndex)}
                onCancelEdit={() => setEditingRow(null)}
                onUpdate={onUpdate}
                onComplete={onComplete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LeadsTable

