/**
 * Trip Export Formatter
 * Transforms database trip data into structured, copy-paste friendly text
 */

interface TipObject {
  text: string
  source: string
  confidence: number
  review_rating?: number
}

interface LocationData {
  name: string
  address: string | null
  category: string | null
  subcategory: string | null
  user_rating: number | null
  price_level: number | null
  tips: TipObject[]
  sources: string[] | null
  source_url: string
  user_notes: string | null
}

interface TripLocationData {
  day_number: number | null
  display_order: number
  suggested_time: string | null
  estimated_duration_minutes: number | null
  notes: string | null
  location: LocationData
}

interface TripExportData {
  name: string
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  trip_locations: TripLocationData[]
}

/**
 * Main export function
 * Transforms trip data into formatted text file
 */
export function formatTripExport(tripData: TripExportData): {
  text: string
  filename: string
} {
  const lines: string[] = []
  
  // Header
  lines.push(formatHeader(tripData.name))
  lines.push('')
  lines.push(formatDateRange(tripData.start_date, tripData.end_date, tripData.duration_days))
  lines.push('')
  lines.push(makeThickDivider())
  lines.push('')
  lines.push('')
  
  // Group locations by day
  const locationsByDay = groupByDay(tripData.trip_locations)
  const scheduledDays = Object.keys(locationsByDay)
    .filter(day => day !== 'unscheduled')
    .map(Number)
    .sort((a, b) => a - b)
  
  // Scheduled days
  scheduledDays.forEach(dayNum => {
    const dayLocations = locationsByDay[dayNum]
    const dayDate = calculateDayDate(tripData.start_date, dayNum)
    
    lines.push(formatDayHeader(dayNum, dayDate))
    lines.push(makeThinDivider())
    lines.push('')
    
    dayLocations.forEach(tripLocation => {
      lines.push(formatLocation(tripLocation.location, {
        suggested_time: tripLocation.suggested_time,
        estimated_duration_minutes: tripLocation.estimated_duration_minutes,
        notes: tripLocation.notes
      }))
      lines.push('')
      lines.push('')
    })
  })
  
  // Unscheduled section
  if (locationsByDay.unscheduled && locationsByDay.unscheduled.length > 0) {
    lines.push('UNSCHEDULED')
    lines.push(makeThinDivider())
    lines.push('')
    
    locationsByDay.unscheduled.forEach(tripLocation => {
      lines.push(formatLocation(tripLocation.location, {
        suggested_time: tripLocation.suggested_time,
        estimated_duration_minutes: tripLocation.estimated_duration_minutes,
        notes: tripLocation.notes
      }))
      lines.push('')
      lines.push('')
    })
  }
  
  // Summary
  lines.push(makeThickDivider())
  lines.push('')
  lines.push('TRIP SUMMARY')
  lines.push('')
  
  const scheduledCount = tripData.trip_locations.filter(tl => tl.day_number !== null).length
  const unscheduledCount = tripData.trip_locations.filter(tl => tl.day_number === null).length
  
  lines.push(`Total Locations: ${tripData.trip_locations.length}`)
  lines.push(`Scheduled: ${scheduledCount} locations`)
  lines.push(`Unscheduled: ${unscheduledCount} locations`)
  lines.push('')
  lines.push(`Exported: ${formatTimestamp(new Date())}`)
  lines.push('')
  lines.push(makeThickDivider())
  
  return {
    text: lines.join('\n'),
    filename: sanitizeFilename(tripData.name)
  }
}

/**
 * Group locations by day number
 */
function groupByDay(tripLocations: TripLocationData[]): Record<string | number, TripLocationData[]> {
  const groups: Record<string | number, TripLocationData[]> = {}
  
  tripLocations.forEach(tl => {
    const key = tl.day_number === null ? 'unscheduled' : tl.day_number
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(tl)
  })
  
  return groups
}

/**
 * Calculate date for a specific day number
 */
