import { useEffect, useState } from "react"
import { Tabs } from "./components/Tabs"
import { TripsView } from "./popup/TripsView"
import { LocationsView } from "./popup/LocationsView"
import { CountryDetail } from "./popup/CountryDetail"
import { TripDetail } from "./popup/TripDetail"
import { CreateTripView } from "./popup/CreateTripView"
import { Settings } from "./components/Settings"
import { AddToTripModal } from "./components/AddToTripModal"
import type { Country, Trip, Location, ViewType } from "./lib/types"
import { getUserId, getSettings } from "./lib/storage"
import { Cache } from "./lib/cache"
import * as api from "./lib/api"
import "./style.css"

function IndexPopup() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'locations' | 'trips'>('trips')
  
  // View state
  const [view, setView] = useState<ViewType>('tripList')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  
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
        // Invalidate caches (new location added, counts changed)
        await Cache.invalidateTrips()
        await Cache.invalidateLocations()
        
        // Reload data
        await loadDataWithCache()
      }
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])
  
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
      
      // STEP 3: If all caches are fresh, we're done!
      if (cachedCountries.fresh && cachedTrips.fresh && cachedLocations.fresh) {
        return // All data is fresh, no need to fetch!
      }
      
      // STEP 4: Fetch fresh data in background (only what's stale)
      const [countriesData, tripsData, locationsData] = await Promise.all([
        cachedCountries.fresh ? Promise.resolve(cachedCountries.data!) : api.getCountries(),
        cachedTrips.fresh ? Promise.resolve(cachedTrips.data!) : api.getTrips(userId),
        cachedLocations.fresh ? Promise.resolve(cachedLocations.data!) : api.getLocations(userId)
      ])
      
      // STEP 5: Update UI with fresh data (seamless)
      setCountries(countriesData)
      setTrips(tripsData)
      setLocations(locationsData)
      setLoading(false)
      
      // STEP 6: Update cache (only what was fetched)
      if (!cachedCountries.fresh) {
        await Cache.setCountries(countriesData)
      }
      if (!cachedTrips.fresh) {
        await Cache.setTrips(tripsData)
      }
      if (!cachedLocations.fresh) {
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
  
  function handleNewTrip() {
    setView('createTrip')
  }
  
  function handleAddToTrip(location: Location) {
    setLocationToAdd(location)
    setShowAddToTripModal(true)
  }
  
  function handleAddToTripSuccess() {
    setShowAddToTripModal(false)
    setLocationToAdd(null)
    loadDataWithCache() // Refresh data
  }
  
  function handleDeleteLocation(location: Location) {
    loadDataWithCache() // Refresh data
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
            loadDataWithCache() // Refresh
          }}
        />
      )
    }
    
    if (view === 'tripDetail' && selectedTrip) {
      return (
        <TripDetail
          trip={selectedTrip}
          onBack={handleBackToList}
        />
      )
    }
    
    if (view === 'countryDetail' && selectedCountry) {
      return (
        <CountryDetail
          country={selectedCountry}
          onBack={handleBackToList}
          onAddToTrip={handleAddToTrip}
          onDelete={handleDeleteLocation}
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
            countries={countries}
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
