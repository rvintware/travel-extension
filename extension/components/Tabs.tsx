import React from 'react'

interface TabsProps {
  active: 'locations' | 'trips'
  onChange: (tab: 'locations' | 'trips') => void
  onRefresh: () => void
  onSettingsClick: () => void
}

export function Tabs({ active, onChange, onRefresh, onSettingsClick }: TabsProps) {
  return (
    <div className="bg-white border-b border-gray-200 flex items-center justify-between px-2">
      <div className="flex">
        <button
          onClick={() => onChange('locations')}
          className={`
            px-4 py-3 text-sm font-medium transition-colors relative
            ${active === 'locations'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          My Locations
        </button>
        
        <button
          onClick={() => onChange('trips')}
          className={`
            px-4 py-3 text-sm font-medium transition-colors relative
            ${active === 'trips'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          My Trips
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
          aria-label="Refresh"
          title="Refresh data"
        >
          <span className="text-xl">🔄</span>
        </button>
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          aria-label="Settings"
        >
          <span className="text-xl">⚙️</span>
        </button>
      </div>
    </div>
  )
}

