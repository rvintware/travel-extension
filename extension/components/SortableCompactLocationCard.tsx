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
}

export function SortableCompactLocationCard({
  location,
  days,
  onAction,
  onDelete,
  onLocationClick,
  showDragHandle
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
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      aria-label={`Location: ${location.name}, press space to reorder`}
    >
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
      />
    </div>
  )
}

