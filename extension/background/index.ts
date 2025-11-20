import { getUserId, getSettings, setDefaultTrip } from "../lib/storage"
import * as api from "../lib/api"
import { Cache } from "../lib/cache"

// Context menu IDs
const MENU_ID_TRIP = 'save-to-trip'
const MENU_ID_LIBRARY = 'save-to-library'

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Travel Companion Phase 0.2 installed')
  
  // Generate user ID if not exists
  await getUserId()
  
  // Initialize default settings
  const settings = await getSettings()
  if (!settings) {
    await chrome.storage.local.set({
      settings: {
        defaultView: 'trips',
        rememberLastTab: false,
        defaultTripId: null,     // No default trip initially
      }
    })
  }
  
  // Create context menus
  await updateContextMenus()
})

/**
 * Update context menus based on current settings and database state
 */
async function updateContextMenus() {
  try {
    console.log('[BG] Updating context menus...')
    
    // Remove existing menus
    await chrome.contextMenus.removeAll()
    
    const settings = await getSettings()
    const defaultTripId = settings?.defaultTripId
    
    // Try to get active trip from settings first
    let activeTrip = null
    
    if (defaultTripId) {
      try {
        activeTrip = await api.getTrip(defaultTripId)
        // Verify trip is actually active in database
        if (!activeTrip.is_active) {
          console.warn('[BG] Trip from settings is not active in DB, checking database...')
          activeTrip = null
        } else {
          console.log('[BG] Active trip from settings:', activeTrip.name)
        }
      } catch (error) {
        console.warn('[BG] Trip from settings not found, checking database...', error)
      }
    }
    
    // If no active trip from settings, check database for is_active=true
    if (!activeTrip) {
      try {
        const userId = await getUserId()
        const trips = await api.getTrips(userId)
        activeTrip = trips.find(t => t.is_active) || null
        
        if (activeTrip) {
          console.log('[BG] Active trip from database:', activeTrip.name)
          // Sync settings with database - ensure consistency
          await setDefaultTrip(activeTrip.id)
        }
      } catch (error) {
        console.error('[BG] Failed to fetch trips from database:', error)
      }
    }
    
    // Show trip menu if active trip found
    if (activeTrip) {
        chrome.contextMenus.create({
        id: MENU_ID_TRIP,
        title: `⭐ Save to ${activeTrip.name}`,
          contexts: ['selection'],
        })
      console.log('[BG] ✅ Context menu created for trip:', activeTrip.name)
    } else {
      // No active trip - show generic save option
      chrome.contextMenus.create({
        id: MENU_ID_LIBRARY,
        title: '📍 Save Location',
        contexts: ['selection'],
      })
      console.log('[BG] ✅ Context menu created for library save')
    }
    
    console.log('[BG] ✅ Context menus updated')
  } catch (error) {
    console.error('[BG] Failed to update context menus:', error)
    // Fallback: create generic save menu
    try {
      await chrome.contextMenus.removeAll()
      chrome.contextMenus.create({
        id: MENU_ID_LIBRARY,
        title: '📍 Save Location',
        contexts: ['selection'],
      })
    } catch (fallbackError) {
      console.error('[BG] Failed to create fallback menu:', fallbackError)
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[BG] ========== SAVE STARTED ==========')
  console.log('[BG] Menu ID:', info.menuItemId)
  console.log('[BG] Selected text length:', info.selectionText?.length)
  console.log('[BG] Tab URL:', tab?.url)
  
  if (!info.selectionText || !tab?.id) {
    console.error('[BG] Missing selection or tab')
    return
  }
  
  try {
    // Get settings
    console.log('[BG] Getting user settings...')
    const userId = await getUserId()
    const settings = await getSettings()
    
    console.log('[BG] User ID:', userId)
    console.log('[BG] Country detection: Backend AI')
    
    // Take screenshot (no content script needed!)
    console.log('[BG] Taking screenshot...')
    let screenshot = null
    try {
      screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'jpeg',  // JPEG for smaller file size
        quality: 70      // Good for OCR, 5x smaller than PNG
      })
      console.log('[BG] ✅ Screenshot captured, size:', screenshot.length, 'chars')
    } catch (error) {
      console.error('[BG] Screenshot failed:', error)
    }
    
    // Create location - backend will detect country via AI
    console.log('[BG] Calling backend API...')
    console.log('[BG] Has screenshot:', !!screenshot)
    
    const location = await api.saveLocation({
      userId,
      countryId: null, // Let backend AI detect country
      name: api.extractNameFromText(info.selectionText),
      originalText: info.selectionText,
      sourceUrl: tab.url || '',
      pageTitle: tab.title || 'Untitled',
      screenshot: screenshot, // Screenshot for AI vision
      tripId: info.menuItemId === MENU_ID_TRIP && settings?.defaultTripId 
        ? settings.defaultTripId 
        : undefined
    })
    
    console.log('[BG] ✅ Location created:', location.id)
    console.log('[BG] Processing status:', location.processing_status)
    
    // Update cache optimistically (DB is already updated via API response)
    try {
      const cached = await Cache.getLocations()
      const updated = cached.data 
        ? [...cached.data.filter(l => l.id !== location.id), location] // Replace if exists
        : [location]
      await Cache.setLocations(updated)
      console.log('[BG] ✅ Cache updated with new location')
    } catch (cacheError) {
      // Cache update failed, but location is saved - popup will fetch fresh
      console.warn('[BG] Cache update failed:', cacheError)
    }
    
    // If saving to trip, link it
    if (info.menuItemId === MENU_ID_TRIP && settings?.defaultTripId) {
      await api.linkLocationToTrip({
        tripId: settings.defaultTripId,
        locationId: location.id,
        // Leave unscheduled (no dayNumber)
      })
      
      // Invalidate trips cache (location count changed)
      await Cache.invalidateTrips()
      // Note: Locations cache already updated above
      
      // Get trip name for toast with error handling
      let tripName = 'Trip'
      try {
        const trip = await api.getTrip(settings.defaultTripId)
        tripName = trip.name
      } catch (error) {
        console.warn('Could not fetch trip name:', error)
      }
      
      await showToast(tab.id, `✓ ${tripName}`)
    } else {
      // Saved to library only
      await showToast(tab.id, `✓ Saved`)
    }
    
    // Notify popup if open
    chrome.runtime.sendMessage({
      type: 'CAPTURES_UPDATED',
    }).catch(() => {
      // Popup not open, that's fine
    })
    
  } catch (error) {
    console.error('[BG] ❌ SAVE FAILED:', error)
    await showToast(tab.id, '❌ Failed to save. Check connection.')
  } finally {
    console.log('[BG] ========== SAVE ENDED ==========')
  }
})

/**
 * Show toast notification on the page with retry logic
 */
async function showToast(tabId: number, message: string) {
  // Retry up to 3 times (content script might not be ready)
  for (let i = 0; i < 3; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_TOAST',
        payload: {
          message,
          duration: 3000,
        },
      })
      return // Success!
    } catch (error) {
      if (i < 2) {
        // Wait 100ms before retry
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        console.warn('Toast failed after 3 retries:', error)
      }
    }
  }
}

// Listen for settings and trip updates to refresh context menu
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SETTINGS_UPDATED' || message.type === 'TRIP_UPDATED') {
    console.log('[BG] Settings or trip updated, refreshing context menu')
    updateContextMenus()
  }
  return true
})

// Listen for storage changes to refresh context menu
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings) {
    console.log('[BG] Settings changed in storage, refreshing menu')
    updateContextMenus()
  }
})

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok' })
  }
  return true
})

export {}
