import React, { useEffect, useRef } from 'react'

interface DeletePillProps {
  onConfirm: () => void
  onCancel: () => void
  position?: 'bottom-right' | 'bottom-left' | 'inline'
}

export function DeletePill({ onConfirm, onCancel, position = 'bottom-right' }: DeletePillProps) {
  const pillRef = useRef<HTMLDivElement>(null)
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pillRef.current && !pillRef.current.contains(event.target as Node)) {
        onCancel()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])
  
  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])
  
  const positionClasses = position === 'bottom-right' 
    ? 'absolute bottom-4 right-4' 
    : position === 'bottom-left'
    ? 'absolute bottom-4 left-4'
    : 'relative' // inline positioning
  
  return (
    <div
      ref={pillRef}
      className={`${positionClasses} flex border border-gray-300 rounded-full overflow-hidden shadow-md animate-[pillFadeIn_200ms_ease-out] z-10`}
    >
      <button
        onClick={onConfirm}
        className="px-3 py-1 bg-white hover:bg-green-500 hover:text-white transition-colors duration-150 text-base"
        title="Confirm delete"
      >
        ✅
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 bg-white hover:bg-red-500 hover:text-white transition-colors duration-150 text-base border-l border-gray-300"
        title="Cancel"
      >
        ❌
      </button>
    </div>
  )
}

