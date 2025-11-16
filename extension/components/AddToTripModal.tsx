import React, { useState } from 'react'
import type { Trip, Location } from '../lib/types'
import { Button } from './Button'
import * as api from '../lib/api'
import { Cache } from '../lib/cache'

interface AddToTripModalProps {
  location: Location
  trips: Trip[]
  onClose: () => void
  onSuccess: () => void
}

export function AddToTripModal({ location, trips, onClose, onSuccess }: AddToTripModalProps) {
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || '')
  const [dayNumber, setDayNumber] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  
  const selectedTrip = trips.find(t => t.id === selectedTripId)
  const days = selectedTrip?.duration_days
    ? Array.from({ length: selectedTrip.duration_days }, (_, i) => i + 1)
    : []
  
  async function handleAdd() {
    if (!selectedTripId) return
    
    setLoading(true)
    try {
      // STEP 1: Perform API call (get backend response)
      const result = await api.linkLocationToTrip({
        tripId: selectedTripId,
        locationId: location.id,
        dayNumber: dayNumber || undefined,
      })
      
      // STEP 2: Invalidate caches (trip count changed)
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // STEP 3: Notify parent via callback (optimistic update handled in parent)
      // Parent will optimistically update trips list
      onSuccess()
      
      // Background refresh handled by parent callback
    } catch (error) {
      console.error('Failed to add to trip:', error)
      if (error instanceof Error && error.message.includes('already in this trip')) {
        alert('This location is already in that trip')
      } else {
        alert('Failed to add to trip')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add to Trip</h2>
        
        {trips.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-4">
              You don't have any trips yet. Create a trip first!
            </p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Trip Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which trip?
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Day Selection (optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to day? (optional)
              </label>
              <select
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Leave unscheduled</option>
                {days.map(day => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                variant="primary"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add to Trip'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

