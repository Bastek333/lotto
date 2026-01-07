/**
 * EuroJackpot API Service - Official Lotto.pl API
 * Fetches EuroJackpot draw results from official Lotto.pl API
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
const PROXY_URL = '/api-proxy.php'

// Rate limiting: delay between requests to avoid 429 errors
const REQUEST_DELAY_MS = 500 // 500ms between requests

// LocalStorage cache key
const CACHE_KEY = 'eurojackpot_draws_cache'
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
function getCachedDraw(dateStr: string): EuroJackpotDraw | null {
  try {
    const cacheKey = `${CACHE_KEY}_${CACHE_VERSION}_${dateStr}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached) as EuroJackpotDraw
    }
  } catch (error) {
    console.warn('Error reading from cache:', error)
  }
  return null
}

/**
 * Save draw to localStorage
 */
function saveCachedDraw(dateStr: string, draw: EuroJackpotDraw): void {
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
function isDrawIncomplete(draw: EuroJackpotDraw): boolean {
  return !draw.numbers || draw.numbers.length === 0 || !draw.euroNumbers || draw.euroNumbers.length === 0
}

/**
 * Get all cached draws from localStorage
 */
export function getAllCachedDraws(): EuroJackpotDraw[] {
  const draws: EuroJackpotDraw[] = []
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
          const draw = JSON.parse(cached) as EuroJackpotDraw
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
    link.download = 'eurojackpot_draws.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    console.log('Historical draws exported to eurojackpot_draws.json - save to src/data/ folder')
  } catch (error) {
    console.error('Error exporting draws:', error)
  }
}

export interface EuroJackpotDraw {
  drawDate: string
  drawSystemId: number
  numbers: number[]
  euroNumbers: number[]
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
    specialResults: number[]
  }>
}

/**
 * Generates all EuroJackpot draw dates from 2017 to current date
 * EuroJackpot draws are held every Tuesday and Friday
 * Excludes current day if time is before 23:00 (results not yet available)
 */
function generateAllDrawDates(): Date[] {
  const drawDates: Date[] = []
  const startDate = new Date('2017-01-03') // First Tuesday of 2017
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
    
    // Check if it's Tuesday (2) or Friday (5)
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      drawDates.push(new Date(currentDate))
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log(`Generated ${drawDates.length} potential draw dates from 2017 to ${endDate.toISOString().split('T')[0]} (current time: ${now.toLocaleTimeString()})`)
  return drawDates
}

/**
 * Fetches all EuroJackpot historical draw results from official Lotto.pl API
 * Uses date-specific approach to retrieve complete history
 * Implements localStorage caching to reduce API calls
 * @param refetchIncompleteDatesOnly - If true, only refetch dates with missing draw numbers
 */
export async function fetchEuroJackpotResults(refetchIncompleteDatesOnly: boolean = false): Promise<EuroJackpotDraw[]> {
  console.log('Fetching EuroJackpot results from official Lotto.pl API...')
  
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
  } else {
    console.log('Strategy: Fetch by specific draw dates (2017 to current) with localStorage caching')
  }

  try {
    const allDrawDates = generateAllDrawDates()
    const allDraws: EuroJackpotDraw[] = []
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
        const draw = await fetchEuroJackpotBySpecificDate(drawDate)
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
    throw new Error(`Failed to fetch EuroJackpot data: ${error.message}`)
  }
}

/**
 * Fetches EuroJackpot result for a specific date
 * Returns null if no draw exists on that date
 */
async function fetchEuroJackpotBySpecificDate(drawDate: Date): Promise<EuroJackpotDraw | null> {
  const params = new URLSearchParams({
    gameType: 'EuroJackpot',
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
function sortAndDeduplicate(draws: EuroJackpotDraw[]): EuroJackpotDraw[] {
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



/**
 * Parse individual draw result from Lotto.pl API response
 */
function parseDrawResult(draw: LottoApiDrawResult): EuroJackpotDraw {
  let mainNumbers: number[] = []
  let euroNumbers: number[] = []

  // Extract numbers from results array
  if (Array.isArray(draw.results) && draw.results.length > 0) {
    const result = draw.results[0]
    
    // Get main numbers from resultsJson
    if (Array.isArray(result.resultsJson)) {
      mainNumbers = [...result.resultsJson]
    }
    
    // Get euro numbers from specialResults
    if (Array.isArray(result.specialResults)) {
      euroNumbers = [...result.specialResults]
    }
  } else {
    console.warn(`Draw ${draw.drawSystemId} has no results array`)
  }

  return {
    drawSystemId: draw.drawSystemId,
    drawDate: formatDrawDate(draw.drawDate),
    numbers: mainNumbers,
    euroNumbers: euroNumbers
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
