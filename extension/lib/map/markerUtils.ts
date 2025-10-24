/**
 * Create a numbered marker for the map
 */
export function createNumberedMarker(
  map: google.maps.Map,
  position: { lat: number; lng: number },
  number: number,
  title: string,
  onClick?: () => void
): google.maps.Marker {
  const marker = new google.maps.Marker({
    position,
    map,
    title,
    label: {
      text: number.toString(),
      color: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 18,
      fillColor: '#3B82F6', // Primary blue
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 3,
    },
    animation: google.maps.Animation.DROP,
  })
  
  if (onClick) {
    marker.addListener('click', onClick)
  }
  
  return marker
}

/**
 * Create an info window for a location
 */
export function createInfoWindow(
  location: {
    name: string
    address?: string
    dayNumber?: number | null
    suggestedTime?: string | null
  }
): google.maps.InfoWindow {
  let content = `
    <div style="padding: 8px; max-width: 250px;">
      <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">
        ${location.name}
      </h3>
  `
  
  if (location.address) {
    content += `
      <p style="margin: 4px 0; font-size: 13px; color: #6B7280;">
        ${location.address}
      </p>
    `
  }
  
  if (location.dayNumber != null) {
    let timeStr = `Day ${location.dayNumber}`
    if (location.suggestedTime) {
      const time = new Date(`2000-01-01T${location.suggestedTime}`)
      timeStr += ` • ${time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    }
    content += `
      <p style="margin: 4px 0; font-size: 12px; color: #3B82F6; font-weight: 500;">
        📅 ${timeStr}
      </p>
    `
  }
  
  content += `</div>`
  
  return new google.maps.InfoWindow({
    content,
  })
}

/**
 * Clear all markers from the map
 */
export function clearMarkers(markers: google.maps.Marker[]) {
  markers.forEach(marker => marker.setMap(null))
}

/**
 * Get marker color based on day number
 */
export function getDayColor(dayNumber: number | null | undefined): string {
  if (dayNumber == null) return '#9CA3AF' // Gray for unscheduled
  
  const colors = [
    '#3B82F6', // Blue - Day 1
    '#A855F7', // Purple - Day 2
    '#EC4899', // Pink - Day 3
    '#14B8A6', // Teal - Day 4
    '#F59E0B', // Amber - Day 5
    '#10B981', // Green - Day 6
    '#EF4444', // Red - Day 7
  ]
  
  return colors[(dayNumber - 1) % colors.length]
}

/**
 * Update marker color based on day
 */
export function updateMarkerColor(
  marker: google.maps.Marker,
  dayNumber: number | null | undefined
) {
  const color = getDayColor(dayNumber)
  
  marker.setIcon({
    path: google.maps.SymbolPath.CIRCLE,
    scale: 18,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 3,
  })
}

