// Date calculation helpers for trip planning

/**
 * Calculate the duration between two dates (inclusive)
 * @param startDate - Trip start date
 * @param endDate - Trip end date
 * @returns Number of days (including both start and end day)
 * 
 * Example: Nov 1 to Nov 5 = 5 days (1, 2, 3, 4, 5)
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  // Normalize both dates to midnight to avoid timezone and time-of-day issues
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // +1 for inclusive count (Nov 1 to Nov 5 = 5 days)
}

/**
 * Calculate end date from start date and duration
 * @param startDate - Trip start date
 * @param duration - Number of days
 * @returns Calculated end date
 */
export function calculateEndDate(startDate: Date, duration: number): Date {
  const end = new Date(startDate)
  end.setDate(end.getDate() + duration - 1)
  return end
}

/**
 * Calculate start date from end date and duration
 * @param endDate - Trip end date
 * @param duration - Number of days
 * @returns Calculated start date
 */
export function calculateStartDate(endDate: Date, duration: number): Date {
  const start = new Date(endDate)
  start.setDate(start.getDate() - duration + 1)
  return start
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) // Returns DD/MM/YYYY
}

/**
 * Format date for API (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO date string
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
}

