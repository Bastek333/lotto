# Export Historical Draw Data Guide

This guide explains how to export EuroJackpot historical draw data from the application's localStorage to JSON files.

## Auto-Export Feature ⚡

The application now includes an **Auto-Export** toggle that automatically downloads the data file after each refetch!

### How to Enable Auto-Export

1. Look for the **○ Auto-Export** button in the header (next to 💾 Export Data)
2. Click it to enable - it will turn green and show **✓ Auto-Export**
3. Now whenever you refetch data (🔄 Refetch button), the updated JSON file will automatically download
4. Your preference is saved in localStorage and persists across sessions

**Benefits:**
- ✅ Never forget to export after refetching
- ✅ Always have the latest data backed up
- ✅ Automatic updates to your data file
- ✅ One-time setup, continuous updates

## Quick Start

### Method 1: Using the Application Export Button (Easiest)

1. Open the Lotto application in your browser
2. Wait for all historical draws to load (check the draw count in the header)
3. Click the **💾 Export Data** button in the header (next to the 🔄 Refetch button)
4. Your browser will download a JSON file named `eurojackpot_draws_YYYY-MM-DD.json`
5. Copy this file to `src/data/eurojackpot_draws.json` in your project

### Method 2: Using the Export Helper Page

1. Open the Lotto application and let it load all historical data
2. Open `export-data.html` in your browser (can be in the same or different tab)
3. Click **📊 Check LocalStorage** to scan for cached draws
4. Review the statistics (total draws, date range, etc.)
5. Click **⬇️ Download File** to download the JSON file
6. Save it as `src/data/eurojackpot_draws.json`

### Method 3: Browser Console (Advanced)

1. Open the Lotto application
2. Open browser Developer Tools (F12)
3. Go to the Console tab
4. Paste and run this code:

```javascript
// Get all cached draws
const draws = [];
const prefix = 'eurojackpot_draws_cache_v1_';
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith(prefix)) {
    const cached = localStorage.getItem(key);
    if (cached) draws.push(JSON.parse(cached));
  }
}

// Sort by date (newest first)
draws.sort((a, b) => new Date(b.drawDate) - new Date(a.drawDate));

// Convert to JSON
const json = JSON.stringify(draws, null, 2);

// Download as file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'eurojackpot_draws.json';
a.click();
URL.revokeObjectURL(url);

console.log(`Exported ${draws.length} draws`);
```

## Data Structure

The exported JSON file contains an array of draw objects:

```json
[
  {
    "drawDate": "2024-12-13T00:00:00.000Z",
    "drawSystemId": 1234,
    "numbers": [5, 12, 23, 34, 45],
    "euroNumbers": [3, 9],
    "jackpot": "€10,000,000",
    "jackpotAmount": 10000000
  }
]
```

### Fields

- **drawDate**: ISO 8601 date string of when the draw occurred
- **drawSystemId**: Unique identifier from the Lotto.pl API
- **numbers**: Array of 5 main numbers (1-50), sorted ascending
- **euroNumbers**: Array of 2 euro numbers (1-12), sorted ascending
- **jackpot**: Optional formatted jackpot string
- **jackpotAmount**: Optional numeric jackpot value

## Programmatic Usage

### Import and Use Export Functions

```typescript
import { 
  getAllCachedDraws, 
  exportDrawsToJson, 
  downloadDrawsAsJson 
} from './api/eurojackpot'

// Get all cached draws as array
const draws = getAllCachedDraws()
console.log(`Found ${draws.length} draws`)

// Get JSON string
const jsonString = exportDrawsToJson()

// Trigger browser download
downloadDrawsAsJson()
```

### Load Data from File

```typescript
import drawsData from './data/eurojackpot_draws.json'

// Use in your application
function loadHistoricalData() {
  const draws = drawsData
  console.log(`Loaded ${draws.length} historical draws`)
  return draws
}
```

## File Locations

- **Source Data**: Browser localStorage with keys like `eurojackpot_draws_cache_v1_YYYY-MM-DD`
- **Export Destination**: `src/data/eurojackpot_draws.json`
- **Export Helper**: `export-data.html` (in project root)
- **Export Utils**: `src/data/exportData.ts`

## Tips

1. **Initial Load**: When first loading the application, it fetches all historical draws from the Lotto.pl API. This may take 1-2 minutes.

2. **Cache Updates**: The application automatically caches draws in localStorage. Re-export periodically to keep the JSON file updated.

3. **Data Verification**: Check the exported file to ensure:
   - All draws have 5 main numbers
   - All draws have 2 euro numbers
   - Dates are in correct chronological order
   - No duplicate draws exist

4. **File Size**: A complete history from 2017 will be approximately 200-400 KB depending on the number of draws.

5. **Version Control**: Consider adding `src/data/eurojackpot_draws.json` to your `.gitignore` if the file is large, or commit it to version control for easier distribution.

## Troubleshooting

### No Data in LocalStorage

**Problem**: Export tools show 0 draws  
**Solution**: Open the main application and wait for all draws to load. Check the browser console for API errors.

### Incomplete Draws

**Problem**: Some draws are missing numbers  
**Solution**: Use the 🔄 Refetch button in the application to re-fetch incomplete draws from the API.

### Export Button Disabled

**Problem**: The "💾 Export Data" button is grayed out  
**Solution**: Wait for data to load. The button is only enabled when draws are available.

### Large File Size

**Problem**: JSON file is too large  
**Solution**: The data is already minimal. Consider compressing the file or storing it in a database for production use.

## API Reference

### getAllCachedDraws()

```typescript
function getAllCachedDraws(): EuroJackpotDraw[]
```

Retrieves all cached draws from localStorage, sorted by date (newest first).

### exportDrawsToJson()

```typescript
function exportDrawsToJson(): string
```

Converts all cached draws to a formatted JSON string with 2-space indentation.

### downloadDrawsAsJson()

```typescript
function downloadDrawsAsJson(): void
```

Triggers a browser download of all cached draws as a JSON file.

## Data Sources

All data is fetched from the official Lotto.pl API:
- **API Base**: `https://developers.lotto.pl/api/open/v1`
- **Documentation**: https://developers.lotto.pl/
- **Game Type**: EuroJackpot
- **Historical Range**: January 2017 - Present
- **Draw Schedule**: Every Tuesday and Friday

## Support

For issues or questions:
1. Check the browser console (F12) for detailed error messages
2. Verify your API key is configured correctly
3. Ensure you have a stable internet connection
4. Check that localStorage is enabled in your browser

---

Last Updated: December 17, 2025
