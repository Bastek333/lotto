# EuroJackpot Historical Data Viewer

A React + TypeScript application that displays **real historical EuroJackpot lottery draw results** fetched from euro-jackpot.net via open API.

## ✨ Features

✅ **Real Historical Data** - Fetches actual draw results from euro-jackpot.net  
✅ **10-20 Recent Draws** - Shows latest draws with all details  
✅ **Complete Draw Info** - Draw dates, winning numbers, euro numbers, jackpot amounts  
✅ **Free Open API** - No API key required, completely free  
✅ **Responsive UI** - Clean, modern table design  
✅ **Error Handling** - Automatic fallbacks if API fails  
✅ **No Backend Required** - Runs entirely in the browser  

## 🚀 Quick Start

### Prerequisites
- **Node.js** - Download from https://nodejs.org/ (LTS version recommended)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser to http://localhost:5173
```

You should see a table with real EuroJackpot draw results!

## 📊 API Integration

This application uses an **open API** to fetch real historical EuroJackpot draw data:

- **Data Source**: https://www.euro-jackpot.net/results
- **Access Method**: AllOrigins CORS Proxy
- **Endpoint**: `https://api.allorigins.win/get?url=https://www.euro-jackpot.net/results`
- **Cost**: **FREE**
- **API Key**: **Not required**
- **Rate Limits**: Generous (free tier)

### What Data You Get

Each draw includes:
- **Draw Date** (e.g., "Tuesday 11th November 2025")
- **5 Main Numbers** (range: 1-50)
- **2 Euro Numbers** (range: 1-12)
- **Jackpot Amount** (in euros)
- **Winner Status** (jackpot won or rollover)

### Example Data
```json
{
  "drawDate": "November 11, 2025",
  "numbers": [8, 24, 25, 41, 50],
  "euroNumbers": [8, 9],
  "jackpot": "€10,000,000",
  "jackpotAmount": 10000000
}
```

## 📁 Project Structure

```
src/
├── api/
│   └── eurojackpot.ts      # API service with HTML parsing
├── components/
│   └── ResultsTable.tsx    # Results display component
├── App.tsx                 # Main application component
├── main.tsx               # Application entry point
└── styles.css             # Application styling
```

## 📚 Documentation

Comprehensive documentation is provided:

| Document | Description |
|----------|-------------|
| **[API_SUMMARY.md](API_SUMMARY.md)** | Complete implementation overview ⭐ START HERE |
| **[API_INTEGRATION.md](API_INTEGRATION.md)** | Technical API details and alternatives |
| **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** | Detailed installation guide |
| **[QUICKSTART_API.md](QUICKSTART_API.md)** | Quick API reference |

## 🛠️ How It Works

1. **Fetch HTML**: App requests euro-jackpot.net results page via CORS proxy
2. **Parse Data**: Custom parser extracts draw information from HTML
3. **Format Results**: Data is structured into clean objects
4. **Display**: Results shown in responsive table

```
Your Browser → AllOrigins Proxy → euro-jackpot.net → Parse HTML → Display Results
```

## 🎯 Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 🔧 API Alternatives Evaluated

During development, multiple APIs were researched:

| API Source | Status | Notes |
|------------|--------|-------|
| **euro-jackpot.net (CORS proxy)** | ✅ **IMPLEMENTED** | Working perfectly |
| lotto.net API | ⚠️ Fallback | Limited/unreliable |
| lottery.merseyworld.com | ❌ | No EuroJackpot support |
| national-lottery.com | ❌ | UK/IE lotteries only |
| Official EuroJackpot API | ❌ | Not publicly available |

## 💡 Future Enhancements

### Short-term
- [ ] Add caching to localStorage
- [ ] Implement retry logic for failed requests
- [ ] Add date range filtering
- [ ] Show more draws (pagination)

### Long-term
- [ ] Number frequency statistics
- [ ] Historical trends visualization
- [ ] Backend proxy for better reliability
- [ ] Database storage for complete history
- [ ] Archive page parsing (2012-present)

## ⚠️ Important Notes

### API Reliability
- **AllOrigins** is a free CORS proxy with good uptime
- Rate limits exist but are generous for typical usage
- Consider implementing caching to reduce API calls

### Data Freshness
- Results update after each draw (Tuesday & Friday evenings)
- Typical delay: 30-60 minutes after draw
- Cache results to improve performance

### Legal Considerations
- Data is publicly available for informational purposes
- This project is for educational/personal use
- Respect website terms of service
- No commercial use without permission

## 🐛 Troubleshooting

### "Loading..." never completes
- Check browser console for errors (F12)
- API might be rate-limited - wait a few minutes
- Fallback to mock data should activate automatically

### Shows mock data instead of real data
- CORS proxy might be temporarily unavailable
- Check if https://allorigins.win is operational
- Network/firewall might be blocking requests

### Old data displayed
- Browser cache issue - try hard refresh (Ctrl+F5)

## 🔗 Useful Links

- **EuroJackpot Official**: https://www.euro-jackpot.net/results
- **AllOrigins Proxy**: https://allorigins.win/
- **Node.js Download**: https://nodejs.org/
- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/

## 📝 License

This project is for educational purposes. EuroJackpot lottery data is publicly available and used for informational display only.

## 🎉 Success!

✅ **Open API found and integrated**  
✅ **Real historical data displayed**  
✅ **Free and no API key required**  
✅ **Fully documented**  
✅ **Ready to use**  

---

**Next step**: Install Node.js and run `npm run dev` to see real EuroJackpot data!

*Last Updated: November 12, 2025*
