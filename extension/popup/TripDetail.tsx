import React, { useState, useEffect } from 'react'
import type { Trip, LocationWithTripData } from '../lib/types'
import { LocationCard } from '../components/LocationCard'
import { DayFilter } from '../components/DayFilter'
import { TimeEstimate } from '../components/TimeEstimate'
import { TripSettingsModal } from '../components/TripSettingsModal'
import { NotesEditorModal } from '../components/NotesEditorModal'
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notesEditorOpen, setNotesEditorOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationWithTripData | null>(null)
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
  
  // Get all days from trip duration (including empty days)
  const days = currentTrip.duration_days && currentTrip.duration_days > 0
    ? Array.from({ length: currentTrip.duration_days }, (_, i) => i + 1)
    : []
  
  // Get counts for day filter (include all days, even empty ones)
  const counts: Record<string | number, number> = {
    all: locations.length,
    unscheduled: byDay.unscheduled?.length || 0,
  }
  days.forEach(day => {
    counts[day] = byDay[day]?.length || 0
  })
  
  // Filter locations based on selected day
  // When "All" is selected, sort by day number (1, 2, ..., N, then unscheduled)
  const filteredLocations = selectedDay === 'all'
    ? [...locations].sort((a, b) => {
        // Unscheduled locations go last
        if (a.dayNumber === null && b.dayNumber === null) return 0
        if (a.dayNumber === null) return 1
        if (b.dayNumber === null) return -1
        // Sort by day number, then by display order
        if (a.dayNumber !== b.dayNumber) {
          return (a.dayNumber || 0) - (b.dayNumber || 0)
        }
        return (a.displayOrder || 0) - (b.displayOrder || 0)
      })
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
      
      case 'edit':
        // Open notes editor modal
        setEditingLocation(location)
        setNotesEditorOpen(true)
        break
      
      case 'move-to-day':
        // Move to specific day (or unschedule if data is null)
        try {
          const dayNumber = data === 'null' || data === null ? null : parseInt(data)
          
          // STEP 1: Perform API call
          if (location.tripLocationId) {
            // Update existing trip location
            await api.updateTripLocation(location.tripLocationId, { dayNumber })
          } else {
            // Link location to trip
            await api.linkLocationToTrip({
              tripId: currentTrip.id,
            locationId: location.id,
              dayNumber: dayNumber || undefined,
          })
          }
          
          // STEP 2: OPTIMISTIC UPDATE - Update UI immediately (0ms blocking)
          // Update locations array
          setLocations(prev => prev.map(loc => 
            loc.id === location.id
              ? { ...loc, dayNumber }
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
            // Add to new day or unscheduled
            const targetDay = dayNumber ?? 'unscheduled'
            if (!newByDay[targetDay]) {
              newByDay[targetDay] = []
            }
            newByDay[targetDay] = [...newByDay[targetDay], { ...location, dayNumber }]
            return newByDay
          })
          
          // STEP 3: Invalidate relevant caches
          await Cache.invalidateTrips()
          await Cache.invalidateLocations()
          
          // STEP 4: Notify parent via callback (instant, ~0ms)
          if (dayNumber === null) {
            onLocationUnscheduled?.()
          } else {
          onLocationMoved?.()
          }
          
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
        // Move to unscheduled - same logic as move-to-day with null
        try {
          // STEP 1: Perform API call
          if (location.tripLocationId) {
            await api.updateTripLocation(location.tripLocationId, { dayNumber: null })
          } else {
            await api.linkLocationToTrip({
              tripId: currentTrip.id,
            locationId: location.id,
              dayNumber: undefined,
          })
          }
          
          // STEP 2: OPTIMISTIC UPDATE
          setLocations(prev => prev.map(loc => 
            loc.id === location.id ? { ...loc, dayNumber: null } : loc
          ))
          
          setByDay(prev => {
            const newByDay = { ...prev }
            Object.keys(newByDay).forEach(day => {
              if (newByDay[day]) {
                newByDay[day] = newByDay[day].filter(l => l.id !== location.id)
              }
            })
            if (!newByDay.unscheduled) {
              newByDay.unscheduled = []
            }
            newByDay.unscheduled = [...newByDay.unscheduled, { ...location, dayNumber: null }]
            return newByDay
          })
          
          // STEP 3: Invalidate caches
          await Cache.invalidateTrips()
          await Cache.invalidateLocations()
          
          // STEP 4: Notify parent
          onLocationUnscheduled?.()
          
          // STEP 5: Background refresh
          loadTripLocations().catch(error => {
            console.error('Refresh failed:', error)
            loadTripLocations()
          })
        } catch (error) {
          console.error('Failed to unschedule:', error)
          loadTripLocations()
        }
        break
      
      case 'remove-from-trip':
        // Remove from trip (handled by DeletePill in LocationCard)
        await handleRemoveFromTrip(location)
        break
    }
  }
  
  async function handleRemoveFromTrip(location: LocationWithTripData) {
    try {
      // STEP 1: Perform API call
      await api.removeFromTrip(currentTrip.id, location.id)
      
      // STEP 2: OPTIMISTIC UPDATE - Remove location immediately (0ms blocking)
      setLocations(prev => prev.filter(loc => loc.id !== location.id))
      
      // Update byDay grouping optimistically
      setByDay(prev => {
        const newByDay = { ...prev }
        Object.keys(newByDay).forEach(day => {
          if (newByDay[day]) {
            newByDay[day] = newByDay[day].filter(l => l.id !== location.id)
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
    } catch (error) {
      console.error('Failed to remove from trip:', error)
      // On API error, refresh to get real state
      loadTripLocations()
    }
  }
  
  async function handleSaveNotes(notes: string) {
    if (!editingLocation || !editingLocation.tripLocationId) return
    
    try {
      // STEP 1: Perform API call
      await api.updateTripLocation(editingLocation.tripLocationId, { notes })
      
      // STEP 2: OPTIMISTIC UPDATE - Update UI immediately
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id
          ? { ...loc, notes }
          : loc
      ))
      
      // Update byDay grouping optimistically
      setByDay(prev => {
        const newByDay = { ...prev }
        Object.keys(newByDay).forEach(day => {
          if (newByDay[day]) {
            newByDay[day] = newByDay[day].map(l => 
              l.id === editingLocation.id ? { ...l, notes } : l
            )
          }
        })
        return newByDay
      })
      
      // STEP 3: Invalidate caches
      await Cache.invalidateLocations()
      
      // STEP 4: Background refresh to verify
      loadTripLocations().catch(error => {
        console.error('Refresh failed:', error)
        loadTripLocations()
      })
    } catch (error) {
      console.error('Failed to save notes:', error)
      throw error // Let NotesEditorModal handle error display
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
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
              title="Edit trip"
            >
              <span className="text-xl">✏️</span>
            </button>
          <button 
            onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            disabled={refreshing}
            title="Refresh"
              aria-label="Refresh"
          >
              <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
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
      {currentTrip.duration_days && currentTrip.duration_days > 0 ? (
        <DayFilter
          days={days}
          counts={counts}
          active={selectedDay}
          onChange={setSelectedDay}
        />
      ) : (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
          💡 Set trip duration in settings to assign locations to days
        </div>
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
                onDelete={() => handleRemoveFromTrip(location)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Notes Editor Modal */}
      <NotesEditorModal
        isOpen={notesEditorOpen}
        initialNotes={editingLocation?.notes || ''}
        onSave={handleSaveNotes}
        onClose={() => {
          setNotesEditorOpen(false)
          setEditingLocation(null)
        }}
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

