/**
 * Lotto API Service - Official Lotto.pl API
 * Fetches Lotto draw results from official Lotto.pl API
 * API Documentation: https://developers.lotto.pl/
 */

// Temporary API key - replace with actual key when access is granted
const LOTTO_API_KEY = 'uoMovQFLDrUEI7jsq2t3yg4myNqNgsUI0Cj7UWdnT9I='

// Use proxy in development and production to avoid CORS issues
// Development: Vite proxy (/api)
// Production: PHP proxy on your server
const BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : 'https://developers.lotto.pl/api/open/v1'

// PHP proxy URL for production (bypasses CORS)
const PROXY_URL = '/lottery-statistics/api-proxy.php'

// Server storage endpoints (shared JSON files in /lottery-statistics)
const READ_DRAWS_ENDPOINT = import.meta.env.DEV ? '/api/draws' : '/lottery-statistics/api-draws.php'
const SAVE_DRAWS_ENDPOINT = import.meta.env.DEV ? '/api/save-draws' : '/lottery-statistics/api-upload-draws.php'

// Rate limiting: delay between requests to avoid 429 errors
const REQUEST_DELAY_MS = 500 // 500ms between requests

// LocalStorage cache key
const CACHE_KEY = 'lotto_draws_cache'
const CACHE_VERSION = 'v1' // Increment this to invalidate old cache

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get cached draw from localStorage by date
 */
function getCachedDraw(dateStr: string): LottoDraw | null {
  try {
    const cacheKey = `${CACHE_KEY}_${CACHE_VERSION}_${dateStr}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached) as LottoDraw
    }
  } catch (error) {
    console.warn('Error reading from cache:', error)
  }
  return null
}

/**
 * Save draw to localStorage
 */
function saveCachedDraw(dateStr: string, draw: LottoDraw): void {
  try {
    const cacheKey = `${CACHE_KEY}_${CACHE_VERSION}_${dateStr}`
    localStorage.setItem(cacheKey, JSON.stringify(draw))
  } catch (error) {
    console.warn('Error saving to cache:', error)
  }
}

/**
 * Check if a draw is incomplete (missing numbers)
 */
function isDrawIncomplete(draw: LottoDraw): boolean {
  return !draw.numbers || draw.numbers.length === 0
}

/**
 * Get all cached draws from localStorage
 */
export function getAllCachedDraws(): LottoDraw[] {
  const draws: LottoDraw[] = []
  try {
    const prefix = `${CACHE_KEY}_${CACHE_VERSION}_`
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const cached = localStorage.getItem(key)
        if (cached) {
          draws.push(JSON.parse(cached))
        }
      }
    }
  } catch (error) {
    console.warn('Error reading all cached draws:', error)
  }
  return sortAndDeduplicate(draws)
}

/**
 * Get dates of incomplete draws from cache
 */
export function getIncompleteCachedDates(): string[] {
  const incompleteDates: string[] = []
  try {
    const prefix = `${CACHE_KEY}_${CACHE_VERSION}_`
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const cached = localStorage.getItem(key)
        if (cached) {
          const draw = JSON.parse(cached) as LottoDraw
          if (isDrawIncomplete(draw)) {
            // Extract date from cache key
            const dateStr = key.replace(prefix, '')
            incompleteDates.push(dateStr)
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error reading incomplete draws:', error)
  }
  return incompleteDates
}

/**
 * Clear all cached draws from localStorage
 */
export function clearDrawsCache(): void {
  try {
    const prefix = `${CACHE_KEY}_${CACHE_VERSION}_`
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keysToRemove.length} cached draws`)
  } catch (error) {
    console.warn('Error clearing cache:', error)
  }
}

/**
 * Export all cached draws to JSON format
 * Returns JSON string of all historical draws stored in localStorage
 */
export function exportDrawsToJson(): string {
  const draws = getAllCachedDraws()
  return JSON.stringify(draws, null, 2)
}

/**
 * Download all cached draws as a JSON file
 * Creates a downloadable file with all historical data from localStorage
 * Always uses the same filename for easy replacement in src/data folder
 */
export function downloadDrawsAsJson(): void {
  try {
    const jsonData = exportDrawsToJson()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lotto_draws.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    console.log('Historical draws exported to lotto_draws.json - save to src/data/ folder')
  } catch (error) {
    console.error('Error exporting draws:', error)
  }
}

