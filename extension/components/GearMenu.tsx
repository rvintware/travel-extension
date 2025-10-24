import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export type GearAction = 
  | 'add-to-trip' 
  | 'edit' 
  | 'delete' 
  | 'set-time' 
  | 'move-to-day' 
  | 'unschedule' 
  | 'remove-from-trip'

interface GearMenuProps {
  context: 'library' | 'trip'
  days?: number[]  // Available days for trip context
  onAction: (action: GearAction, data?: any) => void
}

export function GearMenu({ context, days = [], onAction }: GearMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setMenuPosition(null)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  const handleAction = (action: GearAction, data?: any) => {
    setIsOpen(false)
    setMenuPosition(null)
    onAction(action, data)
  }
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isOpen && buttonRef.current) {
      // Calculate menu position
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      })
    } else {
      setMenuPosition(null)
    }
    
    setIsOpen(!isOpen)
  }
  
  const menuContent = isOpen && menuPosition && (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
      }}
      className="bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
          {context === 'library' ? (
            // Library context actions
            <>
              <button
                onClick={() => handleAction('add-to-trip')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                ➕ Add to Trip
              </button>
              <button
                onClick={() => handleAction('edit')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                ✏️ Edit
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => handleAction('delete')}
                className="w-full px-4 py-2 text-left text-sm text-error hover:bg-red-50 transition-colors"
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            // Trip context actions
            <>
              <button
                onClick={() => handleAction('set-time')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              >
                🕐 Set Time
              </button>
              {days.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-1"></div>
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => handleAction('move-to-day', day)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                    >
                      📅 Move to Day {day}
                    </button>
                  ))}
                  <button
                    onClick={() => handleAction('unschedule')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    📋 Unschedule
                  </button>
                </>
              )}
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => handleAction('remove-from-trip')}
                className="w-full px-4 py-2 text-left text-sm text-error hover:bg-red-50 transition-colors"
              >
                🗑️ Remove from Trip
              </button>
            </>
          )}
        </div>
      )
  
  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        aria-label="Actions"
      >
        <span className="text-base">⚙️</span>
      </button>
      
      {menuContent && createPortal(menuContent, document.body)}
    </>
  )
}

