# Deployment Instructions - CORS Fix

## Problem
The app works locally but gets CORS errors in production when calling the Lotto.pl API directly.

## Solution
A PHP proxy has been created to bypass CORS restrictions in production.

## Deployment Steps

### 1. Build the Application
```bash
npm run build
```

### 2. Upload Files to Your Server
Upload the entire `dist/` folder to your server at:
```
http://www.automatykabram.strefa.pl/bastek/lotto/
```

**IMPORTANT**: Make sure the `api-proxy.php` file from the `public` folder is also uploaded to the same directory.

Your server structure should look like:
```
/bastek/lotto/
  ├── index.html
  ├── assets/
  │   ├── index-xxx.js
  │   └── index-xxx.css
  └── api-proxy.php   ← IMPORTANT: This file must be present!
```

### 3. Verify the Proxy Works
Test the proxy by visiting:
```
http://www.automatykabram.strefa.pl/bastek/lotto/api-proxy.php?endpoint=lotteries/draw-results/by-date-per-game?gameType=EuroJackpot&index=1&size=1
```

You should see JSON data returned (not an error).

### 4. Test the Application
Open your application:
```
http://www.automatykabram.strefa.pl/bastek/lotto/
```

Check the browser console for any errors. The API calls should now work without CORS issues.

## How It Works

### Local Development
- Uses Vite's dev server proxy (configured in `vite.config.js`)
- Requests go to `/api` which proxies to `https://developers.lotto.pl`

### Production
- Uses `api-proxy.php` on your server
- JavaScript makes requests to `/api-proxy.php?endpoint=...`
- PHP proxy forwards requests to Lotto.pl API with proper headers
- No CORS issues because the request comes from your server, not the browser

## Troubleshooting

### If you still get CORS errors:
1. Check that `api-proxy.php` is uploaded to the correct location
2. Verify your server supports PHP (most shared hosting does)
3. Check file permissions (should be 644 or 755)

### If you get 500 errors from the proxy:
1. Check PHP error logs on your server
2. Verify cURL is enabled in PHP (most hosting has this enabled)
3. Contact your hosting provider if needed

### To test the proxy independently:
```bash
curl "http://www.automatykabram.strefa.pl/bastek/lotto/api-proxy.php?endpoint=lotteries/draw-results/by-date-per-game?gameType=EuroJackpot&index=1&size=1"
```

## Security Note
The API key is included in the PHP proxy file. This is acceptable since:
1. The Lotto.pl API is a free, public API
2. The key is already visible in your client-side code
3. For sensitive APIs, you would need additional authentication layers
