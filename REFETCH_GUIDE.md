# Refetch and Data Storage Guide

## Overview

The refetch button now properly handles downloading and storing lottery draw results both **locally** on your project and **on the server**.

## Features

### 1. **Local Storage (Project Directory)**
When you click the refetch button with "Auto-Export" enabled:
- Data is automatically saved to `src/data/eurojackpot_draws.json` or `src/data/lotto_draws.json`
- Backups are kept in `server-backups/` directory
- You can use the saved data immediately in your application

### 2. **Server Storage (Optional)**
Deploy the PHP endpoint to your server:
- Automatic backup on the remote server
- Data persistence across deployments
- API accessible at `/api-upload-draws.php`

### 3. **Fallback Mechanism**
If the local backend is unavailable:
- Falls back to browser download
- File downloads to your Downloads folder
- Manual save prompt to `src/data/`

## Setup Instructions

### Step 1: Install Backend Dependencies

```bash
npm install express cors
```

### Step 2: Start the Local Backend Server

Run in a separate terminal:

```bash
npm run server
```

Or start both Vite dev server and backend concurrently:

```bash
npm run dev:all
```

The server will run on `http://localhost:3001` and provide these endpoints:

- `POST /api/save-draws` - Save draw data locally
- `GET /api/draws-status` - Get file status
- `GET /api/backups` - List all backups
- `GET /api/health` - Health check

### Step 3: Deploy PHP Endpoint (Optional)

Upload `/public/api-upload-draws.php` to your server to enable server-side backups.

Update the URL in `src/api/eurojackpot.ts` and `src/api/lotto.ts`:

```typescript
const PROXY_URL = 'https://yourdomain.com/api-upload-draws.php'
```

## Usage

### Using Refetch Button

1. Click the **🔄 Refetch** button in the app header
2. The app fetches latest data from the Lotto.pl API
3. With "Auto-Export" enabled, data automatically saves to:
   - `src/data/eurojackpot_draws.json` (via local backend)
   - `src/data/lotto_draws.json` (via local backend)

### Manual Export

Click the **💾 Export Data** button to download the current data as JSON.

### Enable Auto-Export

Click **○ Auto-Export** to toggle automatic saving:
- **Enabled (✓)**: Data saves automatically after each refetch
- **Disabled (○)**: Manual export only

## File Locations

```
project/
├── src/data/
│   ├── eurojackpot_draws.json      # Main data file
│   └── lotto_draws.json             # Main data file
├── server-backups/
│   ├── eurojackpot_draws_*.json    # Timestamped backups
│   └── lotto_draws_*.json           # Timestamped backups
├── server.js                        # Node.js backend
└── public/
    └── api-upload-draws.php        # Server endpoint
```

## How It Works

### Local Save Flow

```
1. Click "Refetch" button
   ↓
2. Fetch data from Lotto.pl API
   ↓
3. Auto-export enabled?
   ├─ YES: POST to /api/save-draws
   │       ├─ Backup existing file
   │       └─ Save new file to src/data/
   └─ NO: Show export notification
```

### Server Upload Flow (Optional)

```
1. Refetch with auto-export enabled
   ↓
2. Save to local backend
   ↓
3. Optionally POST to /api-upload-draws.php
   ├─ Create server backup
   └─ Store on remote server
```

## Backend Server API

### Save Draws Endpoint

**POST** `/api/save-draws`

Request body:
```json
{
  "gameType": "eurojackpot",
  "draws": [
    {
      "drawDate": "2024-01-15",
      "numbers": [1, 5, 12, 28, 35],
      "euroNumbers": [3, 8]
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Saved 150 draws to eurojackpot_draws.json",
  "filepath": "/path/to/src/data/eurojackpot_draws.json",
  "drawsCount": 150,
  "gameType": "eurojackpot"
}
```

### Draws Status Endpoint

**GET** `/api/draws-status`

Response:
```json
{
  "eurojackpot": {
    "exists": true,
    "count": 150,
    "size": 45678,
    "lastModified": "2024-02-16T10:30:00.000Z"
  },
  "lotto": {
    "exists": true,
    "count": 200,
    "size": 60000,
    "lastModified": "2024-02-16T09:15:00.000Z"
  },
  "backups": [
    {
      "name": "eurojackpot_draws_2024021610300000.json",
      "path": "/path/to/server-backups/...",
      "size": 45000
    }
  ]
}
```

## Troubleshooting

### Issue: "Failed to save to local backend"

**Solution:**
1. Ensure `npm run server` is running
2. Check that port 3001 is not in use
3. Verify file permissions on `src/data/` directory

### Issue: "Fallback to browser download"

**Possible causes:**
- Local backend server not running
- Network connectivity issues
- CORS configuration

**Solution:**
- Start the server: `npm run server`
- Check browser console for detailed errors

### Issue: Data not persisting

**Solution:**
1. Verify files exist in `src/data/`
2. Check file permissions (should be readable/writable)
3. Ensure sufficient disk space

## Development

### Running Everything at Once

```bash
npm run dev:all
```

This command runs:
- Vite dev server on `http://localhost:5173`
- Backend server on `http://localhost:3001`
- With hot reload on both

### Manual Testing

Test the backend endpoints:

```bash
# Check health
curl http://localhost:3001/api/health

# Get file status
curl http://localhost:3001/api/draws-status

# Get backups list
curl http://localhost:3001/api/backups
```

## Production Deployment

### Backend (Node.js)

1. Install dependencies: `npm install`
2. Run: `npm run server`
3. Set `PORT` environment variable if needed
4. Use process manager (PM2, etc.) for persistence

### Frontend (Vite)

1. Build: `npm run build`
2. Deploy `dist/` folder to web server
3. Configure backend URL in environment variables

### Server-side (PHP)

1. Upload `/public/api-upload-draws.php` to server
2. Ensure write permissions on data directories
3. Update PHP endpoint URL in TypeScript files

## Security Considerations

- API endpoints are publicly accessible (suitable for personal use)
- For production, add authentication to `/api/save-draws`
- Validate data on backend before saving
- Implement rate limiting on sensitive endpoints
- Use HTTPS for production servers
- Backup data regularly

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs
3. Verify file permissions
4. Ensure all services are running
