import React, { useState, useEffect } from 'react'
import { TripMapView } from '../components/map/TripMapView'
import * as api from '../lib/api'
import type { Trip } from '../lib/types'

function MapTab() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadTripData()
  }, [])
  
  async function loadTripData() {
    try {
      const params = new URLSearchParams(window.location.search)
      const tripId = params.get('tripId')
      const apiKey = params.get('apiKey')
      
      console.log('[MapTab] Trip ID from URL:', tripId)
      console.log('[MapTab] API Key from URL:', apiKey ? 'present' : 'missing')
      
      if (!tripId) {
        throw new Error('No trip ID provided')
      }
      
      if (!apiKey) {
        throw new Error('Google Maps API key is missing. Please check extension configuration.')
      }
      
      // Store API key globally for googleMaps.ts to access
      // This is safe because popup window runs in extension context
      (window as any).__GOOGLE_MAPS_API_KEY__ = apiKey
      
      console.log('[MapTab] Fetching trip data...')
      const trip = await api.getTrip(tripId)
      console.log('[MapTab] Trip loaded:', trip)
      setTrip(trip)
    } catch (err: any) {
      console.error('[MapTab] Error:', err)
      setError(err.message || 'Failed to load trip data')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm text-gray-600">Loading map...</div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center px-6">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  if (!trip) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center px-6">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-sm text-gray-700 mb-4">Trip not found</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  return <TripMapView trip={trip} />
}

export default MapTab

