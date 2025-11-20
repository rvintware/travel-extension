import { useEffect, useState } from "react"
import { Tabs } from "./components/Tabs"
import { TripsView } from "./popup/TripsView"
import { LocationsView } from "./popup/LocationsView"
import { CountryDetail } from "./popup/CountryDetail"
import { TripDetail } from "./popup/TripDetail"
import { LocationDetailView } from "./popup/LocationDetailView"
import { CreateTripView } from "./popup/CreateTripView"
import { Settings } from "./components/Settings"
import { AddToTripModal } from "./components/AddToTripModal"
import type { Country, Trip, Location, LocationWithTripData, ViewType } from "./lib/types"
import { getUserId, getSettings, setDefaultTrip } from "./lib/storage"
import { Cache, arraysEqual } from "./lib/cache"
import * as api from "./lib/api"
import "./style.css"

function IndexPopup() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'locations' | 'trips'>('trips')
  
  // View state
  const [view, setView] = useState<ViewType>('tripList')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationWithTripData | null>(null)
  const [returnToView, setReturnToView] = useState<ViewType>('tripList')
  const [returnToTripId, setReturnToTripId] = useState<string | undefined>(undefined)
  
  // Data state
  const [countries, setCountries] = useState<Country[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [showAddToTripModal, setShowAddToTripModal] = useState(false)
  const [locationToAdd, setLocationToAdd] = useState<Location | null>(null)
  
  // Load initial data with caching
  useEffect(() => {
    loadDataWithCache()
  }, [])
  
  // Listen for updates from background script
  useEffect(() => {
    const handleMessage = async (message: any) => {
      if (message.type === 'CAPTURES_UPDATED') {
        // Background script saved a location via context menu
        // Invalidate caches (new location added, counts changed)
        await Cache.invalidateTrips()
        await Cache.invalidateLocations()
        
        // Background refresh (non-blocking)
        loadDataWithCache().catch(error => {
          console.error('Refresh failed:', error)
        })
      }
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])
  
  // Poll for processing locations
  useEffect(() => {
    const hasPending = locations.some(l => 
      l.processing_status === 'pending' || l.processing_status === 'processing'
    )
    
    if (hasPending) {
      console.log('[Popup] Polling for processing locations...')
      const interval = setInterval(() => {
        // Invalidate cache to force fresh fetch
        Cache.invalidateLocations()
        loadDataWithCache().catch(error => {
          console.error('Polling refresh failed:', error)
        })
      }, 3000) // Poll every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [locations])
  
  async function loadDataWithCache() {
    try {
      const userId = await getUserId()
      const settings = await getSettings()
      
      // STEP 1: Load from cache first (instant!)
      const [cachedCountries, cachedTrips, cachedLocations] = await Promise.all([
        Cache.getCountries(),
        Cache.getTrips(),
        Cache.getLocations()
      ])
      
      if (cachedCountries.data) {
        setCountries(cachedCountries.data)
      }
      
      if (cachedTrips.data) {
        setTrips(cachedTrips.data)
        setLoading(false) // Show UI immediately!
      }
      
      if (cachedLocations.data) {
        setLocations(cachedLocations.data)
      }
      
      // STEP 2: Set initial tab from settings
      if (settings?.rememberLastTab) {
        const lastTab = await Cache.getLastTab()
        if (lastTab) setActiveTab(lastTab)
      } else if (settings?.defaultView) {
        setActiveTab(settings.defaultView)
      }
      
      // STEP 3: Check for processing locations (force fresh fetch if found)
      const hasProcessingLocations = Cache.hasProcessingLocations(cachedLocations.data)
      
      // STEP 4: If all caches are fresh AND no processing locations, we're done!
      if (cachedCountries.fresh && cachedTrips.fresh && cachedLocations.fresh && !hasProcessingLocations) {
        return // All data is fresh, no need to fetch!
      }
      
      // STEP 5: Fetch fresh data in background (only what's stale OR if processing)
      const [countriesData, tripsData, locationsData] = await Promise.all([
        cachedCountries.fresh ? Promise.resolve(cachedCountries.data!) : api.getCountries(),
        cachedTrips.fresh ? Promise.resolve(cachedTrips.data!) : api.getTrips(userId),
        (cachedLocations.fresh && !hasProcessingLocations) ? Promise.resolve(cachedLocations.data!) : api.getLocations(userId)
      ])
      
      // STEP 6: Update UI with fresh data (only if changed - prevent flicker)
      if (!arraysEqual(countries, countriesData)) {
        setCountries(countriesData)
      }
      if (!arraysEqual(trips, tripsData)) {
        setTrips(tripsData)
      }
      if (!arraysEqual(locations, locationsData)) {
        setLocations(locationsData)
      }
      setLoading(false)
      
      // STEP 7: Update cache (only what was fetched)
      if (!cachedCountries.fresh) {
        await Cache.setCountries(countriesData)
      }
      if (!cachedTrips.fresh) {
        await Cache.setTrips(tripsData)
      }
      if (!cachedLocations.fresh || hasProcessingLocations) {
        await Cache.setLocations(locationsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoading(false)
    }
  }
  
  async function handleRefresh() {
    // Clear all caches
    await Cache.clearAll()
    
    // Force reload
    setLoading(true)
    await loadDataWithCache()
  }
  
  // Handle tab change
  async function handleTabChange(tab: 'locations' | 'trips') {
    setActiveTab(tab)
    
    // Save last tab for "remember" setting
    await Cache.setLastTab(tab)
    
    // Reset to list view when switching tabs
    if (tab === 'trips') {
      setView('tripList')
    } else {
      setView('locationList')
    }
  }
  
  // Handle navigation
  function handleTripClick(trip: Trip) {
    setSelectedTrip(trip)
    setView('tripDetail')
  }
  
  function handleCountryClick(country: Country) {
    setSelectedCountry(country)
    setView('countryDetail')
  }
  
  function handleBackToList() {
    if (activeTab === 'trips') {
      setView('tripList')
      setSelectedTrip(null)
    } else {
      setView('locationList')
      setSelectedCountry(null)
    }
  }
  
  function handleSettingsClick() {
    setView('settings')
  }
  
  function handleBackFromSettings() {
    if (activeTab === 'trips') {
      setView('tripList')
    } else {
      setView('locationList')
    }
  }
  
  function handleLocationClick(location: LocationWithTripData, returnTo?: { view: ViewType; tripId?: string }) {
    setSelectedLocation(location)
    setReturnToView(returnTo?.view || 'tripDetail')
    if (returnTo?.tripId) {
      setReturnToTripId(returnTo.tripId)
    }
    setView('locationDetail')
  }
  
  function handleBackFromLocationDetail() {
    const returnView = returnToView || 'tripList'
    setView(returnView)
    if (returnToTripId) {
      const trip = trips.find(t => t.id === returnToTripId)
      if (trip) {
        setSelectedTrip(trip)
      }
    }
    setSelectedLocation(null)
    setReturnToView('tripList')
    setReturnToTripId(undefined)
  }
  
  function handleNewTrip() {
    setView('createTrip')
  }
  
  function handleAddToTrip(location: Location) {
    setLocationToAdd(location)
    setShowAddToTripModal(true)
  }
  
  // Callback handlers for optimistic updates
  
  function handleLocationMoved() {
    // OPTIMISTIC UPDATE - Update trips list immediately
    // Note: We don't know which trip's count changed, so we'll refresh in background
    // The optimistic update in TripDetail already updated the trip detail view
    setTrips(prev => prev.map(trip => {
      // If this is the selected trip, increment location count optimistically
      if (trip.id === selectedTrip?.id) {
        return { ...trip, locationCount: (trip.locationCount || 0) + 0 } // Count doesn't change on move
      }
      return trip
    }))
    
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
      // Keep optimistic update, will refresh on next action
    })
  }
  
  function handleLocationRemoved() {
    // OPTIMISTIC UPDATE - Decrement location count for selected trip
    setTrips(prev => prev.map(trip => {
      if (trip.id === selectedTrip?.id) {
        return { ...trip, locationCount: Math.max(0, (trip.locationCount || 0) - 1) }
      }
      return trip
    }))
    
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  function handleLocationLinked() {
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  function handleLocationUnscheduled() {
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  function handleLocationDeleted(location: Location) {
    // OPTIMISTIC UPDATE - Remove location from locations list immediately
    setLocations(prev => prev.filter(loc => loc.id !== location.id))
    
    // Update locationsByCountry count
    // Note: This is recalculated from locations array, so it will update automatically
    
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  function handleTripCreated(trip: Trip) {
    // OPTIMISTIC UPDATE - Add trip to trips list immediately
    setTrips(prev => [...prev, trip])
    
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  function handleTripUpdated(updatedTrip: Trip) {
    // Update trips array with fresh trip data
    setTrips(prev => prev.map(t => 
      t.id === updatedTrip.id ? updatedTrip : t
    ))
    
    // Update selectedTrip if it's the same trip
    if (selectedTrip?.id === updatedTrip.id) {
      setSelectedTrip(updatedTrip)
    }
    
    // Invalidate cache to ensure consistency
    Cache.invalidateTrips()
    
    // Optional: Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Background refresh failed:', error)
    })
  }
  
  function handleAddToTripSuccess(tripId: string, tripName: string, location: Location) {
    setShowAddToTripModal(false)
    setLocationToAdd(null)
    
    // OPTIMISTIC UPDATE - Increment location count for the affected trip immediately
    setTrips(prev => prev.map(trip => {
      if (trip.id === tripId) {
        return { ...trip, locationCount: (trip.locationCount || 0) + 1 }
      }
      return trip
    }))
    
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  function handleDeleteAllComplete() {
    // OPTIMISTIC UPDATE - Clear all data immediately (0ms blocking)
    setTrips([])
    setLocations([])
    setCountries([]) // Clear countries too
    
    // INVALIDATE CACHE - Force fresh fetch (already done in Settings, but ensure consistency)
    Cache.invalidateTrips()
    Cache.invalidateLocations()
    // Note: Cache.clearAll() already called in Settings, but this ensures consistency
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
    
    // Navigate back to list view
    handleBackFromSettings()
  }
  
  async function handleTripDeleted(tripId: string) {
    // OPTIMISTIC UPDATE - Remove trip from trips list immediately
    setTrips(prev => prev.filter(t => t.id !== tripId))
    
    // Clear selectedTrip if it was the deleted trip
    if (selectedTrip?.id === tripId) {
      setSelectedTrip(null)
      setView('tripList') // Navigate back to trip list
    }
    
    // Update settings if deleted trip was defaultTripId
    const settings = await getSettings()
    if (settings?.defaultTripId === tripId) {
      await setDefaultTrip(null) // Clear default trip
    }
    
    // INVALIDATE CACHE - Force fresh fetch
    Cache.invalidateTrips()
    Cache.invalidateLocations() // Counts changed
    
    // Notify background script
    chrome.runtime.sendMessage({ type: 'TRIP_UPDATED' }).catch(() => {
      // Background worker not ready, that's fine
    })
    
    // Background refresh to verify (non-blocking)
    loadDataWithCache().catch(error => {
      console.error('Refresh failed:', error)
    })
  }
  
  // Count locations by country
  const locationsByCountry: Record<string, number> = {}
  locations.forEach(loc => {
    locationsByCountry[loc.country_id] = (locationsByCountry[loc.country_id] || 0) + 1
  })
  
  // Render appropriate view
  function renderView() {
    if (view === 'settings') {
      return (
        <Settings
          countries={countries}
          trips={trips}
          onBack={handleBackFromSettings}
          onSave={handleBackFromSettings}
          onDeleteAll={handleDeleteAllComplete}
        />
      )
    }
    
    if (view === 'createTrip') {
      return (
        <CreateTripView
          countries={countries}
          onBack={() => setView('tripList')}
          onSuccess={(trip) => {
            setView('tripList')
            handleTripCreated(trip) // Optimistic update + background refresh
          }}
        />
      )
    }
    
    if (view === 'tripDetail' && selectedTrip) {
      return (
        <TripDetail
          trip={selectedTrip}
          onBack={handleBackToList}
          onLocationMoved={handleLocationMoved}
          onLocationRemoved={handleLocationRemoved}
          onLocationLinked={handleLocationLinked}
          onLocationUnscheduled={handleLocationUnscheduled}
          onTripUpdated={handleTripUpdated}
          onTripDeleted={handleTripDeleted}
          onLocationClick={(location) => handleLocationClick(location, { view: 'tripDetail', tripId: selectedTrip.id })}
        />
      )
    }
    
    if (view === 'countryDetail' && selectedCountry) {
      return (
        <CountryDetail
          country={selectedCountry}
          trips={trips}
          onBack={handleBackToList}
          onAddToTrip={handleAddToTrip}
          onDelete={handleLocationDeleted}
          onLocationAddedToTrip={(tripId) => {
            // OPTIMISTIC UPDATE - Increment location count for the affected trip immediately
            setTrips(prev => prev.map(trip => {
              if (trip.id === tripId) {
                return { ...trip, locationCount: (trip.locationCount || 0) + 1 }
              }
              return trip
            }))
            
            // INVALIDATE CACHE - Force fresh fetch
            Cache.invalidateTrips()
            Cache.invalidateLocations()
            
            // Background refresh to verify (non-blocking)
            loadDataWithCache().catch(error => {
              console.error('Refresh failed:', error)
            })
          }}
        />
      )
    }
    
    if (view === 'locationDetail' && selectedLocation) {
      return (
        <LocationDetailView
          location={selectedLocation}
          tripLocationId={selectedLocation.tripLocationId}
          onBack={handleBackFromLocationDetail}
          onLocationUpdated={() => {
            // Refresh data when location is updated
            loadDataWithCache().catch(error => {
              console.error('Refresh failed:', error)
            })
          }}
        />
      )
    }
    
    // Show tabs only for list views
    return (
      <>
        <Tabs
          active={activeTab}
          onChange={handleTabChange}
          onRefresh={handleRefresh}
          onSettingsClick={handleSettingsClick}
        />
        
        {activeTab === 'trips' ? (
          <TripsView
            trips={trips}
            onTripClick={handleTripClick}
            onNewTrip={handleNewTrip}
          />
        ) : (
          <LocationsView
            countries={countries}
            locationsByCountry={locationsByCountry}
            onCountryClick={handleCountryClick}
          />
        )}
      </>
    )
  }
  
  return (
    <div className="w-[360px] h-[500px] bg-gray-50 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      ) : (
        renderView()
      )}
      
      {/* Add to Trip Modal */}
      {showAddToTripModal && locationToAdd && (
        <AddToTripModal
          location={locationToAdd}
          trips={trips}
          onClose={() => {
            setShowAddToTripModal(false)
            setLocationToAdd(null)
          }}
          onSuccess={handleAddToTripSuccess}
        />
      )}
    </div>
  )
}

export default IndexPopup
