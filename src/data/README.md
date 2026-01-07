# Historical Draw Data

This folder contains EuroJackpot historical draw data.

## Files

- `eurojackpot_draws.json` - Historical draw results from the EuroJackpot lottery
- `exportData.ts` - Utility script to export data from localStorage to JSON file

## Data Structure

Each draw entry contains:
- `drawDate`: ISO date string of the draw
- `drawSystemId`: Unique identifier for the draw
- `numbers`: Array of 5 main numbers (1-50)
- `euroNumbers`: Array of 2 euro numbers (1-12)
- `jackpot`: Optional jackpot amount as string
- `jackpotAmount`: Optional jackpot amount as number

## Usage

### Export from Application
Click the "💾 Export Data" button in the application header to download all cached draws as a JSON file.

### Programmatic Export
Use the export functions from the API:
```typescript
import { exportDrawsToJson, downloadDrawsAsJson } from './api/eurojackpot'

// Get JSON string
const jsonData = exportDrawsToJson()

// Trigger browser download
downloadDrawsAsJson()
```

## Data Source

Data is fetched from the official Lotto.pl API:
- API: https://developers.lotto.pl/api/open/v1
- Game Type: EuroJackpot
- Historical data from 2017 onwards
