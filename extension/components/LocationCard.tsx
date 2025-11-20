import React, { useState } from 'react'
import type { Location, LocationWithTripData, TipObject } from '../lib/types'
import { formatRelativeTime, getDomain, getSourceEmoji } from '../lib/utils'
import { GearMenu, type GearAction } from './GearMenu'
import { KebabMenu, type KebabMenuOption } from './KebabMenu'
import { DeletePill } from './DeletePill'

interface LocationCardProps {
  location: Location | LocationWithTripData
  context: 'library' | 'trip'
  days?: number[]
  onAction: (action: GearAction, data?: any) => void
  onDelete?: () => void
  onAddToTrip?: () => void  // For library context
  isDragging?: boolean  // For drag and drop state
  dragHandleProps?: any  // Props from @dnd-kit for drag handle
  showDragHandle?: boolean  // Whether to show drag handle (when viewing specific day)
}

export function LocationCard({ location, context, days, onAction, onDelete, onAddToTrip, isDragging, dragHandleProps, showDragHandle }: LocationCardProps) {
  const [showDeletePill, setShowDeletePill] = useState(false)
  const domain = getDomain(location.source_url)
  const emoji = getSourceEmoji(location.source_url)
  
  const tripData = context === 'trip' ? (location as LocationWithTripData) : null
  
  const tips = Array.isArray(location.tips) 
    ? location.tips.slice(0, 3) 
    : []
  
  // Build Google Maps URL using place_id
  const googleMapsUrl = location.place_id
    ? `https://www.google.com/maps/place/?q=place_id:${location.place_id}`
    : location.lat && location.lng
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : location.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
    : null
  
  // Only show processing for recent locations with screenshots
  const hasContext = (location as any).original_context !== null
  const isRecent = new Date(location.created_at).getTime() > Date.now() - (10 * 60 * 1000)
  const shouldShowProcessing = 
    (location.processing_status === 'pending' || location.processing_status === 'processing') &&
    (hasContext || isRecent)
  
  return (
    <div className={`bg-white border border-gray-300 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-200 relative ${isDragging ? 'opacity-50 shadow-lg rotate-[-2deg]' : ''}`}>
      {/* Drag Handle - Always visible when showDragHandle is true */}
      {showDragHandle && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-grab active:cursor-grabbing text-lg z-10"
          aria-label="Drag to reorder"
          role="button"
        >
          ≡≡
        </div>
      )}
      {/* Day Badge (trip context only, when assigned to a day) */}
      {context === 'trip' && tripData?.dayNumber && (
        <div className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium z-10">
          Day {tripData.dayNumber}
        </div>
      )}
      
      {/* Processing Banner */}
      {shouldShowProcessing && (
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
            ⚠️ Processing failed
          </div>
        </div>
      )}
      
      {/* Hero Photo - Full Width, Clickable */}
      {location.photos && location.photos.length > 0 && (
        <a 
          href={location.photos[0]} 
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={location.photos[0]}
            alt={location.name}
            className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      )}
      
      {/* Content */}
      <div className="p-4">
        {/* Header with Name and Menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-xl font-semibold text-gray-900 flex-1">
            {location.name}
          </h3>
          {(context === 'trip' || context === 'library') ? (
            <KebabMenu
              options={buildKebabMenuOptions()}
              currentDay={tripData?.dayNumber || null}
              onAction={(optionId, data) => {
                if (optionId === 'assign-day') {
                  // data is the day number string or 'null' for unassigned
                  onAction('move-to-day', data === 'null' ? null : parseInt(data))
                } else if (optionId === 'edit-location') {
                  onAction('edit-location', null)
                }
              }}
            />
          ) : null}
        </div>
        
        {/* Metadata Section */}
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          {location.address && (
            <div className="flex items-start gap-2">
              <span>📍</span>
              <span>{location.address}</span>
            </div>
          )}
          
          {location.category && (
            <div className="flex items-center gap-2">
              <span>🏷️</span>
              <span className="capitalize">
                {location.category}
                {location.subcategory && ` · ${location.subcategory}`}
                {location.price_level && ` · ${'$'.repeat(location.price_level)}`}
              </span>
            </div>
          )}
          
          {location.user_rating && (
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>{location.user_rating} Google rating</span>
            </div>
          )}
          
          {/* Time info (trip context only) */}
          {context === 'trip' && tripData?.suggestedTime && (
            <div className="flex items-center gap-2">
              <span>🕐</span>
              <span>
                {tripData.suggestedTime}
                {tripData.estimatedDurationMinutes && (
                  <span className="text-gray-500">
                    {' '}· ⏱️ {Math.floor(tripData.estimatedDurationMinutes / 60)}h {tripData.estimatedDurationMinutes % 60}m
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        
        {/* Tips Section */}
        {tips.length > 0 && (
          <>
            <div className="border-t border-gray-200 pt-3 mb-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">💡 Tips</div>
              <ul className="space-y-1.5">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-700 flex gap-2">
                    <span className="flex-shrink-0">{getSourceIcon(tip.source)}</span>
                    <span>"{tip.text}"</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {/* Footer - Source */}
        <div className="border-t border-gray-200 pt-3 relative">
          <a
            href={location.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
          >
            <span>{emoji}</span>
            <span>{domain}</span>
            <span>→</span>
          </a>
          
          {/* Google Maps Link */}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors mt-2"
            >
              <span>🗺️</span>
              <span>View on Maps</span>
              <span>→</span>
            </a>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            Saved {formatRelativeTime(new Date(location.created_at).getTime())}
          </div>
          
          {/* Library Context: Add to Trip Button */}
          {context === 'library' && onAddToTrip && (
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={onAddToTrip}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                aria-label="Add to trip"
                role="button"
              >
                Add to Trip
              </button>
              
              {/* Delete Bin Icon or Pill - positioned inline, replacing trash bin */}
              {!showDeletePill && onDelete && (
            <button
              onClick={() => setShowDeletePill(true)}
                  className="text-xl text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
              aria-label="Delete location"
              role="button"
            >
              🗑️
            </button>
          )}
              {showDeletePill && onDelete && (
                <DeletePill
                  onConfirm={() => {
                    setShowDeletePill(false)
                    onDelete()
                  }}
                  onCancel={() => setShowDeletePill(false)}
                  position="inline"
                />
              )}
            </div>
          )}
          
          {/* Trip Context: Delete Bin Icon or Pill */}
          {context === 'trip' && (
            <>
              {!showDeletePill && onDelete && (
                <button
                  onClick={() => setShowDeletePill(true)}
                  className="absolute bottom-4 right-4 text-xl text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove from trip"
                  aria-label="Remove from trip"
                  role="button"
                >
                  🗑️
                </button>
              )}
          {showDeletePill && onDelete && (
            <DeletePill
              onConfirm={() => {
                setShowDeletePill(false)
                onDelete()
              }}
              onCancel={() => setShowDeletePill(false)}
              position="bottom-right"
            />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
  
  // Helper function to build kebab menu options
  function buildKebabMenuOptions(): KebabMenuOption[] {
    const options: KebabMenuOption[] = []
    
    if (context === 'library') {
      // Library context: Edit Location
      options.push({
        id: 'edit-location',
        label: 'Edit Location',
        icon: '✏️',
      })
    } else if (context === 'trip') {
      // Trip context: Assign to Day + Edit Location
      // Assign to Day option with submenu
      if (days && days.length > 0) {
        options.push({
          id: 'assign-day',
          label: 'Assign to Day',
          icon: '📅',
          submenu: [
            ...days.map(day => ({
              id: day.toString(),
              label: `Day ${day}`,
            })),
            {
              id: 'null',
              label: 'Unassigned',
            }
          ]
        })
      }
      
      // Edit Location option
      options.push({
        id: 'edit-location',
        label: 'Edit Location',
        icon: '✏️',
      })
    }
    
    return options
  }
}

/**
 * Get emoji icon for tip source
 * PHASE 2: Visual indicators for where tips came from
 */
function getSourceIcon(source: string): string {
  switch (source) {
    case 'highlight': return '📝'  // User's highlighted text
    case 'context': return '📄'    // Surrounding paragraph
    case 'page': return '🌐'       // Page content
    case 'google_reviews': return '⭐' // Google reviews
    default: return '💡'           // Fallback
  }
}
