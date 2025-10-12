import React, { useState } from 'react'
import type { Trip } from '../lib/types'
import { TripCard } from '../components/TripCard'
import { Button } from '../components/Button'

interface TripsViewProps {
  trips: Trip[]
  onTripClick: (trip: Trip) => void
  onNewTrip: () => void
}

export function TripsView({ trips, onTripClick, onNewTrip }: TripsViewProps) {
  const activeTrip = trips.find(t => t.is_active)
  
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
    <div className="p-4 space-y-4">
      {/* Active Trip Selector */}
      {activeTrip && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Active Trip
          </label>
          <div className="bg-primary-light border border-primary rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeTrip.country?.emoji || '🌐'}</span>
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
        </div>
      )}
      
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
      
      {/* New Trip Button */}
      <button
        onClick={onNewTrip}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-light/30 transition-colors"
      >
        + New Trip
      </button>
      
      {/* Tip */}
      <div className="pt-2 text-center text-xs text-gray-500">
        💡 Tip: Right-click any text to save!
      </div>
    </div>
  )
}

