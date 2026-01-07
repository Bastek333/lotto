# Eurojackpot Results — Complete Historical Data

This is a Vite + React + TypeScript app that displays **all historical EuroJackpot draw results** from the official Lotto.pl API.

## Features

- Fetches **complete EuroJackpot historical data** from official Lotto.pl API
- **All draws since 2012** (when EuroJackpot started)
- Multiple fetching strategies for reliability
- Built with React, TypeScript, and Vite
- Clean, responsive table display with color-coded numbers
- Automatic deduplication and sorting
- Detailed console logging for debugging
- **LocalStorage caching** for faster subsequent loads
- **Export historical data** to JSON files for backup/analysis
- **Auto-export feature** - automatically save data after each refetch

## What you get

- Complete historical EuroJackpot results (2012 - present)
- Type-safe API service with 3 fallback strategies
- Standalone test tool (`test-api.html`) for API debugging
- Comprehensive error handling and logging

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start dev server

```bash
npm run dev
```

Then open the local URL printed by Vite (usually http://localhost:5173).

## API Information

### Official Lotto.pl API

The app fetches from the official Polish lottery API: `https://developers.lotto.pl/api/open/v1`

**Features:**
- Complete historical EuroJackpot data since 2012
- Official and reliable data source
- Pagination support for large datasets
- Requires API key (included in code)

### Multiple Fetching Strategies

The app uses 3 fallback strategies to ensure all data is retrieved:

1. **Extended Date Range** (Primary) - Uses far future date to get all draws
2. **Year-by-Year** (Fallback) - Fetches each year separately (2012-2025)
3. **No Date Filter** (Last Resort) - Uses generic endpoint

See `FETCHING_STRATEGIES.md` for detailed documentation.

### Data Format

Each draw object contains:
- `drawSystemId` - Unique draw identifier
- `drawDate` - ISO date string
- `numbers` - Array of 5 main numbers (1-50)
- `euroNumbers` - Array of 2 euro numbers (1-12)

## Testing & Debugging

### Quick API Test (No npm required!)

1. Open `test-api.html` directly in your browser
2. Click the test buttons to verify API connectivity
3. Try different strategies to see which works best

**Test buttons:**
- **Test Latest Draw** - Verify API is working
- **Fetch All History (Current Method)** - Test Strategy 1
- **Fetch All History (By Years)** - Test Strategy 2  
- **Fetch Without Date Filter** - Test Strategy 3

### Console Logging

Open browser DevTools (F12) → Console tab to see:
- Which strategy is being used
- Number of pages fetched
- Total draws retrieved
- Any errors or warnings

### Expected Results

- **Total draws**: ~1,400+ (EuroJackpot runs 2x per week since March 2012)
- **Load time**: 5-30 seconds depending on strategy
- **Console output**: Detailed progress logs

## Troubleshooting

See `TROUBLESHOOTING.md` for detailed debugging instructions.

**Common issues:**
- **No data displayed**: Check API key validity
- **Only recent draws**: Browser cache, do hard refresh (Ctrl+F5)
- **CORS errors**: Make sure to use `npm run dev`, not open `index.html` directly

## Project Structure

```
src/
├── api/
│   └── eurojackpot.ts      # API service with 3 fetching strategies
├── components/
│   └── ResultsTable.tsx    # Results display component
│   └── ... (other analysis components)
├── data/
│   ├── eurojackpot_draws.json    # Exported historical data
│   ├── exportData.ts              # Export utility functions
│   └── README.md                  # Data folder documentation
├── App.tsx                 # Main app component
└── main.tsx               # App entry point

export-data.html           # Helper page to export localStorage data
test-api.html              # Standalone API testing tool
FETCHING_STRATEGIES.md     # Detailed strategy documentation
EXPORT_DATA_GUIDE.md       # Guide for exporting historical data
TROUBLESHOOTING.md         # Debug guide
```

## Export Historical Data

The application includes built-in functionality to export all historical draw data:
Auto-Export (Recommended! ⚡)
1. Click the **○ Auto-Export** button in the header to enable
2. Button turns green (**✓ Auto-Export**) when active
3. Data automatically downloads after each refetch
4. Preference is saved and persists across sessions

### Manual Export Methods

#### Method 1: In-App Export Button
1. Load the application and wait for draws to load
2. Click the **💾 Export Data** button in the header
3. Save the downloaded JSON file to `src/data/eurojackpot_draws.json`

#
### Method 2: Export Helper Page
1. Open `export-data.html` in your browser
2. Click "Check LocalStorage" to scan cached draws
3. Click "Download File" to export the data

See [EXPORT_DATA_GUIDE.md](EXPORT_DATA_GUIDE.md) for detailed instructions and all export methods.

## Build for production

```bash
npm run build
npm run preview
```

## Next steps (optional enhancements)

- Add pagination for more results
- Add filtering by date range
- Add number frequency statistics
- Add winner information display
- Implement caching to reduce API calls
- Add unit tests for the API service
