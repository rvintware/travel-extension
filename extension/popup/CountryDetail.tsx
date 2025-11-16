import React, { useState, useEffect } from 'react'
import type { Country, Location } from '../lib/types'
import { LocationCard } from '../components/LocationCard'
import type { GearAction } from '../components/GearMenu'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../lib/api'
import { getUserId } from '../lib/storage'
import { Cache } from '../lib/cache'

interface CountryDetailProps {
  country: Country
  onBack: () => void
  onAddToTrip: (location: Location) => void
  onDelete: (location: Location) => void
}

export function CountryDetail({ country, onBack, onAddToTrip, onDelete }: CountryDetailProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    location: Location | null
  }>({ isOpen: false, location: null })
  
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
  
  const handleAction = async (location: Location, action: GearAction) => {
    switch (action) {
      case 'add-to-trip':
        onAddToTrip(location)
        break
      
      case 'edit':
        // TODO: Open edit modal
        console.log('Edit location:', location.id)
        break
      
      case 'delete':
        // Show confirm dialog
        setConfirmDialog({ isOpen: true, location })
        break
    }
  }
  
  async function handleConfirmDelete() {
    if (!confirmDialog.location) return
    
    const locationToDelete = confirmDialog.location
    
    try {
      // STEP 1: Perform API call
      await api.deleteLocation(locationToDelete.id)
      
      // STEP 2: OPTIMISTIC UPDATE - Remove location immediately (0ms blocking)
      setLocations(prev => prev.filter(l => l.id !== locationToDelete.id))
      
      // STEP 3: Invalidate caches (counts changed)
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // STEP 4: Notify parent via callback (instant, ~0ms)
      onDelete(locationToDelete)
      
      // STEP 5: Background refresh to verify (non-blocking)
      loadLocations().catch(error => {
        // On error, revert optimistic update by refreshing from server
        console.error('Refresh failed:', error)
        loadLocations() // Get real state from server
      })
      
      setConfirmDialog({ isOpen: false, location: null })
    } catch (error) {
      console.error('Failed to delete:', error)
      // On API error, refresh to get real state
      loadLocations()
      setConfirmDialog({ isOpen: false, location: null })
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
            className="text-gray-600 hover:text-primary transition-colors"
            disabled={refreshing}
            title="Refresh"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
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
                onAction={(action, data) => handleAction(location, action)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Location?"
        message={confirmDialog.location 
          ? `Delete "${confirmDialog.location.name}" permanently? This removes it from all trips and your library.`
          : ''
        }
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, location: null })}
      />
    </div>
  )
}

