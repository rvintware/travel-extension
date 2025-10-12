import React from 'react'
import type { Country } from '../lib/types'

interface CountryCardProps {
  country: Country
  locationCount: number
  onClick: () => void
}

export function CountryCard({ country, locationCount, onClick }: CountryCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-300 rounded-lg p-4 hover:shadow-card-hover hover:border-primary transition-all duration-200 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{country.emoji || '🌐'}</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-xl">{country.name}</h3>
            <p className="text-sm text-gray-600">
              {locationCount} {locationCount === 1 ? 'location' : 'locations'}
            </p>
          </div>
        </div>
        <span className="text-gray-400">›</span>
      </div>
    </button>
  )
}

