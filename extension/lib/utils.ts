/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Extract domain from URL
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Check if URL is a Reddit post
 */
export function isRedditUrl(url: string): boolean {
  return url.includes('reddit.com')
}

/**
 * Get a nice emoji for the source website
 */
export function getSourceEmoji(url: string): string {
  if (url.includes('reddit.com')) return '🔴'
  if (url.includes('twitter.com') || url.includes('x.com')) return '🐦'
  if (url.includes('instagram.com')) return '📷'
  if (url.includes('youtube.com')) return '▶️'
  if (url.includes('medium.com')) return '📝'
  if (url.includes('github.com')) return '💻'
  return '🌐'
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Mask API key for display
 * Shows first 9 chars + last 3 chars
 * Example: "sk-proj-abc...xyz"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '****'
  return `${key.substring(0, 9)}****${key.substring(key.length - 3)}`
}

