import React, { useState, useEffect, useRef } from 'react'
import type { Trip } from '../../lib/types'
import * as api from '../../lib/api'
import { createMap, fitBounds } from '../../lib/map/googleMaps'
import { createNumberedMarker, createInfoWindow, clearMarkers } from '../../lib/map/markerUtils'

interface TripMapViewProps {
  trip: Trip
  onBack?: () => void  // Optional - only used in popup context
}

export function TripMapView({ trip, onBack }: TripMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapData, setMapData] = useState<any>(null)

  // Load map data
  useEffect(() => {
    loadMapData()
  }, [trip.id])

  // Initialize map when data is loaded
  useEffect(() => {
    if (mapData && mapRef.current && !mapInstanceRef.current) {
      initializeMap()
    }
  }, [mapData])

  async function loadMapData() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getMapData(trip.id)
      setMapData(data)
      console.log('[TripMapView] Map data loaded:', data)
    } catch (err) {
      console.error('[TripMapView] Failed to load map data:', err)
      setError('Failed to load map. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function initializeMap() {
    if (!mapRef.current) {
      console.error('[TripMapView] Map ref is null')
      return
    }

    console.log('[TripMapView] Starting map initialization...')
    
    try {
      console.log('[TripMapView] Creating map instance...')
      const map = await createMap(mapRef.current, {
        zoom: 12,
        center: { lat: 0, lng: 0 },
      })

      if (!map) {
        console.error('[TripMapView] createMap returned null')
        setError('Failed to initialize Google Maps. The map script may not have loaded properly.')
        return
      }

      console.log('[TripMapView] Map created successfully')
      mapInstanceRef.current = map

      // Add markers for locations with coordinates
      const locationsWithCoords = mapData.locations.filter(
        (loc: any) => loc.lat != null && loc.lng != null
      )
      
      console.log('[TripMapView] Locations with coords:', locationsWithCoords.length)

      if (locationsWithCoords.length > 0) {
        console.log('[TripMapView] Adding markers...')
        addMarkers(map, locationsWithCoords)

        // Fit bounds to show all markers
        if (mapData.bounds) {
          console.log('[TripMapView] Fitting bounds')
          fitBounds(map, mapData.bounds)
        }
      } else {
        // Center on a default location if no coordinates
        map.setCenter({ lat: 0, lng: 0 })
        map.setZoom(2)
      }
      
      console.log('[TripMapView] Map initialization complete')
    } catch (err) {
      console.error('[TripMapView] Map initialization error:', err)
      setError('Failed to initialize map: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  function addMarkers(map: google.maps.Map, locations: any[]) {
    // Clear existing markers
    clearMarkers(markersRef.current)
    markersRef.current = []

    // Create markers for each location
    locations.forEach((location) => {
      const marker = createNumberedMarker(
        map,
        { lat: location.lat, lng: location.lng },
        location.displayOrder,
        location.name,
        () => handleMarkerClick(location, marker)
      )

      markersRef.current.push(marker)
    })
  }

  function handleMarkerClick(location: any, marker: google.maps.Marker) {
    // Close existing info window
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }

    // Create and open new info window
    const infoWindow = createInfoWindow({
      name: location.name,
      address: location.address,
      dayNumber: location.dayNumber,
      suggestedTime: location.suggestedTime,
    })

    infoWindowRef.current = infoWindow
    infoWindow.open(mapInstanceRef.current, marker)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers(markersRef.current)
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <span>←</span>
              <span className="font-medium">Back</span>
            </button>
          ) : (
            <button
              onClick={() => window.close()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>✕</span>
              <span className="font-medium">Close Tab</span>
            </button>
          )}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>🗺️</span>
            <span>{trip.name}</span>
          </h1>
          <p className="text-sm text-gray-600">
            {mapData ? (
              <>
                {mapData.stats.totalLocations} location{mapData.stats.totalLocations !== 1 ? 's' : ''}
                {mapData.stats.withCoordinates < mapData.stats.totalLocations && (
                  <span className="text-gray-500">
                    {' '}({mapData.stats.withCoordinates} on map)
                  </span>
                )}
              </>
            ) : (
              'Loading...'
            )}
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-sm text-gray-600">Loading map...</div>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center px-6">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm text-gray-700 mb-4">{error}</p>
              <button
                onClick={loadMapData}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : mapData && mapData.stats.totalLocations === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center px-6">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-sm text-gray-600 mb-1">
                Add locations to see them on the map
              </p>
              <p className="text-xs text-gray-500">
                Right-click any location text on a webpage to save it to this trip
              </p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>
    </div>
  )
}

