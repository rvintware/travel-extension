import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'info' | 'error'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
    
    // Auto-dismiss
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 200) // Wait for fade out animation
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const bgColor = type === 'success' 
    ? 'bg-green-500' 
    : type === 'info' 
    ? 'bg-orange-500' 
    : 'bg-red-500'
  
  return createPortal(
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} transition-all duration-200 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ minWidth: '200px', maxWidth: '320px' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 200)
          }}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  )
}

// Toast manager hook
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }
  
  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null
  
  return { showToast, ToastComponent }
}

