import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Trip } from '../lib/types'
import { DatePickerField } from './DatePickerField'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'
import * as api from '../lib/api'
import {
  calculateDuration,
  calculateEndDate,
  formatDateForAPI
} from '../lib/dateUtils'
import { setDefaultTrip, getSettings } from '../lib/storage'
import { Cache } from '../lib/cache'

interface TripSettingsModalProps {
  isOpen: boolean
  trip: Trip
  onClose: () => void
  onSuccess: (trip: Trip) => void
  onTripDeleted?: (tripId: string) => void
}

export function TripSettingsModal({
  isOpen,
  trip,
  onClose,
  onSuccess,
  onTripDeleted
}: TripSettingsModalProps) {
  const [name, setName] = useState(trip.name)
  const [description, setDescription] = useState(trip.description || '')
  const [startDate, setStartDate] = useState<Date | null>(
    trip.start_date ? new Date(trip.start_date) : null
  )
  const [endDate, setEndDate] = useState<Date | null>(
    trip.end_date ? new Date(trip.end_date) : null
  )
  const [duration, setDuration] = useState<string>(
    trip.duration_days?.toString() || ''
  )
  const [isDurationLocked, setIsDurationLocked] = useState(
    !!(trip.start_date && trip.end_date)
  )
  const [isActive, setIsActive] = useState(trip.is_active)
  const [saving, setSaving] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [affectedCount, setAffectedCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast, ToastComponent } = useToast()
  
  // Reset form state when modal opens or trip changes
  // Use specific properties instead of trip object to ensure effect runs when values change
  useEffect(() => {
    if (isOpen) {
      setName(trip.name)
      setDescription(trip.description || '')
      setStartDate(trip.start_date ? new Date(trip.start_date) : null)
      setEndDate(trip.end_date ? new Date(trip.end_date) : null)
      setDuration(trip.duration_days?.toString() || '')
      setIsDurationLocked(!!(trip.start_date && trip.end_date))
      setIsActive(trip.is_active)
      setShowWarning(false)
      setAffectedCount(0)
      setShowDeleteConfirm(false)
      setDeleting(false)
    }
  }, [isOpen, trip.id, trip.start_date, trip.end_date, trip.duration_days, trip.name, trip.description, trip.is_active])
  
  // Same date calculation logic as CreateTripView
  useEffect(() => {
    if (startDate && endDate) {
      const calculated = calculateDuration(startDate, endDate)
      setDuration(calculated.toString())
      setIsDurationLocked(true)
    }
  }, [startDate, endDate])
  
  // Auto-calculate end date when start + duration change (only when duration is unlocked)
  useEffect(() => {
    if (startDate && duration && !isDurationLocked) {
      const durationNum = parseInt(duration)
      if (!isNaN(durationNum) && durationNum > 0) {
        const calculated = calculateEndDate(startDate, durationNum)
        setEndDate(calculated)
      }
    }
  }, [startDate, duration, isDurationLocked])
  
  function handleDurationChange(value: string) {
    setDuration(value)
    if (isDurationLocked) {
      setIsDurationLocked(false)
      // Recalculate end date if start date exists
      if (startDate && value) {
        const durationNum = parseInt(value)
        if (!isNaN(durationNum) && durationNum > 0) {
          setEndDate(calculateEndDate(startDate, durationNum))
        }
      }
    }
  }
  
  async function handleSave() {
    const newDuration = duration ? parseInt(duration) : null
    
    // Check if reducing duration
    if (newDuration && trip.duration_days && newDuration < trip.duration_days) {
      // Call API to check affected locations
      try {
        const response = await fetch(
          `${api.API_URL}/api/trips/${trip.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationDays: newDuration })
          }
        )
        
        if (response.status === 409) {
          const data = await response.json()
          setAffectedCount(data.affectedCount)
          setShowWarning(true)
          return
        }
      } catch (error) {
        console.error('Failed to check affected locations:', error)
      }
    }
    
    await saveTrip()
  }
  
  async function handleConfirmReduce() {
    const newDuration = duration ? parseInt(duration) : null
    
    // Unschedule affected locations
    await api.unscheduleDays(trip.id, newDuration!)
    
    // Save trip
    await saveTrip()
    setShowWarning(false)
  }
  
  async function saveTrip() {
    setSaving(true)
    try {
      const updated = await api.updateTrip(trip.id, {
        name,
        description,
        startDate: startDate ? formatDateForAPI(startDate) : undefined,
        endDate: endDate ? formatDateForAPI(endDate) : undefined,
        durationDays: duration ? parseInt(duration) : undefined,
        isActive
      })
      
      // Sync active trip status with settings.defaultTripId
      if (isActive) {
        await setDefaultTrip(trip.id)
      } else {
        // If this trip was active and is being deactivated, clear defaultTripId
        // (user can set a new default in Settings)
        const currentSettings = await getSettings()
        if (currentSettings?.defaultTripId === trip.id) {
          await setDefaultTrip(null)
        }
      }
      
      // Notify background worker to refresh context menu
      chrome.runtime.sendMessage({ type: 'TRIP_UPDATED' }).catch(() => {
        // Background worker not ready, that's fine
      })
      
      onSuccess(updated)
      onClose()
    } catch (error) {
      console.error('Failed to update trip:', error)
      showToast('Failed to update trip', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleDeleteTrip() {
    setDeleting(true)
    try {
      // STEP 1: Perform API call
      await api.deleteTrip(trip.id)
      
      // STEP 2: Invalidate cache
      await Cache.invalidateTrips()
      await Cache.invalidateLocations()
      
      // STEP 3: Close confirmation dialog
      setShowDeleteConfirm(false)
      
      // STEP 4: Close modal
      onClose()
      
      // STEP 5: Notify parent via callback
      onTripDeleted?.(trip.id)
      
      // STEP 6: Show success toast
      showToast('Trip deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete trip:', error)
      showToast('Failed to delete trip', 'error')
      setDeleting(false)
    }
  }
  
  if (!isOpen) return null
  
  // Warning dialog for reducing days
  if (showWarning) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            ⚠️ Warning
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Reducing to {duration} days will unschedule {affectedCount} locations 
            on days {parseInt(duration) + 1}+. Continue?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowWarning(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReduce}
              variant="primary"
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )
  }
  
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Trip Details
        </h2>
        
        <div className="space-y-4">
          {/* Trip Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Trip Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Dates Section */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                label="Start Date"
                selected={startDate}
                onChange={setStartDate}
                maxDate={endDate || undefined}
              />
              <DatePickerField
                label="End Date"
                selected={endDate}
                onChange={setEndDate}
                minDate={startDate || undefined}
              />
            </div>
            
            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Duration
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    min="1"
                    className={`w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      isDurationLocked ? 'bg-gray-100' : ''
                    }`}
                  />
                  {isDurationLocked && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      🔒
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600">days</span>
              </div>
            </div>
          </div>
          
          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Set as active trip</span>
            </label>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1"
            disabled={!name.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
        
        {/* Danger Zone */}
        <div className="border-t-2 border-red-200 mt-6 pt-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-base font-semibold text-red-900 mb-2 flex items-center gap-2">
              ⚠️ Danger Zone
            </h3>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-red-900 mb-1">
                Delete Trip
              </div>
              <div className="text-xs text-red-700 space-y-1">
                <div>This will permanently delete this trip and all its scheduled locations.</div>
                <div>Locations will remain in your library.</div>
                <div className="font-semibold mt-2">Cannot be undone!</div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              className="w-full"
              disabled={deleting}
            >
              🗑️ Delete Trip
            </Button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="⚠️ Delete Trip?"
        message="This will permanently delete this trip and all scheduled locations. Locations will remain in your library. Cannot be undone!"
        confirmText={deleting ? 'Deleting...' : 'Delete Trip'}
        confirmVariant="danger"
        onConfirm={handleDeleteTrip}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      {ToastComponent}
    </div>,
    document.body
  )
}

