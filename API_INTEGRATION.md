# EuroJackpot API Integration

## Overview
This application fetches historical EuroJackpot draw data from **euro-jackpot.net**, which provides comprehensive lottery results going back many years.

## Data Source
- **Primary Source**: https://www.euro-jackpot.net/results
- **Access Method**: CORS proxy (AllOrigins API)
- **Fallback**: Alternative lottery API endpoints

## API Implementation

### Primary Method: HTML Scraping via CORS Proxy
Since euro-jackpot.net doesn't provide a public JSON API, we use the AllOrigins CORS proxy to access their results page and parse the HTML:

```typescript
const proxyUrl = 'https://api.allorigins.win/get?url='
const targetUrl = encodeURIComponent('https://www.euro-jackpot.net/results')
const response = await fetch(proxyUrl + targetUrl)
```

### Data Extraction
The application parses the HTML to extract:
- **Draw Date**: Full date of each draw
- **Main Numbers**: 5 numbers from 1-50
- **Euro Numbers**: 2 numbers from 1-12
- **Jackpot Amount**: Prize pool in euros
- **Winner Status**: Whether jackpot was won or rolled over

### Data Format
```typescript
interface EuroJackpotDraw {
  drawDate: string           // e.g., "November 11, 2025"
  numbers: number[]          // e.g., [8, 24, 25, 41, 50]
  euroNumbers: number[]      // e.g., [8, 9]
  jackpot?: string           // e.g., "€10,000,000"
  jackpotAmount?: number     // e.g., 10000000
}
```

## API Limitations & Considerations

### Rate Limiting
- AllOrigins has rate limits for free tier
- Consider caching results to reduce API calls

### Data Freshness
- Results page is updated after each draw (Tuesday & Friday)
- Typical delay: 30-60 minutes after draw

### CORS Proxy Reliability
- AllOrigins is a free service with potential downtime
- Application includes fallback mechanisms

## Alternative APIs Considered

### 1. **euro-jackpot.net Direct API** ❌
- No public JSON API available
- Website uses server-side rendering

### 2. **lottery.merseyworld.com** ⚠️
- Provides CSV data for some lotteries
- EuroJackpot support is limited/inconsistent

### 3. **national-lottery.com** ❌
- Doesn't include EuroJackpot in their API
- Focuses on UK/IE lotteries

### 4. **lotto.net API** ⚠️
- Implemented as fallback
- Limited data history
- Inconsistent availability

## Recommended Improvements

### Short Term
1. **Implement caching**: Store results locally to reduce API calls
   ```typescript
   // Cache results in localStorage
   localStorage.setItem('eurojackpot_draws', JSON.stringify(draws))
   ```

2. **Add retry logic**: Implement exponential backoff for failed requests

3. **Error handling**: Show user-friendly messages when API is unavailable

### Long Term
1. **Backend proxy**: Create your own server-side proxy to:
   - Cache results
   - Provide consistent API interface
   - Handle rate limiting

2. **Database storage**: Store historical data to reduce dependency on external APIs

3. **Multiple data sources**: Aggregate data from multiple lottery websites for redundancy

## Usage Example

```typescript
import { fetchEuroJackpotResults } from './api/eurojackpot'

// Fetch all available historical draws
const draws = await fetchEuroJackpotResults()

// Display in your app
console.log(`Fetched ${draws.length} draws`)
draws.forEach(draw => {
  console.log(`${draw.drawDate}: ${draw.numbers.join(', ')} + ${draw.euroNumbers.join(', ')}`)
})
```

## API Response Time
- **Typical**: 1-3 seconds
- **With proxy**: 2-5 seconds
- **Fallback**: 3-8 seconds

## Data Coverage
The euro-jackpot.net website typically displays:
- Latest 10-20 draws on main results page
- Archive pages available for historical data
- Complete history since 2012 (when EuroJackpot launched)

## Support & Maintenance
- Monitor AllOrigins status: https://allorigins.win/
- Check euro-jackpot.net availability
- Update HTML parsing logic if website structure changes

## License & Legal
- Data is publicly available on euro-jackpot.net
- This is for informational/educational purposes
- No commercial use of lottery data
- Respect terms of service of all APIs used
