# API Key Setup Guide

## Quick Start

### Step 1: Get Your API Key from Lotto.pl

**Contact Lotto.pl to request API access:**

**Option A: Email**
- Send email to: **kontakt@lotto.pl**
- Subject: "Request for LOTTO OpenAPI Access"

**Option B: Contact Form**
- Visit: https://www.lotto.pl/kontakt
- Fill out the contact form

**Information to Provide:**
- First Name
- Last Name
- Company Name (if applicable)
- Email Address
- Phone Number
- Purpose: "EuroJackpot historical data access for application"

They will generate your API key and send it to you.

---

### Step 2: Configure Your API Key

Once you receive your API key, update the application:

**File to Edit:** `src/api/eurojackpot.ts`

**Find this line (near the top of the file):**
```typescript
const LOTTO_API_KEY = 'YOUR_API_KEY_HERE'
```

**Replace with your actual key:**
```typescript
const LOTTO_API_KEY = 'GNq0pdsAAW2fPgXokLyZ4a8pJ1KEkKaj7kPICqQVbwg='
```
*(Use the key they provide, not this example)*

---

### Step 3: Run the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The application will now fetch complete EuroJackpot history from the official Lotto.pl API!

---

## Expected Results

### Before API Key
❌ Error: "Failed to fetch EuroJackpot data"
- API returns 401 Unauthorized
- No data displayed

### After API Key Configuration
✓ Success message: "Showing complete history: X draws from official Lotto.pl API"
- Complete historical data since 2012
- All main numbers and euro numbers
- Draw IDs and dates

---

## Troubleshooting

### Issue: 401 Unauthorized
**Cause:** API key is invalid or not configured
**Solution:** 
1. Verify you replaced `YOUR_API_KEY_HERE` with your actual key
2. Check for extra spaces or quotes
3. Ensure the key is exactly as provided by Lotto.pl

### Issue: 404 Not Found
**Cause:** Endpoint may have changed
**Solution:** Check API documentation at https://developers.lotto.pl/

### Issue: CORS Error
**Cause:** Browser blocking cross-origin requests
**Solution:** 
1. Add proxy configuration to `vite.config.js` (see LOTTO_PL_API_INTEGRATION.md)
2. Or use a backend server to proxy requests
3. For development only: Use CORS browser extension

### Issue: No Data Displayed
**Cause:** API response format may differ
**Solution:** 
1. Check browser console for errors
2. Verify API is returning data
3. Check network tab in developer tools

---

## Security Best Practices

### ⚠️ Never Commit Your API Key

**Add to `.gitignore`:**
```
.env
.env.local
*.key
```

**Use Environment Variables (Recommended):**

1. Create `.env.local` file:
   ```
   VITE_LOTTO_API_KEY=your_actual_key_here
   ```

2. Update `src/api/eurojackpot.ts`:
   ```typescript
   const LOTTO_API_KEY = import.meta.env.VITE_LOTTO_API_KEY || 'YOUR_API_KEY_HERE'
   ```

3. The `.env.local` file will be ignored by git

---

## Testing Your Configuration

### Manual Test

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for these messages:
   ```
   Fetching EuroJackpot results from official Lotto.pl API...
   Fetching page 1...
   Fetching page 2...
   ✓ Successfully retrieved X EuroJackpot draws from Lotto.pl API
   ```

### Expected Data
- **Draw Count:** 700+ draws (as of 2024)
- **Date Range:** March 23, 2012 to present
- **Main Numbers:** 5 numbers per draw (1-50)
- **Euro Numbers:** 2 numbers per draw (1-12)

---

## Support

If you have issues:
1. Check `LOTTO_PL_API_INTEGRATION.md` for detailed API documentation
2. Review browser console for error messages
3. Contact Lotto.pl support: kontakt@lotto.pl
4. Check API documentation: https://developers.lotto.pl/

---

## Example Response

When working correctly, you should see a table like:

| Draw # | Date | Main Numbers | Euro Numbers |
|--------|------|--------------|--------------|
| #1234 | November 10, 2024 | 5, 12, 23, 34, 45 | 3, 7 |
| #1233 | November 8, 2024 | 8, 19, 27, 38, 41 | 2, 9 |
| ... | ... | ... | ... |

With a success message:
> ✓ Showing complete history: 712 draws from official Lotto.pl API
