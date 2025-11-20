import React, { useState, useEffect } from 'react'
import type { Country, Trip } from '../lib/types'
import { Button } from '../components/Button'
import { DatePickerField } from '../components/DatePickerField'
import { getUserId, setDefaultTrip } from '../lib/storage'
import * as api from '../lib/api'
import { 
  calculateDuration, 
  calculateEndDate, 
  calculateStartDate, 
  formatDateForAPI 
} from '../lib/dateUtils'

interface CreateTripViewProps {
  countries: Country[]
  onBack: () => void
  onSuccess: (trip: Trip) => void
}

export function CreateTripView({ countries, onBack, onSuccess }: CreateTripViewProps) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('5') // Default 5 days
  const [setAsActive, setSetAsActive] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Date state
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isDurationLocked, setIsDurationLocked] = useState(false)
  
  const canCreate = name.trim().length > 0
  
  // Auto-calculate duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const calculated = calculateDuration(startDate, endDate)
      setDuration(calculated.toString())
      setIsDurationLocked(true)
    } else {
      setIsDurationLocked(false)
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
  
  // Auto-calculate start date when end + duration change
  useEffect(() => {
    if (endDate && duration && !startDate && !isDurationLocked) {
      const durationNum = parseInt(duration)
      if (!isNaN(durationNum) && durationNum > 0) {
        const calculated = calculateStartDate(endDate, durationNum)
        setStartDate(calculated)
    }
  }
  }, [endDate, duration, startDate, isDurationLocked])
  
  function handleDurationChange(value: string) {
    setDuration(value)
    // Unlock if user manually edits
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
  
  async function handleCreate() {
    if (!canCreate) return
    
    setCreating(true)
    try {
      const userId = await getUserId()
      
      // STEP 1: Perform API call (get backend response)
      const trip = await api.createTrip({
        userId,
        name: name.trim(),
        countryIds: [], // Countries determined automatically from locations
        startDate: startDate ? formatDateForAPI(startDate) : undefined,
        endDate: endDate ? formatDateForAPI(endDate) : undefined,
        durationDays: duration ? parseInt(duration) : undefined,
        isActive: setAsActive
      })
      
      // Sync active trip status with settings.defaultTripId
      if (setAsActive) {
        await setDefaultTrip(trip.id)
      }
      
      // Notify background worker to refresh context menu
      chrome.runtime.sendMessage({ type: 'TRIP_UPDATED' }).catch(() => {
        // Background worker not ready, that's fine
      })
      
      // STEP 2: Notify parent via callback (optimistic update handled in parent)
      // Parent will optimistically add trip to trips list
      onSuccess(trip)
      
      // Background refresh handled by parent callback
    } catch (error) {
      console.error('Create trip failed:', error)
      alert('Failed to create trip. Please try again.')
    } finally {
      setCreating(false)
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
          
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Create Trip</h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Trip Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Trip Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canCreate && handleCreate()}
            placeholder="e.g., 🌏 Southeast Asia 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Emoji allowed! (e.g., 🗾 🌏 ✈️)
          </p>
        </div>
        
        {/* Date Section */}
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
        
          {/* Duration Field */}
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
                  placeholder="5"
              min="1"
                  className={`w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    isDurationLocked ? 'bg-gray-100' : ''
                  }`}
                />
                {isDurationLocked && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    🔒
                  </span>
                )}
              </div>
            <span className="text-sm text-gray-600">days</span>
            </div>
            {isDurationLocked && (
              <p className="text-xs text-gray-500 mt-1">
                Click to unlock and adjust
              </p>
            )}
          </div>
        </div>
        
        {/* Set as Active */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={setAsActive}
              onChange={(e) => setSetAsActive(e.target.checked)}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Set as active trip</span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Quick-saves will go to this trip
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0 flex gap-3">
        <Button
          onClick={onBack}
          variant="secondary"
          className="flex-1"
          disabled={creating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="primary"
          className="flex-1"
          disabled={!canCreate || creating}
        >
          {creating ? 'Creating...' : 'Create Trip'}
        </Button>
      </div>
    </div>
  )
}

