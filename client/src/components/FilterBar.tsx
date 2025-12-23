import React from 'react'

type FilterType = 'All' | 'Today' | 'Upcoming' | 'Overdue' | 'Completed'

interface FilterBarProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: {
    all: number
    today: number
    upcoming: number
    overdue: number
    completed: number
  }
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange, counts }) => {
  const filters: { label: FilterType; count: number; color: string }[] = [
    { label: 'All', count: counts.all, color: 'text-gray-700' },
    { label: 'Today', count: counts.today, color: 'text-blue-600' },
    { label: 'Upcoming', count: counts.upcoming, color: 'text-green-600' },
    { label: 'Overdue', count: counts.overdue, color: 'text-red-600' },
    { label: 'Completed', count: counts.completed, color: 'text-gray-500' },
  ]

  return (
    <div className="bg-white rounded-lg shadow mb-6 p-4">
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <button
            key={filter.label}
            onClick={() => onFilterChange(filter.label)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${activeFilter === filter.label
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {filter.label}
            <span className={`ml-2 ${activeFilter === filter.label ? 'text-white' : filter.color}`}>
              ({filter.count})
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default FilterBar

