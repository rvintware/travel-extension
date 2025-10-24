import React, { useState, useEffect } from 'react'
import type { Country, Trip, Settings as SettingsType } from '../lib/types'
import { getSettings, saveSettings, getUserId } from '../lib/storage'
import { Cache } from '../lib/cache'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import * as api from '../lib/api'

interface SettingsProps {
  countries: Country[]
  trips: Trip[]
  onBack: () => void
  onSave: () => void
}

export function Settings({ countries, trips, onBack, onSave }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [popupBehavior, setPopupBehavior] = useState<'trips' | 'locations' | 'remember'>('trips')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [locationCount, setLocationCount] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  
  useEffect(() => {
    loadSettings()
    loadCounts()
  }, [])
  
  async function loadSettings() {
    const data = await getSettings()
    if (data) {
      setSettings(data)
      // Determine which radio button should be selected
      if (data.rememberLastTab) {
        setPopupBehavior('remember')
      } else {
        setPopupBehavior(data.defaultView)
      }
    } else {
      // Initialize with defaults
      const defaultSettings: SettingsType = {
        defaultView: 'trips',
        rememberLastTab: false,
      }
      setSettings(defaultSettings)
      setPopupBehavior('trips')
    }
    setLoading(false)
  }
  
  async function loadCounts() {
    try {
      const userId = await getUserId()
      const locations = await api.getLocations(userId)
      setLocationCount(locations.length)
      setTripCount(trips.length)
    } catch (error) {
      console.error('Failed to load counts:', error)
    }
  }
  
  async function handleRefresh() {
    setRefreshing(true)
    try {
      await loadSettings()
      await loadCounts()
    } finally {
      setRefreshing(false)
    }
  }
  
  async function handleSave() {
    if (!settings) return
    
    // Build final settings based on popup behavior
    const finalSettings: SettingsType = {
      ...settings,
      defaultView: popupBehavior === 'remember' ? settings.defaultView : popupBehavior as 'trips' | 'locations',
      rememberLastTab: popupBehavior === 'remember',
    }
    
    await saveSettings(finalSettings)
    
    // Notify background script to update context menu
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' })
    
    onSave()
  }
  
  async function handleDeleteAll() {
    setIsDeleting(true)
    try {
      const userId = await getUserId()
      await api.deleteAllUserData(userId)
      
      // Clear local cache
      await Cache.clearAll()
      
      // Close modal
      setShowDeleteConfirm(false)
      
      // Reload popup
      onSave()
    } catch (error) {
      console.error('Delete all failed:', error)
      alert('Failed to delete data. Please try again.')
      setIsDeleting(false)
    }
  }
  
  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
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
        <h1 className="text-lg font-semibold text-gray-900">⚙️ Settings</h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Default Trip */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Default Trip
          </label>
          <select
            value={settings.defaultTripId || ''}
            onChange={(e) => setSettings({ ...settings, defaultTripId: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">None (save to library only)</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.country?.emoji} {trip.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Quick-save destinations here
          </p>
        </div>
        
        {/* Popup Behavior */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Popup Behavior
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="popupBehavior"
                checked={popupBehavior === 'trips'}
                onChange={() => setPopupBehavior('trips')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Always open to My Trips</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="popupBehavior"
                checked={popupBehavior === 'locations'}
                onChange={() => setPopupBehavior('locations')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Always open to My Locations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="popupBehavior"
                checked={popupBehavior === 'remember'}
                onChange={() => setPopupBehavior('remember')}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Remember last opened tab</span>
            </label>
          </div>
        </div>
        
        {/* Danger Zone */}
        <div className="border-t-2 border-red-200 mt-6 pt-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-base font-semibold text-red-900 mb-2 flex items-center gap-2">
              ⚠️ Danger Zone
            </h3>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-red-900 mb-1">
                Delete All Data
              </div>
              <div className="text-xs text-red-700 space-y-1">
                <div>This will permanently delete:</div>
                <div>• All locations ({locationCount})</div>
                <div>• All trips ({tripCount})</div>
                <div className="font-semibold mt-2">Cannot be undone!</div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              className="w-full"
            >
              🗑️ Delete Everything
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <Button
          onClick={handleSave}
          variant="primary"
          className="w-full"
        >
          Save Settings
        </Button>
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="⚠️ Delete Everything?"
        message={`This will permanently delete ${locationCount} locations and ${tripCount} trips. This CANNOT be undone. Are you sure?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete All'}
        confirmVariant="danger"
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

