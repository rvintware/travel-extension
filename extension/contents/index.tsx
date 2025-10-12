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

// Listen for toast messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_TOAST') {
    showToast(message.payload.message, message.payload.duration || 3000)
  }
})

/**
 * Show a toast notification on the page
 */
function showToast(message: string, duration: number) {
  // Create toast container if it doesn't exist
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
  
  // Create toast element
  const toast = document.createElement('div')
  toast.className = 'travel-companion-toast'
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
  
  // Add CSS animation
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `
  if (!document.querySelector('#travel-companion-toast-styles')) {
    style.id = 'travel-companion-toast-styles'
    document.head.appendChild(style)
  }
  
  // Add to container
  container.appendChild(toast)
  
  // Remove after duration
  setTimeout(() => {
    toast.remove()
    // Remove container if empty
    if (container && container.children.length === 0) {
      container.remove()
    }
  }, duration)
}

export {}