/**
 * Save all draws to local backend and optionally to remote server
 * This is the new comprehensive save function
 */
type PersistableLottoDraw = Omit<Partial<LottoDraw>, 'jackpotAmount' | 'drawSystemId'> & {
  drawDate: string
  numbers: number[]
  drawSystemId?: number
  jackpot?: string
  jackpotAmount?: number | string
}

export async function saveDrawsToBackend(uploadToServer: boolean = false, drawsToSave?: PersistableLottoDraw[]): Promise<any> {
  try {
    const normalizedDraws = drawsToSave?.map(draw => ({
      ...draw,
      drawSystemId: typeof draw.drawSystemId === 'number' ? draw.drawSystemId : 0,
      jackpotAmount: typeof draw.jackpotAmount === 'string' ? Number(draw.jackpotAmount) : draw.jackpotAmount
    })) as LottoDraw[] | undefined

    const draws = drawsToSave && drawsToSave.length > 0
      ? sortAndDeduplicate(normalizedDraws ?? [])
      : getAllCachedDraws()
    
    if (draws.length === 0) {
      console.warn('No draws to save')
      return null
    }

    console.log(`📤 Saving ${draws.length} Lotto draws...`)
    const shouldUploadToServer = uploadToServer || !import.meta.env.DEV

    const response = await fetch(SAVE_DRAWS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameType: 'lotto',
        draws: draws,
        uploadToServer: shouldUploadToServer,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ Successfully saved to backend:`, result)
    return result
  } catch (error) {
    console.error('Error saving draws to backend:', error)
    // Fallback to browser download
    console.log('Falling back to browser download...')
    downloadDrawsAsJson()
    return null
  }
}

/**
 * Load saved draws from server-side JSON and hydrate local cache.
 * Used at app startup to render data quickly before API refresh.
 */
export async function fetchSavedDrawsFromServer(): Promise<{ draws: LottoDraw[]; lastFetchedAt: string | null }> {
  try {
    const response = await fetch(`${READ_DRAWS_ENDPOINT}?gameType=lotto`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return { draws: [], lastFetchedAt: null }
    }

    const data = await response.json()
    const draws = Array.isArray(data) ? data : Array.isArray(data?.draws) ? data.draws : []
    const lastFetchedAt = typeof data?.meta?.lastFetchedAt === 'string'
      ? data.meta.lastFetchedAt
      : typeof data?.lastFetchedAt === 'string'
        ? data.lastFetchedAt
        : null

    if (!Array.isArray(draws)) {
      return { draws: [], lastFetchedAt }
    }

    const normalizedDraws = sortAndDeduplicate(draws as LottoDraw[])
    hydrateLocalCache(normalizedDraws)
    return { draws: normalizedDraws, lastFetchedAt }
  } catch (error) {
    console.warn('Error loading saved Lotto draws from server:', error)
    return { draws: [], lastFetchedAt: null }
  }
}

export interface LottoDraw {
  drawDate: string
  drawSystemId: number
  numbers: number[]
  jackpot?: string
  jackpotAmount?: number
}

interface LottoApiDrawResult {
  drawSystemId: number
  drawDate: string
  gameType: string
  results: Array<{
    drawDate: string
    drawSystemId: number
    gameType: string
    resultsJson: number[]
  }>
}

/**
 * Generates all Lotto draw dates from 2017 to current date
 * Lotto draws are held on Tuesday, Thursday and Saturday
 * Excludes current day if time is before 23:00 (results not yet available)
 */
function generateAllDrawDates(startFromDate?: string | Date): Date[] {
  const drawDates: Date[] = []
  const startDate = startFromDate ? new Date(startFromDate) : new Date('2017-01-03') // First Tuesday of 2017
  const now = new Date()
  
  // Determine end date: exclude today if before 23:00
  let endDate: Date
  const currentHour = now.getHours()
  if (currentHour < 23) {
    // Before 23:00 - exclude today
    endDate = new Date(now)
    endDate.setDate(endDate.getDate() - 1) // Use yesterday as end date
  } else {
    // After 23:00 - include today
    endDate = now
  }
  
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    
    // Check if it's Tuesday (2), Thursday (4) or Saturday (6)
    if (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6) {
      drawDates.push(new Date(currentDate))
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log(`Generated ${drawDates.length} potential draw dates from 2017 to ${endDate.toISOString().split('T')[0]} (current time: ${now.toLocaleTimeString()})`)
  return drawDates
}

/**
 * Fetches all Lotto historical draw results from official Lotto.pl API
 * Uses date-specific approach to retrieve complete history
 * Implements localStorage caching to reduce API calls
 * @param refetchIncompleteDatesOnly - If true, only refetch dates with missing draw numbers
 */
export async function fetchLottoResults(refetchIncompleteDatesOnly: boolean = false, startFromDate?: string | Date): Promise<LottoDraw[]> {
  console.log('Fetching Lotto results from official Lotto.pl API...')
  
  // Get incomplete dates if selective refetch is requested
  let incompleteDatesSet = new Set<string>()
  if (refetchIncompleteDatesOnly) {
    const incompleteDates = getIncompleteCachedDates()
    if (incompleteDates.length > 0) {
      console.log(`Strategy: Refetching only ${incompleteDates.length} dates with missing draw numbers`)
      incompleteDatesSet = new Set(incompleteDates)
    } else {
      console.log('No incomplete dates found in cache, skipping refetch')
      return getAllCachedDraws()
    }
  } else if (startFromDate) {
    console.log(`Strategy: Fetch only Lotto draws from ${new Date(startFromDate).toISOString().split('T')[0]} to current`)
  } else {
    console.log('Strategy: Fetch by specific draw dates (2017 to current) with localStorage caching')
  }

  try {
    const allDrawDates = generateAllDrawDates(startFromDate)
    const allDraws: LottoDraw[] = []
    let successCount = 0
    let errorCount = 0
    let cachedCount = 0
    let apiCallCount = 0
    
    console.log(`Starting to fetch ${allDrawDates.length} draw dates...`)
    
    // Process dates in reverse order (newest first)
    for (let i = allDrawDates.length - 1; i >= 0; i--) {
      const drawDate = allDrawDates[i]
      const dateStr = drawDate.toISOString().split('T')[0]
      
      if ((allDrawDates.length - i) % 50 === 0) {
        console.log(`Progress: ${allDrawDates.length - i}/${allDrawDates.length} dates processed (${cachedCount} from cache, ${apiCallCount} from API)...`)
      }
      
      // Check cache first
      const cachedDraw = getCachedDraw(dateStr)
      
      // If selective refetch mode, skip dates not in incomplete list
      if (refetchIncompleteDatesOnly && !incompleteDatesSet.has(dateStr)) {
        if (cachedDraw) {
          allDraws.push(cachedDraw)
          cachedCount++
        }
        continue
      }
      
      // Use cached draw if it exists and has complete data
      if (cachedDraw && !isDrawIncomplete(cachedDraw)) {
        allDraws.push(cachedDraw)
        cachedCount++
        continue
      }
      
      // Not in cache or incomplete, fetch from API
      if (cachedDraw && isDrawIncomplete(cachedDraw)) {
        console.log(`Refetching incomplete draw for date ${dateStr}...`)
      }
      
      try {
        const draw = await fetchLottoBySpecificDate(drawDate)
        apiCallCount++
        
        if (draw) {
          allDraws.push(draw)
          successCount++
          // Save to cache
          saveCachedDraw(dateStr, draw)
        }
        
        // Rate limiting: delay between requests
        await delay(REQUEST_DELAY_MS)
        
      } catch (error: any) {
        if (error.message?.includes('429')) {
          console.warn(`Rate limited at date ${dateStr}, already waited 10 seconds, will retry...`)
          // Retry this date
          i++
          continue
        } else if (error.message?.includes('404') || error.message?.includes('No draw')) {
          // No draw on this date - this is expected for some dates
          // Silent skip
        } else {
          console.warn(`Error fetching date ${dateStr}:`, error.message)
          errorCount++
        }
      }
    }
    
    console.log(`✓ Successfully retrieved ${successCount + cachedCount} draws (${cachedCount} from cache, ${apiCallCount} API calls, ${errorCount} errors)`)
    return sortAndDeduplicate(allDraws)

  } catch (error: any) {
    console.error('Error fetching from Lotto.pl API:', error)
    throw new Error(`Failed to fetch Lotto data: ${error.message}`)
  }
}

/**
 * Fetches Lotto result for a specific date
 * Returns null if no draw exists on that date
 */
async function fetchLottoBySpecificDate(drawDate: Date): Promise<LottoDraw | null> {
  const params = new URLSearchParams({
    gameType: 'Lotto',
    drawDate: drawDate.toISOString(),
    index: '1',
    size: '1',
    sort: 'drawDate',
    order: 'DESC'
  })

  // In production, use PHP proxy to avoid CORS
  let url: string
  let headers: HeadersInit
  
  if (import.meta.env.DEV) {
    // Development: use Vite proxy
    url = `${BASE_URL}/lotteries/draw-results/by-date-per-game?${params}`
    headers = {
      'Accept': 'application/json',
      'secret': LOTTO_API_KEY
    }
  } else {
    // Production: use PHP proxy
    const endpoint = `lotteries/draw-results/by-date-per-game?${params}`
    url = `${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`
    headers = {
      'Accept': 'application/json'
    }
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    if (response.status === 404) {
      // No draw on this date
      return null
    }
    if (response.status === 429) {
      // Rate limited - wait 10 seconds before retrying
      console.warn('Rate limited (429), waiting 10 seconds before retry...')
      await delay(60001)
      throw new Error('429')
    }
    throw new Error(`API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Handle paginated response structure
  const items = data.items || data.results || (Array.isArray(data) ? data : [])
  
  if (items.length === 0) {
    return null
  }
  
  // Verify the returned draw matches our requested date (same day)
  const returnedDraw = items[0] as LottoApiDrawResult
  const returnedDate = new Date(returnedDraw.drawDate)
  const requestedDate = new Date(drawDate)
  
  // Compare dates (ignore time)
  if (
    returnedDate.getFullYear() === requestedDate.getFullYear() &&
    returnedDate.getMonth() === requestedDate.getMonth() &&
    returnedDate.getDate() === requestedDate.getDate()
  ) {
    return parseDrawResult(returnedDraw)
  }
  
  return null
}

/**
 * Helper function to sort and remove duplicates
 */
function sortAndDeduplicate(draws: LottoDraw[]): LottoDraw[] {
  // Remove duplicates based on drawSystemId
  const uniqueDraws = draws.filter((draw, index, self) =>
    index === self.findIndex(d => d.drawSystemId === draw.drawSystemId)
  )
  
  // Sort by date descending (newest first)
  uniqueDraws.sort((a, b) => {
    return new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
  })
  
  console.log(`  Deduplicated: ${draws.length} → ${uniqueDraws.length} unique draws`)
  return uniqueDraws
}

function hydrateLocalCache(draws: LottoDraw[]): void {
  for (const draw of draws) {
    const cacheDate = getCacheDate(draw.drawDate, draw.drawSystemId)
    saveCachedDraw(cacheDate, draw)
  }
}

function getCacheDate(drawDate: string, drawSystemId: number): string {
  const parsed = new Date(drawDate)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  // Fallback keeps entry accessible even for legacy/non-ISO date formats.
  return `draw_${drawSystemId}`
}

/**
 * Parse individual draw result from Lotto.pl API response
 */
function parseDrawResult(draw: LottoApiDrawResult): LottoDraw {
  let mainNumbers: number[] = []

  // Extract numbers from results array
  if (Array.isArray(draw.results) && draw.results.length > 0) {
    const result = draw.results[0]
    
    // Get main numbers from resultsJson
    if (Array.isArray(result.resultsJson)) {
      mainNumbers = [...result.resultsJson]
    }
  } else {
    console.warn(`Draw ${draw.drawSystemId} has no results array`)
  }

  return {
    drawSystemId: draw.drawSystemId,
    drawDate: formatDrawDate(draw.drawDate),
    numbers: mainNumbers
  }
}

/**
 * Converts ISO date string to a readable format
 */
function formatDrawDate(dateText: string): string {
  if (!dateText) return ''
  
  try {
    const date = new Date(dateText)
    
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  } catch (error) {
    console.warn('Error parsing date:', dateText)
  }
  
  return dateText
}
