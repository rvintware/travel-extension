import React from 'react'
import type { SavedCapture } from '../lib/types'
import { formatRelativeTime, truncateText, getDomain, getSourceEmoji } from '../lib/utils'
import { Button } from './Button'

interface CaptureCardProps {
  capture: SavedCapture
  onDelete: (id: string) => void
}

export function CaptureCard({ capture, onDelete }: CaptureCardProps) {
  const domain = getDomain(capture.url)
  const emoji = getSourceEmoji(capture.url)
  const displayText = truncateText(capture.text, 200)
  
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-card hover:shadow-card-hover transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base flex-1">
          {truncateText(capture.pageTitle, 60)}
        </h3>
      </div>
      
      {/* Captured text */}
      <p className="text-gray-700 text-sm mb-3 leading-relaxed whitespace-pre-wrap">
        {displayText}
      </p>
      
      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span>{domain}</span>
          <span>•</span>
          <span>{formatRelativeTime(capture.timestamp)}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
        <a
          href={capture.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-light rounded-md transition-colors"
        >
          🔗 View Source
        </a>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(capture.id)}
          className="flex-1"
        >
          🗑️ Delete
        </Button>
      </div>
    </div>
  )
}

