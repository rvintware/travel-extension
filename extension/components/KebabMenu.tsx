import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface KebabMenuOption {
  id: string
  label: string
  icon?: string
  submenu?: KebabMenuOption[]
  onClick?: () => void
}

interface KebabMenuProps {
  options: KebabMenuOption[]
  currentDay?: number | null
  onAction: (optionId: string, data?: any) => void
}

export function KebabMenu({ options, currentDay, onAction }: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [submenuFixedPosition, setSubmenuFixedPosition] = useState<{ top: number; left?: number; right?: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        (!submenuRef.current || !submenuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false)
        setSubmenuOpen(null)
        setMenuPosition(null)
        setSubmenuFixedPosition(null)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Close menu on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSubmenuOpen(null)
        setMenuPosition(null)
        setSubmenuFixedPosition(null)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])
  
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const edgePadding = 12
      const gap = 4
      
      // Calculate available space above and below button
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      // Estimate menu height (approximate: ~40px per option + padding)
      const estimatedMenuHeight = options.length * 40 + 16
      const menuHeight = estimatedMenuHeight
      
      let top: number
      
      // Strategy: Maximize visible content, allow overlap with header (same as submenu)
      if (spaceBelow >= menuHeight + edgePadding) {
        // Enough space below - position below button
        top = rect.bottom + window.scrollY + gap
      } else if (spaceAbove >= menuHeight + edgePadding) {
        // Enough space above - position above button
        top = rect.top + window.scrollY - menuHeight - gap
      } else {
        // Not enough space in either direction - maximize visible content
        if (spaceBelow > spaceAbove) {
          // More space below - position below, constrain to viewport
          top = rect.bottom + window.scrollY + gap
          const maxTop = window.scrollY + viewportHeight - menuHeight - edgePadding
          top = Math.min(top, maxTop)
        } else {
          // More space above - position above, allow overlap with header
          top = rect.top + window.scrollY - menuHeight - gap
          const minTop = window.scrollY - menuHeight + 50 // Show at least 50px even if overlapping
          top = Math.max(minTop, top)
        }
      }
      
      setMenuPosition({
        top: top,
        right: window.innerWidth - rect.right - window.scrollX
      })
    }
    setIsOpen(!isOpen)
    setSubmenuOpen(null)
    setSubmenuFixedPosition(null)
  }
  
  // Calculate submenu position when it opens - maximize visible content, allow overlap
  useEffect(() => {
    if (submenuOpen && menuRef.current) {
      const menuItem = menuRef.current.querySelector(`[data-option-id="${submenuOpen}"]`) as HTMLElement
      if (menuItem) {
        const itemRect = menuItem.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const submenuWidth = 160 // Approximate width (min-w-[140px] + padding)
        const submenuMaxHeight = 200 // max-h-[200px]
        const edgePadding = 12 // Minimum padding from viewport edges (except top - can overlap header)
        const menuItemGap = 4 // Gap between menu item and submenu (can be negative for overlap)
        
        // Calculate horizontal position - allow overlap with main menu
        const spaceOnRight = viewportWidth - itemRect.right
        const spaceOnLeft = itemRect.left
        
        let horizontalPos: { left?: number; right?: number }
        
        // Strategy: Prefer opening toward center, allow overlap with main menu
        if (spaceOnRight >= submenuWidth + edgePadding && spaceOnLeft >= submenuWidth + edgePadding) {
          // Enough space on both sides - open toward center
          if (itemRect.left < viewportWidth / 2) {
            // Menu item on left half - open right
            horizontalPos = { left: itemRect.right + menuItemGap }
          } else {
            // Menu item on right half - open left
            horizontalPos = { right: viewportWidth - itemRect.left + menuItemGap }
          }
        } else if (spaceOnRight >= submenuWidth + edgePadding) {
          // Enough space on right
          horizontalPos = { left: itemRect.right + menuItemGap }
        } else if (spaceOnLeft >= submenuWidth + edgePadding) {
          // Enough space on left
          horizontalPos = { right: viewportWidth - itemRect.left + menuItemGap }
        } else {
          // Not enough space - allow overlap, prefer center
          if (spaceOnRight > spaceOnLeft) {
            // More space on right - position right, allow overlap
            horizontalPos = { left: itemRect.right + menuItemGap }
          } else {
            // More space on left - position left, allow overlap
            horizontalPos = { right: viewportWidth - itemRect.left + menuItemGap }
          }
        }
        
        // Ensure horizontal position stays within viewport bounds
        if (horizontalPos.left !== undefined) {
          // Ensure submenu doesn't go off right edge
          horizontalPos.left = Math.min(horizontalPos.left, viewportWidth - submenuWidth - edgePadding)
          // Can overlap left edge but ensure it's still usable
          if (horizontalPos.left < -submenuWidth + edgePadding) {
            horizontalPos.left = edgePadding
          }
        }
        if (horizontalPos.right !== undefined) {
          // Ensure submenu doesn't go off left edge
          const calculatedLeft = viewportWidth - horizontalPos.right - submenuWidth
          if (calculatedLeft < edgePadding) {
            horizontalPos.right = viewportWidth - edgePadding - submenuWidth
          }
          // Can overlap right edge but ensure it's still usable
          if (horizontalPos.right < edgePadding) {
            horizontalPos.right = edgePadding
          }
        }
        
        // Calculate vertical position - maximize visible content, allow overlap with header
        const spaceBelow = viewportHeight - itemRect.bottom
        const spaceAbove = itemRect.top
        
        let verticalPos: number
        
        // Strategy: Maximize visible content, prefer showing top items
        if (spaceBelow >= submenuMaxHeight + edgePadding) {
          // Full submenu fits below - align top with menu item top
          verticalPos = itemRect.top
        } else if (spaceAbove >= submenuMaxHeight + edgePadding) {
          // Full submenu fits above - align bottom with menu item bottom
          verticalPos = itemRect.bottom - submenuMaxHeight
        } else {
          // Not enough space in either direction - maximize visible content
          if (spaceBelow > spaceAbove) {
            // More space below - align top with menu item, constrain bottom to viewport
            verticalPos = itemRect.top
            // Ensure bottom doesn't go below viewport (with padding)
            const maxTop = viewportHeight - submenuMaxHeight - edgePadding
            verticalPos = Math.min(verticalPos, maxTop)
          } else {
            // More space above - align bottom with menu item, allow top to overlap header
            verticalPos = itemRect.bottom - submenuMaxHeight
            // Allow overlap with header (can go negative), but ensure it's scrollable
            // Minimum top position ensures at least some content is visible
            const minTop = -submenuMaxHeight + 50 // Allow overlap but show at least 50px
            verticalPos = Math.max(verticalPos, minTop)
          }
        }
        
        // Final constraint: ensure submenu is always usable
        // Allow overlap with header, but ensure bottom doesn't go below viewport
        const minTop = -submenuMaxHeight + 50 // Show at least 50px even if overlapping header
        const maxTop = viewportHeight - submenuMaxHeight - edgePadding
        verticalPos = Math.max(minTop, Math.min(verticalPos, maxTop))
        
        setSubmenuFixedPosition({
          top: verticalPos,
          ...horizontalPos
        })
      }
    } else {
      setSubmenuFixedPosition(null)
    }
  }, [submenuOpen])
  
  const handleOptionClick = (option: KebabMenuOption) => {
    if (option.submenu) {
      setSubmenuOpen(submenuOpen === option.id ? null : option.id)
    } else {
      if (option.onClick) {
        option.onClick()
      }
      onAction(option.id)
      setIsOpen(false)
      setSubmenuOpen(null)
      setMenuPosition(null)
      setSubmenuFixedPosition(null)
    }
  }
  
  const handleSubmenuClick = (parentId: string, option: KebabMenuOption) => {
    if (option.onClick) {
      option.onClick()
    }
    onAction(parentId, option.id)
    setIsOpen(false)
    setSubmenuOpen(null)
    setMenuPosition(null)
    setSubmenuFixedPosition(null)
  }
  
  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="text-gray-600 hover:text-gray-900 transition-colors p-1"
        title="More options"
      >
        <span className="text-base">⋮</span>
      </button>
      
      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-[180px]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          {options.map(option => (
            <div key={option.id} className="relative" data-option-id={option.id}>
              <button
                onClick={() => handleOptionClick(option)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {option.icon && <span>{option.icon}</span>}
                  {option.label}
                </span>
                {option.submenu && <span className="text-gray-400">›</span>}
              </button>
              
              {option.submenu && submenuOpen === option.id && submenuFixedPosition && (
                <div
                  ref={submenuRef}
                  className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[140px] max-h-[200px] overflow-y-auto z-[60]"
                  style={{
                    top: `${submenuFixedPosition.top}px`,
                    left: submenuFixedPosition.left !== undefined ? `${submenuFixedPosition.left}px` : undefined,
                    right: submenuFixedPosition.right !== undefined ? `${submenuFixedPosition.right}px` : undefined,
                  }}
                >
                  {option.submenu.map(subOption => (
                    <button
                      key={subOption.id}
                      onClick={() => handleSubmenuClick(option.id, subOption)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between whitespace-nowrap ${
                        currentDay !== undefined && currentDay === parseInt(subOption.id) ? 'font-medium' : ''
                      }`}
                    >
                      <span>{subOption.label}</span>
                      {currentDay !== undefined && currentDay === parseInt(subOption.id) && (
                        <span className="text-primary ml-2">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

