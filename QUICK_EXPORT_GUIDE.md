# Quick Export Guide

## ⚡ NEW: Auto-Export Feature

### Enable Auto-Export (Recommended!)

```
Click ○ Auto-Export button → Turns green ✓ Auto-Export
                              ↓
              File auto-downloads after each refetch!
```

**One-time setup:**
1. Click the **○ Auto-Export** button in the header
2. It turns green (**✓ Auto-Export**) when enabled
3. Done! Files will now auto-download after every refetch

---

## 🚀 Three Ways to Export Historical Draw Data

### 1️⃣ In-App Export (Easiest) 

```
Open App → Wait for Data to Load → Click 💾 Export Data Button
                                         ↓
                            Browser downloads JSON file
                                         ↓
                    Save as: src/data/eurojackpot_draws.json
```

**Steps:**
1. Open the Lotto application
2. Wait for draws to load (check header for count)
3. Click the **💾 Export Data** button (top right)
4. Save the downloaded file

---

### 2️⃣ Export Helper Page

```
Open export-data.html → Click "Check LocalStorage" → Click "Download File"
                              ↓                           ↓
                      See Statistics              Get JSON file
```

**Steps:**
1. Open `export-data.html` in your browser
2. Click **📊 Check LocalStorage**
3. Review statistics (total draws, date range)
4. Click **⬇️ Download File**

---

### 3️⃣ Browser Console (Advanced)

```javascript
// Paste this in browser console (F12):

const draws = [];
const prefix = 'eurojackpot_draws_cache_v1_';

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.startsWith(prefix)) {
    const cached = localStorage.getItem(key);
    if (cached) draws.push(JSON.parse(cached));
  }
}

// Sort by date
draws.sort((a, b) => new Date(b.drawDate) - new Date(a.drawDate));

// Download
const json = JSON.stringify(draws, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'eurojackpot_draws.json';
a.click();
```

---

## 📁 Where to Save

Save the exported file to:
```
c:\Repo\Lotto\src\data\eurojackpot_draws.json
```

## ✅ Verification

Check that your exported file has:
- ✓ Valid JSON format
- ✓ Array of draw objects
- ✓ Each draw has 5 main numbers
- ✓ Each draw has 2 euro numbers
- ✓ Dates in YYYY-MM-DD format

## 📊 Expected Data

- **Total draws**: ~900+ (since 2017)
- **File size**: 200-400 KB
- **Date range**: 2017-01-03 to present
- **Format**: JSON array

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| No data found | Load main app first and wait for API fetch |
| Export button disabled | Wait for data to finish loading |
| File empty | Check browser console for errors |
| Wrong format | Use provided export functions, don't modify manually |

## 📖 More Info

- Full guide: `EXPORT_DATA_GUIDE.md`
- Implementation: `EXPORT_IMPLEMENTATION_SUMMARY.md`
- Data folder: `src/data/README.md`

---

**Quick Tip**: Method 1 (in-app button) is the easiest and most reliable!
