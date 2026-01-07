# EuroJackpot API Integration Guide

## Overview

This application now fetches real EuroJackpot lottery draw results from the **Irish National Lottery API** (lottery.ie), which is publicly accessible and requires no API key.

## Current Implementation

### API Endpoint
```
https://www.lottery.ie/dbg/api/draws/eurojackpot/1
```

### Features
- ✅ **Free** - No API key required
- ✅ **Public** - No authentication needed
- ✅ **CORS-enabled** - Works from browser
- ✅ **Real data** - Official EuroJackpot results
- ✅ **Up-to-date** - Recent draw results

### Response Format

The API returns an array of draw objects:

```json
[
  {
    "drawDate": "2025-11-08T19:00:00Z",
    "numbers": [5, 12, 23, 34, 47],
    "bonusNumbers": [3, 8],
    "jackpot": 10000000
  }
]
```

### Data Transformation

The `src/api/eurojackpot.ts` service transforms the API response to match our app's format:

```typescript
{
  drawDate: string        // ISO date string
  numbers: number[]       // Main numbers (5 numbers, 1-50)
  euroNumbers: number[]   // Euro numbers (2 numbers, 1-12)
  jackpot: string        // Formatted currency (e.g., "€10,000,000")
  jackpotAmount: number  // Raw amount
}
```

## Alternative API Options

If lottery.ie becomes unavailable, here are alternatives:

### 1. RapidAPI Lottery Services
- **Lottery Results API** on RapidAPI
- **Euro Lottery API**
- Requires API key (free tier available)
- More comprehensive data

### 2. Official Sources (requires scraping)
- euro-jackpot.net
- eurojackpot.org
- National lottery websites

### 3. Commercial APIs
- api-lotto.com
- lotteryapi.com
- lottoapi.eu

## Configuration

The application now fetches data exclusively from the lottery.ie API. No configuration is required.

### Using a Different API

If you want to use a different API, modify `src/api/eurojackpot.ts` and add your custom fetch function:

```typescript
export async function fetchFromCustomAPI(): Promise<EuroJackpotDraw[]> {
  const response = await fetch('YOUR_API_ENDPOINT', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Accept': 'application/json'
    }
  })
  
  const data = await response.json()
  
  // Transform to match EuroJackpotDraw format
  return data.map(draw => ({
    drawDate: draw.date,
    numbers: draw.main,
    euroNumbers: draw.bonus,
    jackpot: formatCurrency(draw.prize)
  }))
}
```

Then update `App.tsx` to use your function:

```typescript
import { fetchFromCustomAPI } from './api/eurojackpot'

// In the load function:
const apiDraws = await fetchFromCustomAPI()
```

## API Error Handling

The app includes comprehensive error handling:

1. **Network Errors** - Displays error message to user
2. **Invalid JSON** - Catches parsing errors
3. **Missing Fields** - Uses fallback values
4. **CORS Issues** - Documented in error message

## Testing the API

You can test the API directly:

```bash
curl https://www.lottery.ie/dbg/api/draws/eurojackpot/1
```

Or in browser console:
```javascript
fetch('https://www.lottery.ie/dbg/api/draws/eurojackpot/1')
  .then(r => r.json())
  .then(console.log)
```

## Rate Limiting

The lottery.ie API doesn't have strict rate limits for reasonable use. However:
- Don't poll too frequently (every few seconds)
- Consider caching results
- Implement proper error handling and backoff

## Future Enhancements

- [ ] Add caching layer (localStorage or IndexedDB)
- [ ] Implement automatic refresh every hour
- [ ] Add retry logic with exponential backoff
- [ ] Support multiple lottery APIs with fallback
- [ ] Add API health check endpoint
- [ ] Implement service worker for offline support

## Troubleshooting

### API Returns 404
- Check if the endpoint has changed
- Verify lottery.ie is accessible
- Switch to mock data temporarily

### CORS Errors
- lottery.ie should support CORS
- If issues persist, use a CORS proxy (not recommended for production)
- Consider building a backend proxy

### Data Format Changes
- The API response format may change
- Update transformation logic in `src/api/eurojackpot.ts`
- Add unit tests to catch breaking changes

## Support

For issues with:
- **lottery.ie API** - Contact Irish National Lottery support
- **This app** - Check console for error messages
- **Alternative APIs** - Refer to their documentation
