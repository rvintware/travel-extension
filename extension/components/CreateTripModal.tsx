import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Country, Trip } from '../lib/types'
import { Button } from './Button'
import { getUserId } from '../lib/storage'
import * as api from '../lib/api'

interface CreateTripModalProps {
  isOpen: boolean
  countries: Country[]
  onClose: () => void
  onSuccess: (trip: Trip) => void
}

export function CreateTripModal({ isOpen, countries, onClose, onSuccess }: CreateTripModalProps) {
  console.log('[CreateTripModal] Rendered, isOpen:', isOpen, 'countries:', countries.length)
  
  const [name, setName] = useState('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [duration, setDuration] = useState('')
  const [setAsActive, setSetAsActive] = useState(true)
  const [creating, setCreating] = useState(false)
  const [availableCountries, setAvailableCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  
  // Countries are now optional - user can create empty trip for planning
  const canCreate = name.trim().length > 0
  
  useEffect(() => {
    if (isOpen) {
      loadAvailableCountries()
    }
  }, [isOpen])
  
  async function loadAvailableCountries() {
    console.log('[CreateTripModal] Loading available countries...')
    setLoading(true)
    try {
      const userId = await getUserId()
      const locations = await api.getLocations(userId)
      
      // Get unique country IDs from user's locations
      const usedCountryIds = [...new Set(
        locations.map(loc => loc.country_id).filter(Boolean)
      )]
      
      // Filter to only countries that have locations
      const available = countries.filter(c => usedCountryIds.includes(c.id))
      
      console.log('[CreateTripModal] Available countries:', available.length, 'from', locations.length, 'locations')
      setAvailableCountries(available)
    } catch (error) {
      console.error('[CreateTripModal] Failed to load countries:', error)
      setAvailableCountries([])
    } finally {
      setLoading(false)
    }
  }
  
  function toggleCountry(countryId: string) {
    if (selectedCountries.includes(countryId)) {
      setSelectedCountries(prev => prev.filter(id => id !== countryId))
    } else {
      setSelectedCountries(prev => [...prev, countryId])
    }
  }
  
  async function handleCreate() {
    if (!canCreate) return
    
    setCreating(true)
    try {
      const userId = await getUserId()
      
      const trip = await api.createTrip({
        userId,
        name: name.trim(),
        countryIds: selectedCountries,
        durationDays: duration ? parseInt(duration) : undefined,
        isActive: setAsActive
      })
      
      setName('')
      setSelectedCountries([])
      setDuration('')
      setSetAsActive(true)
      
      onSuccess(trip)
      onClose()
    } catch (error) {
      console.error('Create trip failed:', error)
      alert('Failed to create trip. Please try again.')
    } finally {
      setCreating(false)
    }
  }
  
  if (!isOpen) {
    console.log('[CreateTripModal] Not open, returning null')
    return null
  }
  
  console.log('[CreateTripModal] Rendering portal...')
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Trip</h2>
        
        {/* Trip Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Trip Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canCreate && handleCreate()}
            placeholder="e.g., 🌏 Southeast Asia 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Emoji allowed! (e.g., 🗾 🌏 ✈️)
          </p>
        </div>
        
        {/* Countries Multi-Select */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Countries (optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {availableCountries.length > 0 
              ? 'Select countries to include' 
              : 'Save locations first, then select countries'}
          </p>
          
          {loading ? (
            <div className="text-center py-4 text-sm text-gray-500">
              Loading countries...
            </div>
          ) : availableCountries.length === 0 ? (
            <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-3xl mb-2">📍</div>
              <p className="text-sm text-gray-600 mb-1">
                No locations saved yet
              </p>
              <p className="text-xs text-gray-500">
                Save some locations first, then they'll appear here!
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto bg-white">
              {availableCountries.map(country => {
                const isSelected = selectedCountries.includes(country.id)
                return (
                  <label 
                    key={country.id}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary-light' : 'hover:bg-gray-100'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCountry(country.id)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-2xl">{country.emoji || '🌐'}</span>
                    <span className="text-sm text-gray-700">{country.name}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Duration (Optional) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Duration (optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="7"
              min="1"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-gray-600">days</span>
          </div>
        </div>
        
        {/* Set as Active */}
        <div className="mb-6">
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
        
        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
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
    </div>,
    document.body
  )
}

