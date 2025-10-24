import React from 'react'

interface DayFilterProps {
  days: number[]  // [1, 2, 3]
  counts: Record<string | number, number>  // { all: 12, 1: 4, 2: 5, unscheduled: 0 }
  active: number | 'all' | 'unscheduled'
  onChange: (day: number | 'all' | 'unscheduled') => void
}

export function DayFilter({ days, counts, active, onChange }: DayFilterProps) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all || 0 },
    ...days.map(day => ({ 
      key: day, 
      label: `D${day}`, 
      count: counts[day] || 0 
    })),
    { key: 'unscheduled', label: 'Unscheduled', count: counts.unscheduled || 0 },
  ]
  
  return (
    <div className="flex gap-1 overflow-x-auto py-2 px-4 bg-gray-50 border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key as any)}
          className={`
            px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors
            ${active === tab.key
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }
          `}
        >
          {tab.label}
          <span className={`ml-1 text-xs ${active === tab.key ? 'opacity-80' : 'opacity-60'}`}>
            ·{tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}

