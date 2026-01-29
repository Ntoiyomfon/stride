/**
 * Device ID management for stable session tracking
 */

const DEVICE_ID_KEY = 'stride-device-id'

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Get or create a persistent device ID
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a temporary ID
    return 'server_' + Date.now().toString(36)
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    
    return deviceId
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available, using session-based device ID')
    let deviceId = sessionStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = generateDeviceId()
      try {
        sessionStorage.setItem(DEVICE_ID_KEY, deviceId)
      } catch (e) {
        // If even sessionStorage fails, just return a temporary ID
        console.warn('sessionStorage not available, using temporary device ID')
      }
    }
    
    return deviceId
  }
}

/**
 * Clear the device ID (for testing or logout)
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(DEVICE_ID_KEY)
    sessionStorage.removeItem(DEVICE_ID_KEY)
  } catch (error) {
    console.warn('Failed to clear device ID:', error)
  }
}