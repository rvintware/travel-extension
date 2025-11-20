import React, { useState } from 'react'
import type { Trip, Location } from '../lib/types'
import * as api from '../lib/api'
import { Cache } from '../lib/cache'

interface AddToTripModalProps {
  location: Location
  trips: Trip[]
  onClose: () => void
  onSuccess: (tripId: string, tripName: string, location: Location) => void
  onAlreadyInTrip: (tripName: string) => void
}

export function AddToTripModal({ location, trips, onClose, onSuccess, onAlreadyInTrip }: AddToTripModalProps) {
  const [loading, setLoading] = useState(false)
  
  async function handleTripClick(trip: Trip) {
    setLoading(true)
    try {
      // Try to add location to trip (unscheduled by default)
      await api.linkLocationToTrip({
        tripId: trip.id,
        locationId: location.id,
        dayNumber: undefined, // Always unscheduled from library
      })
      
      // Invalidate caches
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // Capture location BEFORE closing modal (onClose clears selectedLocation)
      const locationToPass = location
      
      // Close modal FIRST
      onClose()
      
      // Defer success callback to ensure modal closes before toast appears
      // Use requestAnimationFrame to ensure React processes the close state update first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onSuccess(trip.id, trip.name, locationToPass)
        })
      })
    } catch (error) {
      console.error('Failed to add to trip:', error)
      // Check for conflict (409) or error message indicating duplicate
      if (error instanceof Error && (
        error.message.includes('already in this trip') ||
        error.message.includes('already exists') ||
        error.message.includes('HTTP 409')
      )) {
        // Close modal FIRST
        onClose()
        
        // Defer callback to ensure modal closes before toast appears
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onAlreadyInTrip(trip.name)
          })
        })
      } else {
        // Other error - close modal and show error
        onClose()
        console.error('Failed to add to trip:', error)
        // Error toast will be handled by parent component
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Add to Trip</h2>
        
        {trips.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              Create a trip first!
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">Select a trip:</p>
            
            <div className="max-h-48 overflow-y-auto space-y-1">
              {trips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => handleTripClick(trip)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                >
                  {trip.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

