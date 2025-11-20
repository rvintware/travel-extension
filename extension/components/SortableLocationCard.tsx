import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Location, LocationWithTripData } from '../lib/types'
import { LocationCard } from './LocationCard'
import type { GearAction } from './GearMenu'

interface SortableLocationCardProps {
  location: Location | LocationWithTripData
  context: 'library' | 'trip'
  days?: number[]
  onAction: (action: GearAction, data?: any) => void
  onDelete?: () => void
  onAddToTrip?: () => void
  showDragHandle?: boolean
}

export function SortableLocationCard({
  location,
  context,
  days,
  onAction,
  onDelete,
  onAddToTrip,
  showDragHandle
}: SortableLocationCardProps) {
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
      <LocationCard
        location={location}
        context={context}
        days={days}
        onAction={onAction}
        onDelete={onDelete}
        onAddToTrip={onAddToTrip}
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

