import React from 'react'

interface TimeEstimateProps {
  activityMinutes: number
  travelMinutes: number
}

export function TimeEstimate({ activityMinutes, travelMinutes }: TimeEstimateProps) {
  const totalMinutes = activityMinutes + travelMinutes
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60
  
  const activityHours = Math.floor(activityMinutes / 60)
  const activityMins = activityMinutes % 60
  
  const travelHours = Math.floor(travelMinutes / 60)
  const travelMins = travelMinutes % 60
  
  // Calculate comfort level
  const comfort = calculateComfort(totalMinutes)
  
  // Format time strings
  const formatTime = (hours: number, mins: number) => {
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mx-4 my-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">
            ⏱️ {formatTime(totalHours, totalMins)} total
          </div>
          <div className="text-xs text-gray-600">
            {formatTime(activityHours, activityMins)} activity
            {travelMinutes > 0 && ` + ${formatTime(travelHours, travelMins)} travel`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{comfort.emoji}</span>
          <span className="text-sm font-medium text-gray-700">{comfort.text}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Calculate comfort level based on total time
 */
function calculateComfort(totalMinutes: number): { emoji: string; text: string } {
  if (totalMinutes < 480) {
    return { emoji: '😊', text: 'Comfortable' }
  } else if (totalMinutes < 600) {
    return { emoji: '😅', text: 'Packed' }
  } else {
    return { emoji: '😰', text: 'Exhausting' }
  }
}

