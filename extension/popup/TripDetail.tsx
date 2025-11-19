import React, { useState, useEffect } from 'react'
import type { Trip, LocationWithTripData } from '../lib/types'
import { LocationCard } from '../components/LocationCard'
import { DayFilter } from '../components/DayFilter'
import { TimeEstimate } from '../components/TimeEstimate'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TripSettingsModal } from '../components/TripSettingsModal'
import type { GearAction } from '../components/GearMenu'
import * as api from '../lib/api'
import { Cache } from '../lib/cache'

interface TripDetailProps {
  trip: Trip
  onBack: () => void
  onLocationMoved?: () => void
  onLocationRemoved?: () => void
  onLocationLinked?: () => void
  onLocationUnscheduled?: () => void
  onTripUpdated?: (trip: Trip) => void  // Callback when trip is updated
}

export function TripDetail({ trip, onBack, onLocationMoved, onLocationRemoved, onLocationLinked, onLocationUnscheduled, onTripUpdated }: TripDetailProps) {
  const [locations, setLocations] = useState<LocationWithTripData[]>([])
  const [byDay, setByDay] = useState<Record<string | number, LocationWithTripData[]>>({})
  const [selectedDay, setSelectedDay] = useState<number | 'all' | 'unscheduled'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    location: LocationWithTripData | null
  }>({ isOpen: false, location: null })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentTrip, setCurrentTrip] = useState<Trip>(trip)
  
  // Calculate unique countries count from locations
  const uniqueCountriesCount = React.useMemo(() => {
    const uniqueCountryIds = new Set(locations.map(loc => loc.country_id))
    return uniqueCountryIds.size
  }, [locations])
  
  useEffect(() => {
    setCurrentTrip(trip)
  }, [trip])
  
  useEffect(() => {
    loadTripLocations()
  }, [currentTrip.id])
  
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
      const data = await api.getTripLocations(currentTrip.id)
      setLocations(data.locations)
      setByDay(data.byDay)
    } catch (error) {
      console.error('Failed to load trip locations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function refreshTripData() {
    try {
      const freshTrip = await api.getTrip(currentTrip.id)
      setCurrentTrip(freshTrip)
      return freshTrip
    } catch (error) {
      console.error('Failed to refresh trip data:', error)
      // Return current trip as fallback
      return currentTrip
    }
  }
  
  async function handleRefresh() {
    setRefreshing(true)
    try {
      // Refresh trip data
      const refreshedTrip = await api.getTrip(currentTrip.id)
      setCurrentTrip(refreshedTrip)
      // Refresh locations
      const data = await api.getTripLocations(currentTrip.id)
      setLocations(data.locations)
      setByDay(data.byDay)
    } finally {
      setRefreshing(false)
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
  
  function openMapPopup() {
    // Get API key from environment (available in extension context)
    const apiKey = process.env.PLASMO_PUBLIC_GOOGLE_PLACES_API_KEY || ''
    
    // TODO: For production, migrate to backend proxy to avoid exposing API key
    // See: Backend endpoint /api/trips/:id/map-render-config
    
    // Open in browser tab instead of popup window to avoid MV3 CSP restrictions
    chrome.tabs.create({
      url: chrome.runtime.getURL(
        `tabs/map.html?tripId=${currentTrip.id}&apiKey=${encodeURIComponent(apiKey)}`
      ),
      active: true, // Focus the new tab
    })
  }
  
  const handleAction = async (location: LocationWithTripData, action: GearAction, data?: any) => {
    switch (action) {
      case 'set-time':
        // TODO: Open time picker modal
        console.log('Set time for:', location.id)
        break
      
      case 'move-to-day':
        // Move to specific day
        try {
          // STEP 1: Perform API call (get backend response)
          const result = await api.linkLocationToTrip({
            tripId: currentTrip.id,
            locationId: location.id,
            dayNumber: data, // The day number
          })
          
          // STEP 2: OPTIMISTIC UPDATE - Update UI immediately (0ms blocking)
          // Update locations array
          setLocations(prev => prev.map(loc => 
            loc.id === location.id
              ? { ...loc, dayNumber: data }
              : loc
          ))
          
          // Update byDay grouping optimistically
          setByDay(prev => {
            const newByDay = { ...prev }
            // Remove from old day/unscheduled
            Object.keys(newByDay).forEach(day => {
              if (newByDay[day]) {
                newByDay[day] = newByDay[day].filter(l => l.id !== location.id)
              }
            })
            // Add to new day
            if (!newByDay[data]) {
              newByDay[data] = []
            }
            newByDay[data] = [...newByDay[data], { ...location, dayNumber: data }]
            return newByDay
          })
          
          // STEP 3: Invalidate relevant caches
          await Cache.invalidateTrips()
          await Cache.invalidateLocations()
          
          // STEP 4: Notify parent via callback (instant, ~0ms)
          onLocationMoved?.()
          
          // STEP 5: Background refresh to verify (non-blocking)
          loadTripLocations().catch(error => {
            // On error, revert optimistic update by refreshing from server
            console.error('Refresh failed:', error)
            loadTripLocations() // Get real state from server
          })
        } catch (error) {
          console.error('Failed to move location:', error)
          // On API error, refresh to get real state
          loadTripLocations()
        }
        break
      
      case 'unschedule':
        // Move to unscheduled
        try {
          // STEP 1: Perform API call (get backend response)
          const result = await api.linkLocationToTrip({
            tripId: currentTrip.id,
            locationId: location.id,
            dayNumber: undefined, // null = unscheduled
          })
          
          // STEP 2: OPTIMISTIC UPDATE - Update UI immediately (0ms blocking)
          // Update locations array
          setLocations(prev => prev.map(loc => 
            loc.id === location.id
              ? { ...loc, dayNumber: null }
              : loc
          ))
          
          // Update byDay grouping optimistically
          setByDay(prev => {
            const newByDay = { ...prev }
            // Remove from old day
            Object.keys(newByDay).forEach(day => {
              if (newByDay[day]) {
                newByDay[day] = newByDay[day].filter(l => l.id !== location.id)
              }
            })
            // Add to unscheduled
            if (!newByDay.unscheduled) {
              newByDay.unscheduled = []
            }
            newByDay.unscheduled = [...newByDay.unscheduled, { ...location, dayNumber: null }]
            return newByDay
          })
          
          // STEP 3: Invalidate relevant caches
          await Cache.invalidateTrips()
          await Cache.invalidateLocations()
          
          // STEP 4: Notify parent via callback (instant, ~0ms)
          onLocationUnscheduled?.()
          
          // STEP 5: Background refresh to verify (non-blocking)
          loadTripLocations().catch(error => {
            // On error, revert optimistic update by refreshing from server
            console.error('Refresh failed:', error)
            loadTripLocations() // Get real state from server
          })
        } catch (error) {
          console.error('Failed to unschedule:', error)
          // On API error, refresh to get real state
          loadTripLocations()
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
    
    const locationToRemove = confirmDialog.location
    
    try {
      // STEP 1: Perform API call
      await api.removeFromTrip(currentTrip.id, locationToRemove.id)
      
      // STEP 2: OPTIMISTIC UPDATE - Remove location immediately (0ms blocking)
      setLocations(prev => prev.filter(loc => loc.id !== locationToRemove.id))
      
      // Update byDay grouping optimistically
      setByDay(prev => {
        const newByDay = { ...prev }
        Object.keys(newByDay).forEach(day => {
          if (newByDay[day]) {
            newByDay[day] = newByDay[day].filter(l => l.id !== locationToRemove.id)
          }
        })
        return newByDay
      })
      
      // STEP 3: Invalidate caches (trip count changed)
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // STEP 4: Notify parent via callback (instant, ~0ms)
      onLocationRemoved?.()
      
      // STEP 5: Background refresh to verify (non-blocking)
      loadTripLocations().catch(error => {
        // On error, revert optimistic update by refreshing from server
        console.error('Refresh failed:', error)
        loadTripLocations() // Get real state from server
      })
      
      setConfirmDialog({ isOpen: false, location: null })
    } catch (error) {
      console.error('Failed to remove from trip:', error)
      // On API error, refresh to get real state
      loadTripLocations()
      setConfirmDialog({ isOpen: false, location: null })
    }
  }
  
  async function handleExport() {
    setExporting(true)
    try {
      console.log('[Export] Starting export for trip:', currentTrip.id)
      
      // Call API
      const result = await api.exportTrip(currentTrip.id)
      
      // Create blob
      const blob = new Blob([result.exportText], { 
        type: 'text/plain;charset=utf-8' 
      })
      const url = URL.createObjectURL(blob)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('[Export] Success, file downloaded:', result.filename)
    } catch (error) {
      console.error('[Export] Failed:', error)
    } finally {
      setExporting(false)
    }
  }
  
  async function handleSettingsSuccess(updatedTrip: Trip) {
    // Update local trip state with returned data (optimistic)
    setCurrentTrip(updatedTrip)
    
    // Refresh trip locations
    loadTripLocations()
    
    // Fetch fresh trip data from server to ensure consistency
    const freshTrip = await refreshTripData()
    
    // Notify parent component to update its state
    onTripUpdated?.(freshTrip)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
          >
            <span>←</span>
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xl text-gray-600 hover:text-primary transition-colors"
              title="Edit trip"
            >
              ✏️
            </button>
            <button 
              onClick={handleRefresh}
              className="text-gray-600 hover:text-primary transition-colors"
              disabled={refreshing}
              title="Refresh"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            </button>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{currentTrip.name}</h1>
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>
                {uniqueCountriesCount} {uniqueCountriesCount === 1 ? 'Country' : 'Countries'}
              </span>
              <span>·</span>
              <span>{locations.length} {locations.length === 1 ? 'location' : 'locations'}</span>
              <span>·</span>
              <button
                onClick={openMapPopup}
                className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1 font-medium"
              >
                <span>🗺️</span>
                <span>Map View</span>
              </button>
            </div>
            {/* Display trip dates if available */}
            {currentTrip.start_date && currentTrip.end_date && (
              <div className="text-sm text-gray-600 mt-1">
                {new Date(currentTrip.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(currentTrip.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </div>
            )}
            <div className="flex items-center justify-end mt-1">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
                title="Export trip"
              >
                <span>📤</span>
                <span>{exporting ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
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
      
      {/* Settings Modal */}
      <TripSettingsModal
        isOpen={settingsOpen}
        trip={currentTrip}
        onClose={() => setSettingsOpen(false)}
        onSuccess={handleSettingsSuccess}
      />
    </div>
  )
}

