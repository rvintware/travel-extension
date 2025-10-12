import type { PlasmoCSConfig } from "plasmo"
import cssText from "data-text:~style.css"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// ============================================================================
// SIMPLIFIED: Screenshots used instead of content extraction!
// This script now ONLY handles toast notifications
// ============================================================================
console.log('🚀 TRAVEL COMPANION CONTENT SCRIPT LOADED (Toast Only)')

// ============================================================================
// MESSAGE LISTENER - TOAST ONLY
// ============================================================================

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_TOAST') {
    console.log('[Content] Showing toast:', message.payload.message)
    showToast(message.payload.message, message.payload.duration || 3000)
  }
})

// ============================================================================
// TOAST FUNCTION (ONLY HELPER FUNCTION)
// ============================================================================

function showToast(message: string, duration: number) {
  try {
    let container = document.getElementById('travel-companion-toast-container')
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'travel-companion-toast-container'
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        pointer-events: none;
      `
      document.body.appendChild(container)
    }
    
    const toast = document.createElement('div')
    toast.style.cssText = `
      background: #10B981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 10px;
      animation: slideIn 0.3s ease-out, fadeOut 0.5s ease-in ${duration - 500}ms forwards;
      pointer-events: auto;
    `
    toast.textContent = message
    
    if (!document.querySelector('#travel-companion-toast-styles')) {
      const style = document.createElement('style')
      style.id = 'travel-companion-toast-styles'
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
    
    container.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
      if (container && container.children.length === 0) {
        container.remove()
      }
    }, duration)
  } catch (error) {
    console.error('[Toast] Failed:', error)
  }
}

export {}
