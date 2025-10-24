import React from 'react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-6xl mb-4">🗺️</div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        No locations saved yet
      </h2>
      <p className="text-sm text-gray-600 mb-6 max-w-xs">
        Start saving places by highlighting text on any webpage and right-clicking
      </p>
      
      <div className="bg-gray-50 rounded-lg p-4 text-left max-w-xs border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Try it on Reddit or a blog!
        </p>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Highlight a recommendation</li>
          <li>2. Right-click</li>
          <li>3. "Save to My Trips"</li>
        </ol>
      </div>
    </div>
  )
}

