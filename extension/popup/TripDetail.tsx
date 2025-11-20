import React, { useState, useEffect, useCallback } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import type { Trip, LocationWithTripData } from '../lib/types'
import { CompactLocationCard } from '../components/CompactLocationCard'
import { SortableCompactLocationCard } from '../components/SortableCompactLocationCard'
import { DayFilter } from '../components/DayFilter'
import { TripSettingsModal } from '../components/TripSettingsModal'
import { LocationEditModal } from '../components/LocationEditModal'
import { useToast } from '../components/Toast'
import type { GearAction } from '../components/GearMenu'
import * as api from '../lib/api'
import { Cache } from '../lib/cache'
import { debounce } from '../lib/utils'

interface TripDetailProps {
  trip: Trip
  onBack: () => void
  onLocationMoved?: () => void
  onLocationRemoved?: () => void
  onLocationLinked?: () => void
  onLocationUnscheduled?: () => void
  onTripUpdated?: (trip: Trip) => void  // Callback when trip is updated
  onLocationClick?: (location: LocationWithTripData) => void  // NEW - for navigation to detail view
  onTripDeleted?: (tripId: string) => void  // Callback when trip is deleted
}

export function TripDetail({ trip, onBack, onLocationMoved, onLocationRemoved, onLocationLinked, onLocationUnscheduled, onTripUpdated, onLocationClick, onTripDeleted }: TripDetailProps) {
  const [locations, setLocations] = useState<LocationWithTripData[]>([])
  const [byDay, setByDay] = useState<Record<string | number, LocationWithTripData[]>>({})
  const [selectedDay, setSelectedDay] = useState<number | 'all' | 'unscheduled'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentTrip, setCurrentTrip] = useState<Trip>(trip)
  const [reorderError, setReorderError] = useState<{ previousOrder: string[]; dayNumber: number } | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedLocationForEdit, setSelectedLocationForEdit] = useState<LocationWithTripData | null>(null)
  const { showToast, ToastComponent } = useToast()
  
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
      setReorderError(null) // Clear any reorder errors on successful load
    } catch (error) {
      console.error('Failed to load trip locations:', error)
      showToast('Failed to load locations', 'error')
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
  
  
  const handleAction = async (location: LocationWithTripData, action: GearAction, data?: any) => {
    switch (action) {
      case 'set-time':
        // TODO: Open time picker modal
        console.log('Set time for:', location.id)
        break
      
      case 'edit-location':
        // Open edit modal instead of navigating
        setSelectedLocationForEdit(location)
        setEditModalOpen(true)
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
          showToast('Failed to assign location to day', 'error')
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
          showToast('Failed to unschedule location', 'error')
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
      showToast('Failed to remove location from trip', 'error')
      // On API error, refresh to get real state
      loadTripLocations()
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
    try {
      // Update local trip state with returned data (optimistic)
      setCurrentTrip(updatedTrip)
      
      // Refresh trip locations
      loadTripLocations()
      
      // Fetch fresh trip data from server to ensure consistency
      const freshTrip = await refreshTripData()
      
      // Notify parent component to update its state
      onTripUpdated?.(freshTrip)
    } catch (error) {
      console.error('Failed to update trip settings:', error)
      showToast('Failed to update trip settings', 'error')
    }
  }

  // Handle drag end for reordering locations
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }
    
    // Only allow reordering when viewing a specific day
    if (selectedDay === 'all' || selectedDay === 'unscheduled' || typeof selectedDay !== 'number') {
      return
    }
    
    const dayLocations = filteredLocations
    const oldIndex = dayLocations.findIndex(loc => loc.id === active.id)
    const newIndex = dayLocations.findIndex(loc => loc.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    
    // Calculate new order
    const newOrder = [...dayLocations]
    const [movedItem] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, movedItem)
    const newLocationIds = newOrder.map(loc => loc.id)
    
    // Store previous order for revert
    const previousOrder = dayLocations.map(loc => loc.id)
    setReorderError({ previousOrder, dayNumber: selectedDay })
    
    // Optimistic update: reorder immediately
    setLocations(prev => {
      const reordered = [...prev]
      const dayLocationIds = new Set(newLocationIds)
      const dayLocationsInOrder = newLocationIds.map(id => 
        reordered.find(loc => loc.id === id)
      ).filter(Boolean) as LocationWithTripData[]
      
      // Update display_order in the locations array
      dayLocationsInOrder.forEach((loc, index) => {
        const locationIndex = reordered.findIndex(l => l.id === loc.id)
        if (locationIndex !== -1) {
          reordered[locationIndex] = { ...reordered[locationIndex], displayOrder: index + 1 }
        }
      })
      
      return reordered
    })
    
    // Update byDay grouping optimistically
    setByDay(prev => ({
      ...prev,
      [selectedDay]: newOrder
    }))
    
    // Call API to save new order
    try {
      await api.reorderTripLocations(currentTrip.id, selectedDay, newLocationIds)
      setReorderError(null) // Clear error state on success
      showToast('Order updated', 'success')
      
      // Background refresh to verify
      loadTripLocations().catch(error => {
        console.error('Refresh failed:', error)
        loadTripLocations()
      })
    } catch (error) {
      console.error('Failed to reorder locations:', error)
      
      // Revert optimistic update - restore previous order
      const previousOrderLocations = previousOrder.map(id => 
        dayLocations.find(loc => loc.id === id)
      ).filter(Boolean) as LocationWithTripData[]
      
      setLocations(prev => {
        const reverted = [...prev]
        previousOrderLocations.forEach((loc, index) => {
          const locationIndex = reverted.findIndex(l => l.id === loc.id)
          if (locationIndex !== -1) {
            reverted[locationIndex] = { ...reverted[locationIndex], displayOrder: index + 1 }
          }
        })
        return reverted
      })
      
      setByDay(prev => ({
        ...prev,
        [selectedDay]: previousOrderLocations
      }))
      
      showToast('Failed to save order', 'error')
    }
  }

  // Retry reorder with debouncing
  const handleRetryReorder = useCallback(() => {
    if (!reorderError) return
    
    const { dayNumber } = reorderError
    const dayLocations = byDay[dayNumber] || []
    const currentOrder = dayLocations.map(loc => loc.id)
    
    if (currentOrder.length === 0) {
      setReorderError(null)
      return
    }
    
    const retryFn = async () => {
      try {
        await api.reorderTripLocations(currentTrip.id, dayNumber, currentOrder)
        setReorderError(null)
        showToast('Order updated', 'success')
        loadTripLocations().catch(() => loadTripLocations())
      } catch (error) {
        console.error('Retry failed:', error)
        showToast('Failed to save order', 'error')
      }
    }
    
    debounce(retryFn, 500)()
  }, [reorderError, currentTrip.id, byDay, showToast])
  
  return (
    <div className="flex flex-col h-full">
      {/* Nav Bar - matches Tabs component structure */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors py-3"
        >
          <span>←</span>
          <span className="font-medium">Back</span>
        </button>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title="Edit trip"
            aria-label="Edit trip details"
          >
            <span className="text-xl">✏️</span>
          </button>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            disabled={refreshing}
            title="Refresh data"
            aria-label="Refresh trip data"
          >
            <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>
      </div>
      
      {/* Trip Info Section */}
      <div className="bg-white border-b border-gray-200 py-2 px-4 flex-shrink-0">
        <div className="bg-gray-50 rounded-lg p-3">
          {/* Line 1: Trip Name + Dates */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              {currentTrip.name}
            </h1>
            {currentTrip.start_date && currentTrip.end_date && (
              <span className="text-sm text-gray-600">
                {new Date(currentTrip.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(currentTrip.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          
          {/* Line 2: Countries Count + Days Count */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              {uniqueCountriesCount} {uniqueCountriesCount === 1 ? 'Country' : 'Countries'}
            </span>
            {currentTrip.duration_days && (
              <span>
                {currentTrip.duration_days} {currentTrip.duration_days === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
          
          {/* Line 3: Locations Count + Export */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {locations.length} {locations.length === 1 ? 'location' : 'locations'}
            </span>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
              title="Export trip"
            >
              <span>📤</span>
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
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
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center" aria-live="polite">
            {selectedDay === 'all' ? (
              <>
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No locations in this trip yet</h3>
                <p className="text-sm text-gray-600">Add locations from your library or save new ones</p>
              </>
            ) : selectedDay === 'unscheduled' ? (
              <>
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No unscheduled locations</h3>
                <p className="text-sm text-gray-600">All locations are assigned to days</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">📅</div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No locations for Day {selectedDay}</h3>
                <p className="text-sm text-gray-600">Assign locations from the All tab or add new ones</p>
                <p className="text-xs text-gray-500 mt-2">Use the kebab menu (⋮) to assign locations to this day</p>
              </>
            )}
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="p-4 space-y-6">
              {filteredLocations.map(location => {
                // Use SortableCompactLocationCard when viewing specific day, CompactLocationCard otherwise
                const isSpecificDay = typeof selectedDay === 'number'
                const CardComponent = isSpecificDay ? SortableCompactLocationCard : CompactLocationCard
                
                return (
                  <CardComponent
                    key={location.id}
                    location={location}
                    days={days}
                    onAction={(action, data) => handleAction(location, action, data)}
                    onDelete={() => handleRemoveFromTrip(location)}
                    onLocationClick={onLocationClick}
                    showDragHandle={isSpecificDay}
                  />
                )
              })}
            </div>
          </DndContext>
        )}
      </div>
      
      {/* Settings Modal */}
      <TripSettingsModal
        isOpen={settingsOpen}
        trip={currentTrip}
        onClose={() => setSettingsOpen(false)}
        onSuccess={handleSettingsSuccess}
        onTripDeleted={onTripDeleted}
      />
      
      {/* Toast Component */}
      {ToastComponent}
      
      {/* Retry Button for Reorder Errors */}
      {reorderError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Failed to save order</span>
            <button
              onClick={handleRetryReorder}
              className="bg-white text-red-500 px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => setReorderError(null)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {editModalOpen && selectedLocationForEdit && (
        <LocationEditModal
          isOpen={editModalOpen}
          location={selectedLocationForEdit}
          tripLocationId={selectedLocationForEdit.tripLocationId}
          onSave={async (updates, tripNotes) => {
            try {
              // Update global location (name, tips)
              if (Object.keys(updates).length > 0) {
                await api.updateLocation(selectedLocationForEdit.id, updates)
              }
              
              // Update trip-specific notes if tripLocationId exists
              if (selectedLocationForEdit.tripLocationId && tripNotes !== undefined) {
                await api.updateTripLocation(selectedLocationForEdit.tripLocationId, {
                  notes: tripNotes
                })
              }
              
              // Invalidate cache and reload
              await Cache.invalidateLocations()
              await Cache.invalidateTrips()
              await loadTripLocations()
              
              setEditModalOpen(false)
              setSelectedLocationForEdit(null)
              showToast('Location updated successfully', 'success')
            } catch (error) {
              console.error('Failed to update location:', error)
              showToast('Failed to update location', 'error')
            }
          }}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedLocationForEdit(null)
          }}
        />
      )}
    </div>
  )
}

