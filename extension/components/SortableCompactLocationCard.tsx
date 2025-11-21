import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { LocationWithTripData } from '../lib/types'
import { CompactLocationCard } from './CompactLocationCard'
import type { GearAction } from './GearMenu'

interface SortableCompactLocationCardProps {
  location: LocationWithTripData
  days?: number[]
  onAction: (action: GearAction, data?: any) => void
  onDelete?: () => void
  onLocationClick?: (location: LocationWithTripData) => void
  showDragHandle?: boolean
  isMinimalMode?: boolean
  sequenceNumber?: number
  isActive?: boolean
}

export function SortableCompactLocationCard({
  location,
  days,
  onAction,
  onDelete,
  onLocationClick,
  showDragHandle,
  isMinimalMode,
  sequenceNumber,
  isActive = false
}: SortableCompactLocationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: location.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isActive ? 0 : undefined,
  }

  const totalLocations = 0 // This would need to be passed as prop if we want accurate count
  const ariaLabel = isMinimalMode && sequenceNumber !== undefined
    ? `Location: ${location.name}, position ${sequenceNumber}, press space to reorder`
    : `Location: ${location.name}, press space to reorder`

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      aria-label={ariaLabel}
    >
      {isActive ? (
        <div className={isMinimalMode ? "h-12 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg" : "min-h-[120px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg"} />
      ) : (
        <CompactLocationCard
          location={location}
          days={days}
          onAction={onAction}
          onDelete={onDelete}
          onLocationClick={onLocationClick}
          isDragging={isDragging}
          dragHandleProps={{
            ...attributes,
            ...listeners,
          }}
          showDragHandle={showDragHandle}
          isMinimalMode={isMinimalMode}
          sequenceNumber={sequenceNumber}
        />
      )}
    </div>
  )
}

