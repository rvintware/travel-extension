import React, { useState, useEffect } from 'react'
import type { Country, Trip, Settings as SettingsType } from '../lib/types'
import { getSettings, saveSettings } from '../lib/storage'
import { Button } from './Button'

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
  
  useEffect(() => {
    loadSettings()
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
        defaultCountryId: countries.find(c => c.code === 'JP')?.id || countries[0]?.id || '',
        defaultView: 'trips',
        rememberLastTab: false,
      }
      setSettings(defaultSettings)
      setPopupBehavior('trips')
    }
    setLoading(false)
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mb-2"
        >
          <span>←</span>
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">⚙️ Settings</h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Default Country */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Default Country
          </label>
          <select
            value={settings.defaultCountryId}
            onChange={(e) => setSettings({ ...settings, defaultCountryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {countries.map(country => (
              <option key={country.id} value={country.id}>
                {country.emoji} {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Used when country can't be auto-detected
          </p>
        </div>
        
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
    </div>
  )
}

