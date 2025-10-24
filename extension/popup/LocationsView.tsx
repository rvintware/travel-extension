import React from 'react'
import type { Country, Location } from '../lib/types'
import { CountryCard } from '../components/CountryCard'

interface LocationsViewProps {
  countries: Country[]
  locationsByCountry: Record<string, number>  // countryId -> count
  onCountryClick: (country: Country) => void
}

export function LocationsView({ countries, locationsByCountry, onCountryClick }: LocationsViewProps) {
  // Filter countries that have locations
  const countriesWithLocations = countries
    .map(country => ({
      country,
      count: locationsByCountry[country.id] || 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count) // Sort by count descending
  
  const totalLocations = Object.values(locationsByCountry).reduce((sum, count) => sum + count, 0)
  
  if (countriesWithLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No locations yet
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-xs">
          Start saving by highlighting text on any webpage and right-clicking!
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-xs border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Try it on Reddit or a travel blog:
          </p>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Highlight a recommendation</li>
            <li>2. Right-click</li>
            <li>3. Choose where to save</li>
          </ol>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">📚 Location Library</h2>
        <p className="text-sm text-gray-600">
          {totalLocations} {totalLocations === 1 ? 'location' : 'locations'} across {countriesWithLocations.length} {countriesWithLocations.length === 1 ? 'country' : 'countries'}
        </p>
      </div>
      
      {/* Country List */}
      <div className="space-y-6">
        {countriesWithLocations.map(({ country, count }) => (
          <CountryCard
            key={country.id}
            country={country}
            locationCount={count}
            onClick={() => onCountryClick(country)}
          />
        ))}
      </div>
      
      {/* Tip */}
      <div className="pt-2 text-center text-xs text-gray-500">
        💡 Click a country to view locations
      </div>
    </div>
  )
}

