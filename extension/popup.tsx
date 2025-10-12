import { useEffect, useState } from "react"
import { CaptureCard } from "./components/CaptureCard"
import { EmptyState } from "./components/EmptyState"
import type { SavedCapture } from "./lib/types"
import { getCaptures, deleteCapture } from "./lib/storage"
import "./style.css"

function IndexPopup() {
  const [captures, setCaptures] = useState<SavedCapture[]>([])
  const [loading, setLoading] = useState(true)

  // Load captures on mount
  useEffect(() => {
    loadCaptures()
  }, [])

  // Listen for updates from background script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'CAPTURES_UPDATED') {
        loadCaptures()
      }
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      loadCaptures()
    }
    
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  const loadCaptures = async () => {
    try {
      const data = await getCaptures()
      setCaptures(data)
    } catch (error) {
      console.error('Failed to load captures:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCapture(id)
      setCaptures(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete capture:', error)
    }
  }

  return (
    <div className="w-[360px] h-[500px] bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">My Trips</h1>
            <p className="text-sm text-gray-600">
              {captures.length} {captures.length === 1 ? 'location' : 'locations'} saved
            </p>
          </div>
          <div className="text-2xl">🗺️</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : captures.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-4 space-y-3">
            {captures.map((capture) => (
              <CaptureCard
                key={capture.id}
                capture={capture}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer tip */}
      {!loading && captures.length > 0 && (
        <div className="bg-primary-light border-t border-primary px-4 py-2 flex-shrink-0">
          <p className="text-xs text-primary-dark text-center">
            💡 Tip: Right-click any text on a webpage to save it
          </p>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
