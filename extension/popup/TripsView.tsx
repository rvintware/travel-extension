import React, { useState, useEffect } from 'react'
import type { Trip } from '../lib/types'
import { TripCard } from '../components/TripCard'
import { Button } from '../components/Button'
import { getSettings } from '../lib/storage'

interface TripsViewProps {
  trips: Trip[]
  onTripClick: (trip: Trip) => void
  onNewTrip: () => void
}

export function TripsView({ trips, onTripClick, onNewTrip }: TripsViewProps) {
  const [settings, setSettings] = useState<any>(null)
  
  // Load settings on mount
  useEffect(() => {
    getSettings().then(setSettings)
  }, [])
  
  // Find active trip from settings OR trip.is_active flag (sync both)
  const activeTrip = settings?.defaultTripId 
    ? trips.find(t => t.id === settings.defaultTripId)
    : trips.find(t => t.is_active) || null
  
  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No trips yet
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-xs">
          Create a trip to organize your saved locations into an itinerary
        </p>
        
        <Button onClick={onNewTrip} variant="primary">
          + Create First Trip
        </Button>
        
        <div className="mt-6 text-sm text-gray-500">
          💡 Tip: Right-click any text on a webpage to save locations
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {/* Active Trip Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Active Trip
          </label>
          {activeTrip ? (
            <div className="bg-primary-light border border-primary rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary-dark">
                    {activeTrip.name}
                  </span>
                </div>
                <span className="text-primary">⭐</span>
              </div>
              <p className="text-xs text-primary-dark mt-1">
                Quick-saves go here
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                No active trip selected
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Set a default trip in Settings to use quick-saves
              </p>
            </div>
          )}
        </div>
        
        {/* Trip List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">
              Your Trips · {trips.length}
            </h2>
          </div>
          
          <div className="space-y-4">
            {trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => onTripClick(trip)}
              />
            ))}
          </div>
        </div>
        
        {/* Tip */}
        <div className="pt-2 text-center text-xs text-gray-500 pb-4">
          💡 Tip: Right-click any text to save!
        </div>
      </div>
      
      {/* Footer - Fixed at bottom */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
        <Button
          onClick={onNewTrip}
          variant="primary"
          className="w-full"
        >
          + New Trip
        </Button>
      </div>
    </div>
  )
}

