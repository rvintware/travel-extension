import React, { useState, useEffect } from 'react'
import type { Country, Location, Trip } from '../lib/types'
import { LocationCard } from '../components/LocationCard'
import type { GearAction } from '../components/GearMenu'
import { AddToTripModal } from '../components/AddToTripModal'
import { useToast } from '../components/Toast'
import * as api from '../lib/api'
import { getUserId } from '../lib/storage'
import { Cache } from '../lib/cache'

interface CountryDetailProps {
  country: Country
  trips: Trip[]  // Pass trips array for Add to Trip modal
  onBack: () => void
  onAddToTrip: (location: Location) => void
  onDelete: (location: Location) => void
}

export function CountryDetail({ country, trips, onBack, onAddToTrip, onDelete }: CountryDetailProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addToTripModalOpen, setAddToTripModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [pendingToast, setPendingToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)
  const { showToast, ToastComponent } = useToast()
  
  useEffect(() => {
    loadLocations()
  }, [country.id])
  
  // Poll for processing locations
  useEffect(() => {
    const hasPending = locations.some(l => 
      l.processing_status === 'pending' || l.processing_status === 'processing'
    )
    
    if (hasPending) {
      console.log('[CountryDetail] Polling for processing locations...')
      const interval = setInterval(() => {
        loadLocations() // Refresh to get updated statuses
      }, 3000) // Poll every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [locations])
  
  async function loadLocations() {
    try {
      // Load from cache first
      const cached = await Cache.getLocations()
      const hasProcessing = Cache.hasProcessingLocations(cached.data)
      
      // If cache is fresh AND no processing, use cached data (filtered by country)
      if (cached.fresh && !hasProcessing && cached.data) {
        const filtered = cached.data.filter(l => l.country_id === country.id)
        setLocations(filtered)
        setLoading(false)
        return
      }
      
      // Otherwise, fetch fresh data
      const userId = await getUserId()
      const data = await api.getLocations(userId, country.id)
      setLocations(data)
    } catch (error) {
      console.error('Failed to load locations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleRefresh() {
    setRefreshing(true)
    try {
      const userId = await getUserId()
      const locations = await api.getLocations(userId)
      // Filter to current country
      const filtered = locations.filter(l => l.country_id === country.id)
      setLocations(filtered)
    } finally {
      setRefreshing(false)
    }
  }
  
  function handleAddToTripClick(location: Location) {
    setSelectedLocation(location)
    setAddToTripModalOpen(true)
  }
  
  async function handleAddToTripSuccess(tripName: string, location: Location) {
    // Store pending toast instead of showing immediately
    // Toast will be shown after modal closes (via useEffect)
    // Location is passed from modal (captured before onClose clears state)
    setSelectedLocation(null)
    setPendingToast({ message: `Added to ${tripName}`, type: 'success' })
    // NOTE: Do NOT call onAddToTrip(location) here - it opens a second modal in popup.tsx
    // The API call and cache invalidation are already handled in AddToTripModal.handleTripClick
  }
  
  async function handleAlreadyInTrip(tripName: string) {
    // Store pending toast instead of showing immediately
    // Toast will be shown after modal closes (via useEffect)
    setSelectedLocation(null)
    setPendingToast({ message: `Already in ${tripName}`, type: 'info' })
  }
  
  // Watch for modal closing and show pending toast
  useEffect(() => {
    // When modal closes and there's a pending toast, show it
    if (!addToTripModalOpen && pendingToast) {
      // Use requestAnimationFrame to ensure modal has fully unmounted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          showToast(pendingToast.message, pendingToast.type)
          setPendingToast(null)
        })
      })
    }
  }, [addToTripModalOpen, pendingToast, showToast])
  
  async function handleDelete(location: Location) {
    try {
      // STEP 1: Perform API call
      await api.deleteLocation(location.id)
      
      // STEP 2: OPTIMISTIC UPDATE - Remove location immediately (0ms blocking)
      setLocations(prev => prev.filter(l => l.id !== location.id))
      
      // STEP 3: Invalidate caches (counts changed)
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // STEP 4: Notify parent via callback (instant, ~0ms)
      onDelete(location)
      
      // STEP 5: Background refresh to verify (non-blocking)
      loadLocations().catch(error => {
        // On error, revert optimistic update by refreshing from server
        console.error('Refresh failed:', error)
        loadLocations() // Get real state from server
      })
    } catch (error) {
      console.error('Failed to delete:', error)
      // On API error, refresh to get real state
      loadLocations()
    }
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
          
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            disabled={refreshing}
            title="Refresh data"
            aria-label="Refresh"
          >
            <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{country.emoji || '🌐'}</span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{country.name}</h1>
            <p className="text-sm text-gray-600">
              {locations.length} {locations.length === 1 ? 'location' : 'locations'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="text-4xl mb-3">{country.emoji || '🌐'}</div>
            <p className="text-sm text-gray-600">
              No locations in {country.name} yet
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {locations.map(location => (
              <LocationCard
                key={location.id}
                location={location}
                context="library"
                onAction={() => {}} // Not used in library context anymore
                onAddToTrip={() => handleAddToTripClick(location)}
                onDelete={() => handleDelete(location)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Add to Trip Modal */}
      {addToTripModalOpen && selectedLocation && (
        <AddToTripModal
          location={selectedLocation}
          trips={trips}
          onClose={() => {
            setAddToTripModalOpen(false)
            setSelectedLocation(null)
          }}
          onSuccess={handleAddToTripSuccess}
          onAlreadyInTrip={handleAlreadyInTrip}
        />
      )}
      
      {/* Toast */}
      {ToastComponent}
    </div>
  )
}

