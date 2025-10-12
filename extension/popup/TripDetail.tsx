import React, { useState, useEffect } from 'react'
import type { Trip, LocationWithTripData } from '../lib/types'
import { LocationCard } from '../components/LocationCard'
import { DayFilter } from '../components/DayFilter'
import { TimeEstimate } from '../components/TimeEstimate'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { GearAction } from '../components/GearMenu'
import * as api from '../lib/api'
import { Cache } from '../lib/cache'

interface TripDetailProps {
  trip: Trip
  onBack: () => void
}

export function TripDetail({ trip, onBack }: TripDetailProps) {
  const [locations, setLocations] = useState<LocationWithTripData[]>([])
  const [byDay, setByDay] = useState<Record<string | number, LocationWithTripData[]>>({})
  const [selectedDay, setSelectedDay] = useState<number | 'all' | 'unscheduled'>('all')
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    location: LocationWithTripData | null
  }>({ isOpen: false, location: null })
  
  useEffect(() => {
    loadTripLocations()
  }, [trip.id])
  
  // Poll for processing locations
  useEffect(() => {
    const hasPending = locations.some(l => 
      l.processing_status === 'pending' || l.processing_status === 'processing'
    )
    
    if (hasPending) {
      console.log('[TripDetail] Polling for processing locations...')
      const interval = setInterval(() => {
        loadTripLocations() // Refresh to get updated statuses
      }, 3000) // Poll every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [locations])
  
  async function loadTripLocations() {
    try {
      const data = await api.getTripLocations(trip.id)
      setLocations(data.locations)
      setByDay(data.byDay)
    } catch (error) {
      console.error('Failed to load trip locations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Get unique day numbers
  const days = Object.keys(byDay)
    .filter(key => key !== 'unscheduled' && !isNaN(Number(key)))
    .map(Number)
    .sort((a, b) => a - b)
  
  // Get counts for day filter
  const counts: Record<string | number, number> = {
    all: locations.length,
    unscheduled: byDay.unscheduled?.length || 0,
  }
  days.forEach(day => {
    counts[day] = byDay[day]?.length || 0
  })
  
  // Filter locations based on selected day
  const filteredLocations = selectedDay === 'all'
    ? locations
    : selectedDay === 'unscheduled'
    ? byDay.unscheduled || []
    : byDay[selectedDay] || []
  
  // Calculate time estimate for selected day
  const calculateTimeEstimate = () => {
    if (selectedDay === 'all' || selectedDay === 'unscheduled') {
      return null
    }
    
    const dayLocations = byDay[selectedDay] || []
    const activityMinutes = dayLocations.reduce((sum, loc) => 
      sum + (loc.estimatedDurationMinutes || 0), 0
    )
    
    // TODO: Get travel times from API (location_distances table)
    const travelMinutes = 0  // For MVP, set to 0
    
    return { activityMinutes, travelMinutes }
  }
  
  const timeEstimate = calculateTimeEstimate()
  
  const handleAction = async (location: LocationWithTripData, action: GearAction, data?: any) => {
    switch (action) {
      case 'set-time':
        // TODO: Open time picker modal
        console.log('Set time for:', location.id)
        break
      
      case 'move-to-day':
        // Move to specific day
        try {
          await api.linkLocationToTrip({
            tripId: trip.id,
            locationId: location.id,
            dayNumber: data, // The day number
          })
          
          // Invalidate caches
          await Cache.invalidateTrips()
          await Cache.invalidateLocations()
          
          await loadTripLocations() // Refresh
        } catch (error) {
          console.error('Failed to move location:', error)
        }
        break
      
      case 'unschedule':
        // Move to unscheduled
        try {
          await api.linkLocationToTrip({
            tripId: trip.id,
            locationId: location.id,
            dayNumber: undefined, // null = unscheduled
          })
          
          // Invalidate caches
          await Cache.invalidateTrips()
          await Cache.invalidateLocations()
          
          await loadTripLocations() // Refresh
        } catch (error) {
          console.error('Failed to unschedule:', error)
        }
        break
      
      case 'remove-from-trip':
        // Show confirm dialog
        setConfirmDialog({ isOpen: true, location })
        break
    }
  }
  
  async function handleConfirmRemove() {
    if (!confirmDialog.location) return
    
    try {
      await api.removeFromTrip(trip.id, confirmDialog.location.id)
      
      // Invalidate caches (trip count changed)
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      await loadTripLocations() // Refresh
      setConfirmDialog({ isOpen: false, location: null })
    } catch (error) {
      console.error('Failed to remove from trip:', error)
      setConfirmDialog({ isOpen: false, location: null })
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-2"
        >
          <span>←</span>
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{trip.name}</h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span>{trip.country?.emoji || '🌐'}</span>
              {trip.duration_days && <span>{trip.duration_days} days</span>}
              {trip.start_date && trip.end_date && (
                <span>
                  · {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                  {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span>· {locations.length} {locations.length === 1 ? 'location' : 'locations'}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Day Filters */}
      {days.length > 0 && (
        <DayFilter
          days={days}
          counts={counts}
          active={selectedDay}
          onChange={setSelectedDay}
        />
      )}
      
      {/* Time Estimate (for specific days only) */}
      {timeEstimate && (
        <TimeEstimate
          activityMinutes={timeEstimate.activityMinutes}
          travelMinutes={timeEstimate.travelMinutes}
        />
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm text-gray-600">
              {selectedDay === 'all' 
                ? 'No locations in this trip yet'
                : selectedDay === 'unscheduled'
                ? 'No unscheduled locations'
                : `No locations for Day ${selectedDay}`
              }
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {filteredLocations.map(location => (
              <LocationCard
                key={location.id}
                location={location}
                context="trip"
                days={days}
                onAction={(action, data) => handleAction(location, action, data)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove from Trip?"
        message={confirmDialog.location 
          ? `Remove "${confirmDialog.location.name}" from this trip? It will remain in your library.`
          : ''
        }
        confirmText="Remove"
        confirmVariant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmDialog({ isOpen: false, location: null })}
      />
    </div>
  )
}

