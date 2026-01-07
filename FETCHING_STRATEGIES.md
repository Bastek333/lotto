# EuroJackpot Data Fetching Strategies

## Problem
The previous implementation only fetched draws from today backwards, missing historical data.

## Solution
The application now uses **3 fallback strategies** to ensure all historical data is retrieved:

### Strategy 1: Extended Date Range Pagination (Primary)
- Uses a far future date (2099-12-31) as the end date
- Fetches all historical draws through pagination
- Most efficient if the API accepts future dates
- **Retrieves**: All draws in descending order

```typescript
// Parameters
drawDate: "2099-12-31T00:00:00.000Z"
index: 1, 2, 3... (pagination)
size: 100
sort: "drawDate"
order: "DESC"
```

### Strategy 2: Year-by-Year Range Fetching (Fallback)
- Iterates from current year back to 2012
- Fetches each year separately with pagination
- More API calls but guaranteed to get all data
- **Retrieves**: All draws year by year

```typescript
// For each year from 2025 down to 2012
startDate: "YYYY-01-01T00:00:00.000Z"
drawDate: "YYYY-12-31T23:59:59.000Z"
index: 1, 2, 3... (pagination per year)
size: 100
```

### Strategy 3: No Date Filter (Last Resort)
- Uses the base endpoint without date filtering
- Relies entirely on pagination and gameType filter
- **Retrieves**: All draws if API supports it

```typescript
// Parameters
gameType: "EuroJackpot"
index: 1, 2, 3... (pagination)
size: 100
sort: "drawDate"
order: "DESC"
```

## How It Works

1. **Application starts** → calls `fetchEuroJackpotResults()`
2. **Strategy 1** attempts to fetch all data with extended date range
   - If successful (returns draws) → Done!
3. **Strategy 2** fetches data year by year if Strategy 1 fails
   - If successful (returns draws) → Done!
4. **Strategy 3** attempts without date filter if Strategy 2 fails
   - Returns whatever is available

## Deduplication

All strategies include automatic deduplication:
- Removes duplicate draws based on `drawSystemId`
- Sorts results by date (newest first)
- Logs the deduplication process

```typescript
// Example output
Deduplicated: 1234 → 1156 unique draws
```

## Testing

Use `test-api.html` to test each strategy independently:

1. **Test Latest Draw** - Verify API connection
2. **Test By Date (Page 1)** - Check single page fetch
3. **Fetch All History (Current Method)** - Strategy 1 test
4. **Fetch All History (By Years)** - Strategy 2 test
5. **Fetch Without Date Filter** - Strategy 3 test

## Console Logging

The application provides detailed logging:

```
Fetching EuroJackpot results from official Lotto.pl API...
Strategy 1: Attempting pagination with extended date range...
  Fetching page 1...
  Page 1: Got 100 draws
  Fetching page 2...
  Page 2: Got 100 draws
  ...
  Fetching page 12...
  Page 12: Got 56 draws
  No more data on page 13
✓ Strategy 1 successful: Retrieved 1156 draws
  Deduplicated: 1156 → 1156 unique draws
✓ Successfully retrieved 1156 EuroJackpot draws from Lotto.pl API
```

## Expected Results

- **EuroJackpot started**: March 23, 2012
- **Draws per week**: 2 (Tuesday and Friday)
- **Expected total** (as of Nov 2025): ~1,400+ draws

If you're getting significantly fewer draws, check:
1. API key validity
2. Network/CORS configuration
3. API endpoint availability
4. Console logs for specific errors

## API Endpoints Used

### By Date (with range)
```
GET https://developers.lotto.pl/api/open/v1/lotteries/draw-results/by-date
```

### Generic (no date filter)
```
GET https://developers.lotto.pl/api/open/v1/lotteries/draw-results
```

### Latest Draw
```
GET https://developers.lotto.pl/api/open/v1/lotteries/draw-results/last-results-per-game
```

## Configuration

All strategies use:
- **Page size**: 100 draws per request
- **Max pages**: 100 (safety limit)
- **Game type filter**: EuroJackpot only
- **Sort order**: descending by date

These can be adjusted in `src/api/eurojackpot.ts` if needed.
