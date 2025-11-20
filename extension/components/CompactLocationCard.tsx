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
}

export function CompactLocationCard({
  location,
  days,
  onAction,
  onDelete,
  onLocationClick,
  isDragging,
  dragHandleProps,
  showDragHandle
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

  return (
    <div
      className={`bg-white border border-gray-300 rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 relative cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg rotate-[-2deg]' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Drag Handle - Only visible when showDragHandle is true */}
      {showDragHandle && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-grab active:cursor-grabbing text-lg z-10"
          aria-label="Drag to reorder"
          role="button"
          onClick={(e) => e.stopPropagation()}
        >
          ≡≡
        </div>
      )}

      <div className="p-3">
        {/* Line 1: Location Name + KebabMenu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 leading-tight">
            {location.name}
          </h3>
          <div onClick={(e) => e.stopPropagation()}>
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
          
          {/* Delete Button - Inline with Google Maps */}
          {!showDeletePill && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeletePill(true)
              }}
              className="text-xl text-gray-400 hover:text-red-500 transition-colors z-10"
              title="Remove from trip"
              aria-label="Remove from trip"
            >
              🗑️
            </button>
          )}
          {showDeletePill && onDelete && (
            <div onClick={(e) => e.stopPropagation()}>
              <DeletePill
                onConfirm={() => {
                  setShowDeletePill(false)
                  onDelete()
                }}
                onCancel={() => setShowDeletePill(false)}
                position="inline"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

