import React from 'react'
import type { Trip } from '../lib/types'
import { formatRelativeTime } from '../lib/utils'

interface TripCardProps {
  trip: Trip
  onClick: () => void
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const locationCount = trip.locationCount || 0
  const countryCount = (trip as any).countryCount || 0
  
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 text-xl leading-tight">{trip.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {trip.is_active && <span className="text-primary font-medium">Active</span>}
            {countryCount > 0 && <span>{countryCount} {countryCount === 1 ? 'country' : 'countries'}</span>}
            {duration && <span>· {duration}</span>}
            {dates && <span>· {dates}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-semibold text-gray-900">
            {locationCount}
          </div>
          <div className="text-xs text-gray-500">saved</div>
        </div>
      </div>
    </button>
  )
}

