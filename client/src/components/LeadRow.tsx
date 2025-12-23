import React, { useState } from 'react'
import { Lead } from '../lib/api'

interface LeadRowProps {
  lead: Lead
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (rowIndex: number, updates: any) => Promise<void>
  onComplete: (rowIndex: number, completed: boolean) => Promise<void>
}

const LeadRow: React.FC<LeadRowProps> = ({
  lead,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onComplete
}) => {
  const [editData, setEditData] = useState({
    followUpDate: lead.followUpDate,
    followUpTime: lead.followUpTime,
    followUpMode: lead.followUpMode
  })
  const [saving, setSaving] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Today':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-green-100 text-green-800'
      case 'Overdue':
        return 'bg-red-100 text-red-800'
      case 'Completed':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getRowStyle = () => {
    if (lead.completed) {
      return 'bg-gray-50 opacity-60'
    }
    if (lead.status === 'Overdue') {
      return 'bg-red-50'
    }
    if (lead.status === 'Today') {
      return 'bg-blue-50'
    }
    return ''
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onUpdate(lead.rowIndex, editData)
      onCancelEdit()
    } catch (err) {
      alert('Failed to update follow-up')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    try {
      setSaving(true)
      await onComplete(lead.rowIndex, !lead.completed)
    } catch (err) {
      alert('Failed to update completion status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className={getRowStyle()}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{lead.leadName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600">{lead.phoneNumber}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="date"
              value={editData.followUpDate}
              onChange={(e) => setEditData({ ...editData, followUpDate: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
            <input
              type="time"
              value={editData.followUpTime}
              onChange={(e) => setEditData({ ...editData, followUpTime: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
        ) : (
          <div className="text-sm text-gray-900">
            {lead.followUpDate} {lead.followUpTime}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <select
            value={editData.followUpMode}
            onChange={(e) => setEditData({ ...editData, followUpMode: e.target.value as 'Call' | 'WhatsApp' })}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="Call">Call</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        ) : (
          <span className="inline-flex items-center text-sm">
            {lead.followUpMode === 'WhatsApp' ? (
              <span className="text-green-600">📱 WhatsApp</span>
            ) : (
              <span className="text-blue-600">📞 Call</span>
            )}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-green-600 hover:text-green-900 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={saving}
                className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="text-primary-600 hover:text-primary-900"
              >
                Edit
              </button>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={lead.completed}
                  onChange={handleComplete}
                  disabled={saving}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="ml-2 text-gray-600">Done</span>
              </label>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default LeadRow

