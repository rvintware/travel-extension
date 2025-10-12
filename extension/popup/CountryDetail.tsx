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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    location: Location | null
  }>({ isOpen: false, location: null })
  
  useEffect(() => {
    loadLocations()
  }, [country.id])
  
  async function loadLocations() {
    try {
      const userId = await getUserId()
      const data = await api.getLocations(userId, country.id)
      setLocations(data)
    } catch (error) {
      console.error('Failed to load locations:', error)
    } finally {
      setLoading(false)
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
    
    try {
      await api.deleteLocation(confirmDialog.location.id)
      setLocations(prev => prev.filter(l => l.id !== confirmDialog.location!.id))
      
      // Invalidate caches (counts changed)
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      onDelete(confirmDialog.location)
      setConfirmDialog({ isOpen: false, location: null })
    } catch (error) {
      console.error('Failed to delete:', error)
      // Could show an error toast here instead of alert
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

