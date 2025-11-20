import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

interface NotesEditorModalProps {
  isOpen: boolean
  initialNotes: string
  onSave: (notes: string) => void
  onClose: () => void
}

export function NotesEditorModal({ isOpen, initialNotes, onSave, onClose }: NotesEditorModalProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes || '')
    }
  }, [isOpen, initialNotes])
  
  if (!isOpen) return null
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(notes)
      onClose()
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setSaving(false)
    }
  }
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Notes
        </h2>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add trip-specific notes for this location..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={6}
          autoFocus
        />
        
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

