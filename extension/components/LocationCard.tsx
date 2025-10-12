import React from 'react'
import type { Location, LocationWithTripData } from '../lib/types'
import { formatRelativeTime, getDomain, getSourceEmoji } from '../lib/utils'
import { GearMenu, type GearAction } from './GearMenu'

interface LocationCardProps {
  location: Location | LocationWithTripData
  context: 'library' | 'trip'
  days?: number[]  // For trip context
  onAction: (action: GearAction, data?: any) => void
}

export function LocationCard({ location, context, days, onAction }: LocationCardProps) {
  const domain = getDomain(location.source_url)
  const emoji = getSourceEmoji(location.source_url)
  
  // Get trip-specific data if available
  const tripData = context === 'trip' ? (location as LocationWithTripData) : null
  
  // Get category emoji
  const categoryEmoji = getCategoryEmoji(location.category)
  
  // Limit tips to max 3
  const tips = Array.isArray(location.tips) 
    ? location.tips.slice(0, 3) 
    : []
  
  // Check if location is in multiple trips (for library view)
  // This would come from API in real implementation
  const tripCount = 0 // TODO: Get from API
  
  // Only show processing banner for locations that will actually be AI processed
  const hasContext = (location as any).original_context !== null && (location as any).original_context !== undefined
  const isRecent = new Date(location.created_at).getTime() > Date.now() - (10 * 60 * 1000) // Last 10 minutes
  const shouldShowProcessing = 
    (location.processing_status === 'pending' || location.processing_status === 'processing') &&
    (hasContext || isRecent)
  
  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-200">
      {/* Processing Status Banner - Only for locations being AI processed */}
      {shouldShowProcessing && location.processing_status === 'pending' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="animate-spin">⏳</div>
            <span>Processing...</span>
          </div>
        </div>
      )}
      
      {shouldShowProcessing && location.processing_status === 'processing' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="animate-pulse">🔄</div>
            <span>Processing...</span>
          </div>
        </div>
      )}
      
      {location.processing_status === 'error' && hasContext && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="text-sm text-red-700">
            ⚠️ Processing failed - showing raw save
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{categoryEmoji}</span>
          <h3 className="font-semibold text-gray-900 text-base">
            {location.name}
          </h3>
        </div>
        <GearMenu
          context={context}
          days={days}
          onAction={onAction}
        />
      </div>
      
      {/* Divider */}
      <div className="px-4">
        <div className="border-t border-gray-300"></div>
      </div>
      
      {/* Photo (if available) */}
      {location.photos && location.photos.length > 0 && (
        <div className="px-4 pt-3">
          <img
            src={location.photos[0]}
            alt={location.name}
            className="w-full h-[120px] object-cover rounded"
          />
        </div>
      )}
      
      {/* Divider */}
      {location.photos && location.photos.length > 0 && (
        <div className="px-4 pt-3">
          <div className="border-t border-gray-300"></div>
        </div>
      )}
      
      {/* Metadata Section */}
      <div className="px-4 pt-3 space-y-1">
        {location.address && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>📍</span>
            <span>{location.address}</span>
          </div>
        )}
        {location.category && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>🏷️</span>
            <span className="capitalize">{location.category}</span>
          </div>
        )}
        
        {/* Time info (trip context only) */}
        {context === 'trip' && tripData?.suggestedTime && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>🕐</span>
            <span>{tripData.suggestedTime}</span>
            {tripData.estimatedDurationMinutes && (
              <span className="text-gray-500">
                · ⏱️ {Math.floor(tripData.estimatedDurationMinutes / 60)}h {tripData.estimatedDurationMinutes % 60}m
              </span>
            )}
          </div>
        )}
        
        {/* Trip usage badge (library context only) */}
        {context === 'library' && tripCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>⭐</span>
            <span>In {tripCount} {tripCount === 1 ? 'trip' : 'trips'}</span>
          </div>
        )}
        
        {context === 'library' && tripCount === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>⭐</span>
            <span>Not in any trip yet</span>
          </div>
        )}
      </div>
      
      {/* Divider (if we have tips) */}
      {tips.length > 0 && (
        <div className="px-4 pt-3">
          <div className="border-t border-gray-300"></div>
        </div>
      )}
      
      {/* Tips Section - Max 3, quoted */}
      {tips.length > 0 && (
        <div className="px-4 pt-3 space-y-2">
          {tips.map((tip, index) => (
            <div key={index} className="text-sm text-gray-700 italic">
              "{tip}"
              {index === tips.length - 1 && (
                <span className="text-xs text-gray-500 not-italic ml-1">
                  - {domain}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Divider */}
      <div className="px-4 pt-3">
        <div className="border-t border-gray-300"></div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span>{domain}</span>
        </div>
        <span>{formatRelativeTime(new Date(location.created_at).getTime())}</span>
      </div>
    </div>
  )
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category?: string | null): string {
  if (!category) return '📍'
  
  const lower = category.toLowerCase()
  if (lower.includes('restaurant') || lower.includes('food')) return '🍽️'
  if (lower.includes('bar') || lower.includes('drink')) return '🍷'
  if (lower.includes('cafe') || lower.includes('coffee')) return '☕'
  if (lower.includes('temple') || lower.includes('shrine')) return '⛩️'
  if (lower.includes('museum')) return '🏛️'
  if (lower.includes('park') || lower.includes('garden')) return '🌳'
  if (lower.includes('hotel') || lower.includes('accommodation')) return '🏨'
  if (lower.includes('shop') || lower.includes('shopping')) return '🛍️'
  if (lower.includes('beach')) return '🏖️'
  if (lower.includes('mountain') || lower.includes('hike')) return '⛰️'
  
  return '📍'
}

