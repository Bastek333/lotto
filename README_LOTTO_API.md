# EuroJackpot Results - Official Lotto.pl API

A React + TypeScript application that displays complete historical EuroJackpot draw results using the **official Lotto.pl API**.

## 🎯 Features

- ✅ Complete EuroJackpot history since 2012 (700+ draws)
- ✅ Official data from Totalizator Sportowy (Lotto.pl)
- ✅ Real-time updates with latest draws
- ✅ Clean, responsive table display
- ✅ TypeScript type safety
- ✅ Pagination support for large datasets

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- **API key from Lotto.pl** (see Setup section)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
**⚠️ REQUIRED:** You must obtain an API key from Lotto.pl

1. **Request API access:**
   - Email: kontakt@lotto.pl
   - Or visit: https://www.lotto.pl/kontakt
   - Provide: Name, Email, Phone, Company (optional)

2. **Configure your key:**
   - Open `src/api/eurojackpot.ts`
   - Replace `YOUR_API_KEY_HERE` with your actual key:
   ```typescript
   const LOTTO_API_KEY = 'your_actual_api_key_here'
   ```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## 📖 Documentation

- **[SETUP_API_KEY.md](SETUP_API_KEY.md)** - Step-by-step API key setup guide
- **[LOTTO_PL_API_INTEGRATION.md](LOTTO_PL_API_INTEGRATION.md)** - Complete API documentation
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - What was changed and why

## 🔧 Configuration

### API Configuration
Located in `src/api/eurojackpot.ts`:
```typescript
const LOTTO_API_KEY = 'YOUR_API_KEY_HERE'  // Replace this!
const BASE_URL = 'https://developers.lotto.pl/api/open/v1'
```

### Using Environment Variables (Recommended)
Create `.env.local`:
```env
VITE_LOTTO_API_KEY=your_actual_key_here
```

Update `src/api/eurojackpot.ts`:
```typescript
const LOTTO_API_KEY = import.meta.env.VITE_LOTTO_API_KEY || 'YOUR_API_KEY_HERE'
```

## 📊 Data Structure

### Display Columns
- **Draw #** - Unique draw identifier
- **Date** - Draw date (formatted)
- **Main Numbers** - 5 numbers (1-50)
- **Euro Numbers** - 2 numbers (1-12)

### API Response
```typescript
interface EuroJackpotDraw {
  drawSystemId: number
  drawDate: string
  numbers: number[]        // [5, 12, 23, 34, 45]
  euroNumbers: number[]    // [3, 7]
  multiplierValue?: number
  isNewEuroJackpotDraw?: boolean
}
```

## 🔐 Security

**Never commit your API key to version control!**

Add to `.gitignore`:
```
.env
.env.local
*.key
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Official Lotto.pl API** - Data source

## 📁 Project Structure

```
src/
├── api/
│   └── eurojackpot.ts       # API integration & data fetching
├── components/
│   └── ResultsTable.tsx     # Results display table
├── App.tsx                  # Main application component
├── main.tsx                 # Application entry point
└── styles.css               # Global styles
```

## 🧪 Testing

### Check Configuration
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for success message:
   ```
   ✓ Successfully retrieved X EuroJackpot draws from Lotto.pl API
   ```

### Expected Results
- **Draw Count:** 700+ draws
- **Date Range:** March 23, 2012 to present
- **All draws:** Complete historical data

## ⚠️ Troubleshooting

### 401 Unauthorized Error
- **Cause:** Invalid or missing API key
- **Solution:** Verify API key configuration in `src/api/eurojackpot.ts`

### CORS Errors
- **Cause:** Browser blocking cross-origin requests
- **Solution:** See [LOTTO_PL_API_INTEGRATION.md](LOTTO_PL_API_INTEGRATION.md) for proxy configuration

### No Data Displayed
- **Cause:** API response format issue
- **Solution:** Check browser console for errors

## 📞 Support

### API Issues
- **Email:** kontakt@lotto.pl
- **Website:** https://www.lotto.pl/kontakt
- **API Docs:** https://developers.lotto.pl/

### Application Issues
Check the documentation files:
1. [SETUP_API_KEY.md](SETUP_API_KEY.md)
2. [LOTTO_PL_API_INTEGRATION.md](LOTTO_PL_API_INTEGRATION.md)
3. [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)

## 📜 License

This project uses the official Lotto.pl API. Refer to Lotto.pl's terms of service for API usage guidelines.

## 🎲 About EuroJackpot

EuroJackpot is a transnational European lottery launched in 2012:
- Draws twice weekly (Tuesday & Friday)
- 5 main numbers (1-50)
- 2 Euro numbers (1-12)
- Minimum jackpot: €10 million
- Maximum jackpot: €120 million

## 🔄 Recent Updates

**Latest Update:** November 2024
- ✅ Migrated to official Lotto.pl API
- ✅ Complete historical data support
- ✅ Improved error handling
- ✅ Enhanced type safety
- ✅ Comprehensive documentation

## 🎯 Future Enhancements

Potential features using available API endpoints:
- [ ] Prize tier winners display
- [ ] Number frequency statistics
- [ ] Jackpot history chart
- [ ] Next draw countdown
- [ ] Multiple game support (Lotto, MiniLotto, etc.)
- [ ] Export results to CSV/Excel
- [ ] Search and filter functionality

---

**Ready to get started?** Follow the [SETUP_API_KEY.md](SETUP_API_KEY.md) guide to configure your API access!
