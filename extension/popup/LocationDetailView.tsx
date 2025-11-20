import React, { useState } from 'react'
import type { LocationWithTripData } from '../lib/types'
import { LocationCard } from '../components/LocationCard'
import { LocationEditModal } from '../components/LocationEditModal'
import * as api from '../lib/api'
import { Cache } from '../lib/cache'
import { useToast } from '../components/Toast'

interface LocationDetailViewProps {
  location: LocationWithTripData
  tripLocationId?: string
  onBack: () => void
  onLocationUpdated?: () => void
}

export function LocationDetailView({ location: initialLocation, tripLocationId, onBack, onLocationUpdated }: LocationDetailViewProps) {
  const [location, setLocation] = useState<LocationWithTripData>(initialLocation)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const { showToast, ToastComponent } = useToast()

  async function handleEdit(locationId: string, updates: { name?: string; tips?: any[] }, tripNotes?: string) {
    try {
      // Update global location data (name, tips)
      if (updates.name || updates.tips) {
        await api.updateLocation(locationId, {
          name: updates.name,
          tips: updates.tips,
        })
      }

      // Update trip-specific notes if provided
      if (tripNotes !== undefined && tripLocationId) {
        await api.updateTripLocation(tripLocationId, { notes: tripNotes })
      }

      // Invalidate caches
      await Cache.invalidateLocations()
      await Cache.invalidateTrips()

      // Refresh location data
      const updatedLocation = await api.getLocation(locationId)
      // Preserve trip-specific data when updating
      setLocation({
        ...updatedLocation,
        tripLocationId: location.tripLocationId,
        dayNumber: location.dayNumber,
        tripNotes: tripNotes !== undefined ? tripNotes : location.tripNotes,
      } as LocationWithTripData)

      // Notify parent
      onLocationUpdated?.()

      showToast('Location updated successfully', 'success')
    } catch (error) {
      console.error('Failed to update location:', error)
      showToast('Failed to update location', 'error')
      throw error
    }
  }

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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <LocationCard
            location={location}
            context="trip"
            days={[]}
            onAction={(action, data) => {
              if (action === 'edit-location') {
                setEditModalOpen(true)
              }
            }}
            onDelete={() => {}}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <LocationEditModal
          isOpen={editModalOpen}
          location={location}
          tripLocationId={tripLocationId}
          onSave={async (updates, tripNotes) => {
            await handleEdit(location.id, updates, tripNotes)
            setEditModalOpen(false)
          }}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {/* Toast */}
      {ToastComponent}
    </div>
  )
}

