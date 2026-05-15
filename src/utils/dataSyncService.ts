/**
 * Data Synchronization Service
 * Handles saving draw data to local backend and remote server
 */

export interface SaveDrawsOptions {
  gameType: 'eurojackpot' | 'lotto'
  draws: any[]
  uploadToServer?: boolean
}

/**
 * Save draws to local backend
 */
export async function saveDrawsLocally(options: SaveDrawsOptions): Promise<any> {
  try {
    const response = await fetch('/api/save-draws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameType: options.gameType,
        draws: options.draws
      })
    })

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`)
    }

    const result = await response.json()
    console.log(`✓ Saved to local backend:`, result)
    return result
  } catch (error) {
    console.warn('Failed to save to local backend:', error)
    // Don't throw - fallback to browser download
    return null
  }
}

/**
 * Upload draws to remote server (PHP endpoint)
 */
export async function uploadDrawsToServer(options: SaveDrawsOptions): Promise<any> {
  try {
    const uploadEndpoint = import.meta.env.DEV ? '/api/save-draws' : '/lottery-statistics/api-upload-draws.php'

    // Use the PHP proxy to upload data
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameType: options.gameType,
        draws: options.draws,
        timestamp: new Date().toISOString(),
        source: 'web-app'
      })
    })

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`)
    }

    const result = await response.json()
    console.log(`✓ Uploaded to remote server:`, result)
    return result
  } catch (error) {
    console.warn('Failed to upload to remote server:', error)
    // Don't throw - this is optional
    return null
  }
}

/**
 * Get status of saved files
 */
export async function getDrawsStatus(): Promise<any> {
  try {
    const response = await fetch('/api/draws-status')
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.warn('Failed to get draws status:', error)
    return null
  }
}

/**
 * Comprehensive save function - saves locally and optionally to server
 */
export async function savDrawsComprehensive(options: SaveDrawsOptions): Promise<{
  local: any
  server: any
  success: boolean
}> {
  console.log(`\n🔄 Starting comprehensive save for ${options.gameType}...`)

  const results = {
    local: null,
    server: null,
    success: false
  }

  // Save locally first (most important)
  try {
    results.local = await saveDrawsLocally(options)
  } catch (error) {
    console.error('Local save failed:', error)
  }

  // Upload to server if requested
  if (options.uploadToServer) {
    try {
      results.server = await uploadDrawsToServer(options)
    } catch (error) {
      console.error('Server upload failed:', error)
    }
  }

  results.success = results.local !== null || results.server !== null

  if (results.success) {
    console.log(`✅ Save complete - Local: ${results.local ? 'OK' : 'FAIL'}, Server: ${results.server ? 'OK' : 'FAIL'}`)
  }

  return results
}
