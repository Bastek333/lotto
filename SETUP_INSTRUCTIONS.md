# EuroJackpot Application - Setup Instructions

## Prerequisites

Before running this application, you need to install Node.js:

1. **Download Node.js**
   - Visit: https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer and follow the setup wizard

2. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

## Installation Steps

1. **Navigate to Project Directory**
   ```bash
   cd c:/Repo/Lotto
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - The app will run at: http://localhost:5173
   - Browser should open automatically

## What Was Implemented

### ✅ EuroJackpot Historical Data API Integration

The application now fetches **real historical data** from euro-jackpot.net:

1. **Primary API**: Uses AllOrigins CORS proxy to access euro-jackpot.net
   - Fetches all displayed draws from the results page
   - Parses HTML to extract draw numbers, dates, and jackpot amounts
   - Typically shows 10-20 most recent draws

2. **Fallback Mechanism**: If primary source fails, tries alternative APIs

3. **Data Extraction**: Automatically parses and formats:
   - Draw dates
   - 5 main numbers (1-50)
   - 2 Euro numbers (1-12)
   - Jackpot amounts in euros

### Files Modified

1. **src/api/eurojackpot.ts**
   - Added `fetchEuroJackpotResults()` with CORS proxy support
   - Added `parseEuroJackpotHTML()` to extract data from HTML
   - Added `parseDrawDate()` for date formatting
   - Maintained fallback mechanisms

2. **src/App.tsx**
   - Updated UI text to reflect data source
   - Added draw count display
   - Enhanced error messaging

3. **src/styles.css**
   - Added `.info` class for success messages
   - Improved visual feedback

### New Documentation Files

1. **API_INTEGRATION.md**
   - Complete API documentation
   - Data source information
   - Alternative APIs evaluated
   - Improvement recommendations

2. **SETUP_INSTRUCTIONS.md** (this file)
   - Installation guide
   - Testing instructions

## API Details

### Data Source
- **Website**: https://www.euro-jackpot.net/results
- **Access Method**: CORS proxy (AllOrigins)
- **Update Frequency**: After each draw (Tuesday & Friday evenings)

### API Endpoint
```typescript
const proxyUrl = 'https://api.allorigins.win/get?url='
const targetUrl = 'https://www.euro-jackpot.net/results'
```

### Response Format
```typescript
interface EuroJackpotDraw {
  drawDate: string           // "November 11, 2025"
  numbers: number[]          // [8, 24, 25, 41, 50]
  euroNumbers: number[]      // [8, 9]
  jackpot?: string           // "€10,000,000"
  jackpotAmount?: number     // 10000000
}
```

## Testing the API

### Console Testing
Open browser console (F12) after app loads:

```javascript
// Check what data was fetched
console.log('Draws loaded:', window.drawData)

// Manual API test
fetch('https://api.allorigins.win/get?url=' + 
      encodeURIComponent('https://www.euro-jackpot.net/results'))
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
```

### Expected Results
- Application loads 10-20 recent draws
- Each draw shows correct date, numbers, and jackpot
- Data updates reflect latest draws from website

## Troubleshooting

### Issue: "Loading..." never completes
**Cause**: API might be rate-limited or down  
**Solution**: 
- Check browser console for errors
- Try refreshing after a few minutes
- Fallback to mock data should activate

### Issue: Shows mock data instead of real data
**Cause**: CORS proxy failed to fetch data  
**Solution**:
- Check if https://euro-jackpot.net/results is accessible
- Check if https://allorigins.win is operational
- Network/firewall might be blocking requests

### Issue: Old data displayed
**Cause**: Browser cache  
**Solution**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Features

✅ Fetches real historical EuroJackpot draw data  
✅ Displays all available recent draws  
✅ Shows winning numbers and Euro numbers  
✅ Displays jackpot amounts  
✅ Automatic fallback if API fails  
✅ Clean, responsive UI  
✅ Error handling and user feedback  

## Next Steps (Optional Enhancements)

1. **Add Caching**
   - Store results in localStorage
   - Reduce API calls
   - Faster load times

2. **Pagination**
   - Load older draws on demand
   - Implement infinite scroll

3. **Filtering & Search**
   - Search by date range
   - Filter by jackpot amount
   - Find specific numbers

4. **Statistics**
   - Most common numbers
   - Number frequency charts
   - Hot/cold numbers

5. **Backend Integration**
   - Create your own API proxy
   - Store data in database
   - Scheduled data updates

## Support

For issues or questions:
1. Check browser console for errors
2. Review API_INTEGRATION.md for API details
3. Verify Node.js and npm are installed correctly

## License

This project uses publicly available lottery data for informational purposes.
