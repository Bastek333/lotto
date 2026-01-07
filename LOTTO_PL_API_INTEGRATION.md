# Lotto.pl API Integration

## Overview
This application now uses the **official Lotto.pl API** to fetch complete historical EuroJackpot draw results.

**API Documentation:** https://developers.lotto.pl/

## Authentication

### API Key Setup
The application uses API Key authentication via HTTP header.

**Current Configuration:**
```typescript
// File: src/api/eurojackpot.ts
const LOTTO_API_KEY = 'YOUR_API_KEY_HERE'
```

**Header Format:**
```
secret: YOUR_API_KEY_HERE
```

### Getting Your API Key
1. Contact Lotto.pl via email: kontakt@lotto.pl
2. Or use contact form: https://www.lotto.pl/kontakt
3. Provide: First name, Last name, Company name (optional), Email, Phone number
4. They will generate your API key

**⚠️ IMPORTANT:** Replace `YOUR_API_KEY_HERE` in `src/api/eurojackpot.ts` with your actual API key when received.

## API Endpoints Used

### 1. Latest Draw Results
```
GET /api/open/v1/lotteries/draw-results/last-results-per-game
Query Parameters:
  - gameType: EuroJackpot
```

### 2. Historical Draw Results (Paginated)
```
GET /api/open/v1/lotteries/draw-results/by-date
Query Parameters:
  - gameType: EuroJackpot (note: this is passed but not filtered server-side)
  - drawDate: <ISO date>
  - index: <page number> (starts at 1)
  - size: <results per page> (max 100)
  - sort: drawDate
  - order: DESC
```

**Important:** This endpoint returns ALL game types (Keno, Szybkie600, EuroJackpot, etc.) mixed together. Client-side filtering by `gameType` is required.

## Data Structure

### Request Headers
```javascript
{
  'Accept': 'application/json',
  'secret': 'YOUR_API_KEY_HERE'
}
```

### Response Format
```typescript
interface LottoApiDrawResult {
  drawSystemId: number           // Unique draw identifier
  drawDate: string               // ISO date string
  gameType: string               // "EuroJackpot"
  multiplierValue?: number       // Multiplier if applicable
  results: Array<{
    number: number               // Drawn number
    resultType: string           // "Main" or "Euro"
  }>
  showSpecialResults?: boolean
  isNewEuroJackpotDraw?: boolean
}
```

### Application Data Model
```typescript
interface EuroJackpotDraw {
  drawSystemId: number           // Draw ID
  drawDate: string               // Formatted date
  numbers: number[]              // 5 main numbers
  euroNumbers: number[]          // 2 euro numbers
  multiplierValue?: number
  isNewEuroJackpotDraw?: boolean
}
```

## Implementation Details

### Fetching Complete History
The application fetches the complete EuroJackpot history using:
1. **Latest Draw:** Single call to get the most recent draw
2. **Historical Data:** Paginated calls starting from first draw (March 23, 2012)
3. **Pagination:** Fetches up to 5,000 draws (50 pages × 100 draws)

### Code Flow
```typescript
// 1. Fetch latest draw
const latestDraw = await fetchLatestEuroJackpotResult()

// 2. Fetch historical draws with pagination
while (hasMore && pageIndex <= 50) {
  const draws = await fetchEuroJackpotByDateRange(
    startDate,      // 2012-03-23
    endDate,        // today
    pageIndex,      // current page
    100             // page size
  )
  // Add to results, check for duplicates
}

// 3. Sort by date (newest first)
allDraws.sort((a, b) => new Date(b.drawDate) - new Date(a.drawDate))
```

## Available Game Types
The API supports multiple lottery games:
- **Lotto**
- **LottoPlus**
- **EuroJackpot** ← Currently used
- **MultiMulti**
- **MiniLotto**
- **Kaskada**
- **Keno**
- **EkstraPensja**
- **EkstraPremia**
- **Szybkie600**
- **ZakladySpecjalne**

## Other Available Endpoints

### Game Information
```
GET /api/open/v1/lotteries/info?gameType=EuroJackpot
```

### Jackpot Value
```
GET /api/open/v1/lotteries/info/game-jackpot?gameType=EuroJackpot
```

### Next Draw
```
GET /api/open/v1/lotteries/info/next-draw?gameType=EuroJackpot
```

### Win Statistics
```
GET /api/open/v1/lotteries/draw-prizes/eurojackpot/{drawSystemId}
```

### Number Frequency Statistics
```
GET /api/open/v1/lotteries/draw-statistics/numbers-frequency
Query Parameters:
  - gameType: EuroJackpot
  - dateFrom: <ISO date>
  - dateTo: <ISO date>
```

## Error Handling

### HTTP Status Codes
- **200:** Success
- **400:** Bad request
- **401:** Unauthorized (invalid API key)
- **404:** No results found
- **422:** Validation error

### Application Error Handling
```typescript
try {
  const draws = await fetchEuroJackpotResults()
  // Process draws
} catch (error) {
  // Display error message to user
  // Check API key configuration
  // Verify network connectivity
}
```

## Testing

### Before API Key
The application will fail with 401 Unauthorized until you configure your API key.

### After API Key Configuration
1. Replace `YOUR_API_KEY_HERE` in `src/api/eurojackpot.ts`
2. Run `npm install` (if not already done)
3. Run `npm run dev`
4. Open browser to the local server
5. Verify complete draw history loads

## CORS Considerations

The Lotto.pl API is designed to be called from server-side applications. If you encounter CORS issues when running from the browser:

**Option 1: Proxy Server (Recommended for Production)**
Set up a backend proxy to call the API and serve results to your frontend.

**Option 2: Development Proxy**
Configure Vite proxy in `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api/open': {
        target: 'https://developers.lotto.pl',
        changeOrigin: true
      }
    }
  }
})
```

**Option 3: CORS Browser Extension (Development Only)**
Use a CORS unblock extension for testing.

## Security Notes

1. **API Key Protection:** Never commit your actual API key to version control
2. **Environment Variables:** Use `.env` files for configuration:
   ```
   VITE_LOTTO_API_KEY=your_actual_key_here
   ```
3. **Server-Side Calls:** For production, call the API from your backend
4. **Rate Limiting:** Respect API rate limits to avoid throttling

## Rate Limits

While not explicitly documented, best practices:
- Cache results when possible
- Implement exponential backoff for retries
- Don't fetch full history on every page load
- Store results in browser localStorage or backend database

## Support

For API issues or questions:
- **Email:** kontakt@lotto.pl
- **Contact Form:** https://www.lotto.pl/kontakt
- **API Documentation:** https://developers.lotto.pl/

## Migration Notes

### What Changed
- **Before:** Used multiple third-party APIs with CORS proxies
- **After:** Direct integration with official Lotto.pl API
- **Benefit:** Authoritative source, complete history, reliable data

### Files Modified
1. `src/api/eurojackpot.ts` - Complete rewrite for official API
2. `src/App.tsx` - Updated messaging
3. `src/components/ResultsTable.tsx` - Added draw ID, removed limit

### Breaking Changes
None for end users. The UI and functionality remain the same.
