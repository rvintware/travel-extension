import type { SavedCapture } from "../lib/types"
import { getUserId, saveCapture } from "../lib/storage"
import { generateId } from "../lib/utils"

// Context menu ID
const CONTEXT_MENU_ID = 'save-to-trips'

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Travel Companion extension installed')
  
  // Generate user ID if not exists
  await getUserId()
  
  // Create context menu
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: '⭐ Save to My Trips',
    contexts: ['selection'],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab?.id) {
    try {
      // Create capture object
      const capture: SavedCapture = {
        id: generateId(),
        text: info.selectionText,
        url: tab.url || '',
        pageTitle: tab.title || 'Untitled',
        timestamp: Date.now(),
        tripId: 'default', // Phase 0.1: hardcoded
      }
      
      // Save to storage
      await saveCapture(capture)
      
      // Show toast notification on the page
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_TOAST',
        payload: {
          message: '✓ Saved to My Trips',
          duration: 3000,
        },
      }).catch((error) => {
        // Content script might not be loaded yet, that's okay
        console.log('Could not show toast:', error.message)
      })
      
      // Notify popup if it's open
      chrome.runtime.sendMessage({
        type: 'CAPTURES_UPDATED',
      }).catch(() => {
        // Popup might not be open, that's okay
      })
      
      console.log('Capture saved:', capture.id)
    } catch (error) {
      console.error('Failed to save capture:', error)
    }
  }
})

// Keep service worker alive (Manifest V3 requirement)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok' })
  }
  return true
})

export {}

