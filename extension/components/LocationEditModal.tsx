import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { LocationWithTripData, TipObject } from '../lib/types'
import { Button } from './Button'

interface LocationEditModalProps {
  isOpen: boolean
  location: LocationWithTripData
  tripLocationId?: string
  onSave: (updates: { name?: string; tips?: TipObject[] }, tripNotes?: string) => void
  onClose: () => void
}

export function LocationEditModal({ isOpen, location, tripLocationId, onSave, onClose }: LocationEditModalProps) {
  const [name, setName] = useState(location.name)
  const [tips, setTips] = useState<TipObject[]>(Array.isArray(location.tips) ? location.tips : [])
  const [tripNotes, setTripNotes] = useState<string>('')
  const [newTipText, setNewTipText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddTipInput, setShowAddTipInput] = useState(false)

  // Load trip-specific notes if available
  useEffect(() => {
    if (isOpen && tripLocationId) {
      // Notes are stored in location.tripNotes for LocationWithTripData
      setTripNotes(location.tripNotes || '')
    }
  }, [isOpen, tripLocationId, location.tripNotes])

  useEffect(() => {
    if (isOpen) {
      setName(location.name)
      setTips(Array.isArray(location.tips) ? location.tips : [])
      setNewTipText('')
      setShowAddTipInput(false)
    }
  }, [isOpen, location])

  if (!isOpen) return null

  function handleAddTip() {
    if (newTipText.trim()) {
      const newTip: TipObject = {
        text: newTipText.trim(),
        source: 'user',
        confidence: 1.0,
      }
      setTips([...tips, newTip])
      setNewTipText('')
      setShowAddTipInput(false)
    }
  }

  function handleRemoveTip(index: number) {
    setTips(tips.filter((_, i) => i !== index))
  }

  function getSourceBadge(source: TipObject['source']) {
    const badges = {
      highlight: '📝',
      context: '📄',
      page: '🌐',
      google_reviews: '⭐',
      user: '✏️',
    }
    return badges[source] || '💡'
  }

  function getSourceLabel(source: TipObject['source']) {
    const labels = {
      highlight: 'Highlighted',
      context: 'Context',
      page: 'Page',
      google_reviews: 'Google Reviews',
      user: 'Your Tip',
    }
    return labels[source] || 'Unknown'
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates: { name?: string; tips?: TipObject[] } = {}
      
      // Only include changed fields
      if (name !== location.name) {
        updates.name = name
      }
      if (JSON.stringify(tips) !== JSON.stringify(location.tips)) {
        updates.tips = tips
      }

      await onSave(updates, tripLocationId ? tripNotes : undefined)
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
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
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Location
        </h2>

        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Location name"
          />
        </div>

        {/* Tips Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💡 Tips
          </label>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-sm mt-1">{getSourceBadge(tip.source)}</span>
                <div className="flex-1">
                  <div className="text-sm text-gray-700">{tip.text}</div>
                  <div className="text-xs text-gray-500 mt-1">{getSourceLabel(tip.source)}</div>
                </div>
                <button
                  onClick={() => handleRemoveTip(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                  aria-label="Remove tip"
                >
                  ✕
                </button>
              </div>
            ))}
            
            {showAddTipInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTipText}
                  onChange={(e) => setNewTipText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTip()
                    } else if (e.key === 'Escape') {
                      setShowAddTipInput(false)
                      setNewTipText('')
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Enter tip text..."
                  autoFocus
                />
                <Button
                  onClick={handleAddTip}
                  variant="primary"
                  size="sm"
                  disabled={!newTipText.trim()}
                >
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setShowAddTipInput(false)
                    setNewTipText('')
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTipInput(true)}
                className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                + Add Tip
              </button>
            )}
          </div>
        </div>

        {/* Trip-specific Notes */}
        {tripLocationId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notes (Trip-specific)
            </label>
            <textarea
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              placeholder="Add trip-specific notes for this location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
            />
          </div>
        )}

        {/* Buttons */}
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
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

