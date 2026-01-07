# Troubleshooting Guide

## Application Not Displaying Data

### Quick Test
1. Open `test-api.html` directly in your browser (double-click the file)
2. Click "Fetch All History" button
3. This will test the Lotto.pl API without needing to run the dev server

### Common Issues

#### 1. API Key Issue
- The current API key in the code might be invalid or expired
- Get a valid API key from: https://developers.lotto.pl/
- Update the API key in:
  - `src/api/eurojackpot.ts` (line 7)
  - `vite.config.js` (line 12)
  - `test-api.html` (line 109)

#### 2. CORS Issues
- The Vite proxy is configured to handle CORS
- Make sure you're running the app with `npm run dev` (not opening `index.html` directly)
- The proxy rewrites `/api` to `https://developers.lotto.pl/api/open/v1`

#### 3. Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab to see API requests/responses

### Expected Behavior

When the app loads successfully, you should see:
1. Loading message appears
2. Console logs show: "Fetching page 1...", "Fetching page 2...", etc.
3. Success message: "✓ Showing complete history: XXX draws from official Lotto.pl API"
4. Table displays with all historical EuroJackpot draws

### Running the Application

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Open browser to the URL shown (usually http://localhost:5173)
```

### API Endpoints Used

1. **Latest Draw**: 
   - `GET /lotteries/draw-results/last-results-per-game?gameType=EuroJackpot`

2. **Historical Draws**: 
   - `GET /lotteries/draw-results/by-date?gameType=EuroJackpot&drawDate={date}&index={page}&size={pageSize}&sort=drawDate&order=DESC`

### Response Format

The API returns draws in this format:
```json
{
  "drawSystemId": 123,
  "drawDate": "2024-01-15T00:00:00",
  "gameType": "EuroJackpot",
  "results": [
    { "number": 5, "resultType": "Main" },
    { "number": 12, "resultType": "Main" },
    { "number": 23, "resultType": "Main" },
    { "number": 34, "resultType": "Main" },
    { "number": 45, "resultType": "Main" },
    { "number": 3, "resultType": "Euro" },
    { "number": 9, "resultType": "Euro" }
  ]
}
```

### Debug Logging

The application includes extensive console logging:
- API request URLs
- Response status codes
- Number of items per page
- Total draws fetched
- Parsing errors

Check the browser console for these logs to diagnose issues.

### Contact

For API issues, refer to: https://developers.lotto.pl/
For application issues, check the browser console first.