function calculateDayDate(startDate: string | null, dayNum: number): string | null {
  if (!startDate) return null
  
  const date = new Date(startDate)
  date.setDate(date.getDate() + (dayNum - 1)) // Day 1 = start date
  
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

/**
 * Format location block
 */
function formatLocation(
  location: LocationData,
  tripData: {
    suggested_time: string | null
    estimated_duration_minutes: number | null
    notes: string | null
  }
): string {
  const lines: string[] = []
  
  // Name
  lines.push(`▸ ${location.name}`)
  
  // Address
  if (location.address) {
    lines.push(`  📍 ${location.address}`)
  }
  
  // Category line
  const categoryLine = formatCategory(
    location.category,
    location.subcategory,
    location.price_level,
    location.user_rating
  )
  if (categoryLine) {
    lines.push(`  ${categoryLine}`)
  }
  
  // Time (trip-specific)
  if (tripData.suggested_time) {
    const time = formatTime(tripData.suggested_time)
    const duration = tripData.estimated_duration_minutes
      ? ` ${formatDuration(tripData.estimated_duration_minutes)}`
      : ''
    lines.push(`  🕐 ${time}${duration}`)
  }
  
  lines.push('') // Blank line after metadata
  
  // Tips
  if (location.tips && location.tips.length > 0) {
    lines.push('  Tips:')
    location.tips.forEach(tip => {
      lines.push(`  • ${tip.text}`)
    })
    lines.push('') // Blank line after tips
  }
  
  // Trip Notes (trip-specific)
  if (tripData.notes) {
    lines.push(`  Trip Notes: ${tripData.notes}`)
    lines.push('') // Blank line
  }
  
  // User Notes (global)
  if (location.user_notes) {
    lines.push(`  Notes: ${location.user_notes}`)
    lines.push('') // Blank line
  }
  
  // Sources
  const sources = location.sources && location.sources.length > 0
    ? location.sources
    : [location.source_url]
  
  if (sources && sources.length > 0) {
    lines.push('  Sources:')
    sources.forEach(url => {
      lines.push(`  → ${url}`)
    })
  }
  
  return lines.join('\n')
}

/**
 * Format date string
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time (24h → 12h)
 */
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Format duration in minutes
 */
function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = minutes / 60
    if (hours % 1 === 0) {
      return `(${hours} hours)`
    }
    return `(${hours.toFixed(1)} hours)`
  }
  return `(${minutes} min)`
}

/**
 * Format date range
 */
function formatDateRange(
  start: string | null,
  end: string | null,
  days: number | null
): string {
  if (!start || !end) return 'Dates not set'
  
  const daysText = days ? ` (${days} days)` : ''
  return `${formatDate(start)} - ${formatDate(end)}${daysText}`
}

/**
 * Format price level
 */
function formatPriceLevel(level: number): string {
  return '$'.repeat(level)
}

/**
 * Format category line
 */
function formatCategory(
  category: string | null,
  subcategory: string | null,
  priceLevel: number | null,
  rating: number | null
): string {
  const parts: string[] = []
  
  if (category) {
    parts.push(category.charAt(0).toUpperCase() + category.slice(1))
    if (subcategory) {
      parts.push(subcategory.charAt(0).toUpperCase() + subcategory.slice(1))
    }
  }
  
  if (priceLevel) {
    parts.push(formatPriceLevel(priceLevel))
  }
  
  if (rating) {
    parts.push(`⭐ ${rating.toFixed(1)}`)
  }
  
  return parts.length > 0 ? `🏷 ${parts.join(' · ')}` : ''
}

/**
 * Format header with trip name
 */
function formatHeader(tripName: string): string {
  const divider = makeThickDivider()
  return `${divider}\n${tripName.toUpperCase()}\n${divider}`
}

/**
 * Format day header
 */
function formatDayHeader(dayNum: number, date: string | null): string {
  if (date) {
    return `DAY ${dayNum} - ${date}`
  }
  return `DAY ${dayNum}`
}

/**
 * Make thick divider line
 */
function makeThickDivider(): string {
  return '━'.repeat(60)
}

/**
 * Make thin divider line
 */
function makeThinDivider(): string {
  return '─'.repeat(60)
}

/**
 * Format current timestamp
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Sanitize trip name for filename
 */
function sanitizeFilename(tripName: string): string {
  const today = new Date().toISOString().split('T')[0] // "2024-11-03"
  
  const sanitized = tripName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphen
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    .substring(0, 50)               // Max 50 chars
  
  return `${sanitized}-export-${today}.txt`
}

