import React, { useState } from 'react'
import type { LocationWithTripData } from '../lib/types'
import { getDomain, getSourceEmoji } from '../lib/utils'
import { KebabMenu, type KebabMenuOption } from './KebabMenu'
import { DeletePill } from './DeletePill'
import type { GearAction } from './GearMenu'

interface CompactLocationCardProps {
  location: LocationWithTripData
  days?: number[]
  onAction: (action: GearAction, data?: any) => void
  onDelete?: () => void
  onLocationClick?: (location: LocationWithTripData) => void
  isDragging?: boolean
  dragHandleProps?: any
  showDragHandle?: boolean
  isMinimalMode?: boolean
  sequenceNumber?: number
}

export function CompactLocationCard({
  location,
  days,
  onAction,
  onDelete,
  onLocationClick,
  isDragging,
  dragHandleProps,
  showDragHandle,
  isMinimalMode = false,
  sequenceNumber
}: CompactLocationCardProps) {
  const [showDeletePill, setShowDeletePill] = useState(false)
  const domain = getDomain(location.source_url)
  const emoji = getSourceEmoji(location.source_url)
  
  // Build Google Maps URL using place_id
  const googleMapsUrl = location.place_id
    ? `https://www.google.com/maps/place/?q=place_id:${location.place_id}`
    : location.lat && location.lng
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : location.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
    : null

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      showDeletePill
    ) {
      return
    }
    onLocationClick?.(location)
  }

  function buildKebabMenuOptions(): KebabMenuOption[] {
    const options: KebabMenuOption[] = []
    
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
    
    return options
  }

  // Minimal mode rendering
  if (isMinimalMode) {
    return (
      <div
        className={`h-12 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between px-3 py-2 relative transition-all duration-200 ease-in-out ${
          isDragging ? 'opacity-60 border-primary border-2' : ''
        }`}
        onClick={handleCardClick}
      >
        {/* Drag Handle - Center Top */}
        {showDragHandle && dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-400 cursor-grab active:cursor-grabbing text-lg z-10"
            aria-label={`Drag to reorder ${location.name}, position ${sequenceNumber || 'unknown'}`}
            role="button"
            tabIndex={0}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                // Spacebar/Enter to start drag is handled by @dnd-kit
              }
            }}
          >
            ≡≡
          </div>
        )}
        
        {/* Location Name */}
        <h3 className="flex-1 text-sm font-medium text-gray-900 truncate">
          {location.name}
        </h3>
        
        {/* Sequence Badge */}
        {sequenceNumber !== undefined && (
          <div className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium" aria-label={`Position ${sequenceNumber}`}>
            {sequenceNumber}
          </div>
        )}
      </div>
    )
  }

  // Full card rendering
  return (
    <div
      className={`bg-white border border-gray-300 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 ease-in-out relative cursor-pointer ${
        isDragging ? 'opacity-60 border-primary border-2' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Drag Handle - Only visible when showDragHandle is true */}
      {showDragHandle && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-400 cursor-grab active:cursor-grabbing text-lg z-10"
          aria-label="Drag to reorder"
          role="button"
          onClick={(e) => e.stopPropagation()}
        >
          ≡≡
        </div>
      )}

      <div className="p-3">
        {/* Line 1: Location Name + Sequence Badge + KebabMenu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 leading-tight">
            {location.name}
          </h3>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Sequence Badge - Only show when sequenceNumber provided and showDragHandle is true */}
            {showDragHandle && sequenceNumber !== undefined && (
              <div className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium" aria-label={`Position ${sequenceNumber}`}>
                {sequenceNumber}
              </div>
            )}
            <KebabMenu
              options={buildKebabMenuOptions()}
              currentDay={location.dayNumber || null}
              onAction={(optionId, data) => {
                if (optionId === 'assign-day') {
                  onAction('move-to-day', data === 'null' ? null : parseInt(data))
                } else if (optionId === 'edit-location') {
                  onAction('edit-location', null)
                }
              }}
            />
          </div>
        </div>

        {/* Line 2: Day Badge */}
        {location.dayNumber && (
          <div className="mb-2">
            <div className="inline-block bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
              Day {location.dayNumber}
            </div>
          </div>
        )}

        {/* Line 3: Address */}
        {location.address && (
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
            <span>📍</span>
            <span>{location.address}</span>
          </div>
        )}

        {/* Line 4: Reddit Link (standalone) */}
        <div className="mb-2">
          <a
            href={location.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{emoji}</span>
            <span>{domain}</span>
            <span>→</span>
          </a>
        </div>

        {/* Line 5: Google Maps Link + Trash Icon (same line) */}
        <div className="flex items-center justify-between gap-2">
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span>🗺️</span>
              <span>View on Maps</span>
              <span>→</span>
            </a>
          )}
          
          {/* Delete Button / DeletePill - Fixed height container to prevent card size change */}
          <div className="h-6 flex items-center justify-end flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {!showDeletePill && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeletePill(true)
                }}
                className="text-xl text-gray-400 hover:text-red-500 transition-colors z-10 flex items-center justify-center h-6"
                title="Remove from trip"
                aria-label="Remove from trip"
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
        </div>
      </div>
    </div>
  )
}

