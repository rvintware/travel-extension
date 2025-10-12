import React from 'react'
import type { Trip } from '../lib/types'
import { formatRelativeTime } from '../lib/utils'

interface TripCardProps {
  trip: Trip
  onClick: () => void
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const emoji = trip.country?.emoji || '🌐'
  const locationCount = trip.locationCount || 0
  
  // Format duration
  const duration = trip.duration_days 
    ? `${trip.duration_days} ${trip.duration_days === 1 ? 'day' : 'days'}`
    : null
  
  // Format dates
  const dates = trip.start_date && trip.end_date
    ? `${new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : null
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-300 rounded-lg p-4 hover:shadow-card-hover hover:border-primary transition-all duration-200 text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{emoji}</span>
            <h3 className="font-semibold text-gray-900 text-xl">{trip.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {trip.is_active && <span className="text-primary font-medium">Active</span>}
            {duration && <span>{duration}</span>}
            {dates && <span>· {dates}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {locationCount}
          </div>
          <div className="text-xs text-gray-500">saved</div>
        </div>
      </div>
    </button>
  )
}

