# Architecture Overview

## Data Flow

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              User's Browser                     │
│                                                 │
└────────────────────┬────────────────────────────┘
                     │
                     │ Views
                     ▼
          ┌──────────────────────┐
          │                      │
          │      App.tsx         │
          │  (Main Component)    │
          │                      │
          └──────────┬───────────┘
                     │
                     │ Fetches Data
                     ▼
         ┌───────────────────────┐
         │  api/eurojackpot.ts   │
         │  (API Service)        │
         └───────────┬───────────┘
                     │
                     │ HTTP Request
                     ▼
         ┌───────────────────────┐
         │  lottery.ie API       │
         │  (Public, Free)       │
         │                       │
         │  Returns:             │
         │  - Draw dates         │
         │  - Main numbers       │
         │  - Euro numbers       │
         │  - Jackpot amounts    │
         └───────────┬───────────┘
                     │
                     │ Transform Data
                     ▼
         ┌───────────────────────┐
         │  Array of Draws       │
         └───────────┬───────────┘
                     │
                     │ Render
                     ▼
         ┌───────────────────────┐
         │  ResultsTable.tsx     │
         │  (Display)            │
         │                       │
         │  Shows:               │
         │  - Date               │
         │  - Numbers            │
         │  - Euro Numbers       │
         │  - Jackpot            │
         └───────────────────────┘
```

## Component Structure

```
src/
├── api/
│   └── eurojackpot.ts ─────► API Service Layer
│       ├── fetchEuroJackpotResults()
│       ├── EuroJackpotDraw interface
│       └── formatCurrency()
│
├── components/
│   └── ResultsTable.tsx ───► Presentation Component
│       ├── Draw type
│       ├── formatDate()
│       ├── getNumbers()
│       └── getEuroNumbers()
│
├── App.tsx ────────────────► Main Container
│   ├── State management
│   ├── Data fetching
│   ├── Error handling
│   └── Loading states
│
└── main.tsx ───────────────► Entry point
```

## Configuration

The application now fetches data exclusively from the lottery.ie API. No configuration is required.

Previous environment variables (`VITE_USE_REAL_API`, `VITE_API_URL`) have been removed for simplicity.

## API Integration Points

### Current Implementation (lottery.ie)

```
API Endpoint:
https://www.lottery.ie/dbg/api/draws/eurojackpot/1

Request:
  Method: GET
  Headers: Accept: application/json
  Auth: None required

Response: Array<{
  drawDate: string
  numbers: number[]
  bonusNumbers: number[]
  jackpot: number
}>

Transform → EuroJackpotDraw format
```

### Extensibility

To add a new API source:

1. Add function to `src/api/eurojackpot.ts`:
   ```typescript
   export async function fetchFromNewAPI(): Promise<EuroJackpotDraw[]>
   ```

2. Call it from `App.tsx`:
   ```typescript
   const draws = await fetchFromNewAPI()
   ```

3. No other changes needed! ✨

## Error Handling Flow

```
API Request
    │
    ├─► Network Error ──────► Display error message
    │
    ├─► Invalid JSON ───────► Display parsing error
    │
    ├─► Missing Fields ─────► Use fallback values
    │                          (handled in transform)
    │
    └─► Success ────────────► Display results
```

## Key Features

✅ **Separation of Concerns**
   - API logic isolated in service layer
   - UI logic in components
   - Configuration in .env

✅ **Type Safety**
   - TypeScript interfaces
   - Compile-time checking
   - Better IDE support

✅ **Flexibility**
   - Easy to swap APIs
   - Mock data for development
   - Configurable via environment

✅ **Error Resilience**
   - Comprehensive error handling
   - User-friendly messages
   - Graceful degradation
