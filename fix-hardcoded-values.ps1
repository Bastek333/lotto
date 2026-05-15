# Fix hardcoded values in ImprovedPrediction.tsx
$filePath = "c:\Repo\lotto\src\components\ImprovedPrediction.tsx"

# Read the file
$content = Get-Content -Path $filePath -Raw

# Replace all hardcoded 50 loops
$content = $content -replace 'for \(let num = 1; num <= 50; num\+\+\)', 'for (let num = 1; num <= maxMainNumber; num++)'

# Replace Math.random() * 50 + 1
$content = $content -replace 'Math\.floor\(Math\.random\(\) \* 50\) \+ 1', 'Math.floor(Math.random() * maxMainNumber) + 1'

# Replace currentNum <= 50
$content = $content -replace 'currentNum <= 50', 'currentNum <= maxMainNumber'

# Replace .slice(0, 5) in returns (main numbers only, not euro)
$content = $content -replace '\.slice\(0, 5\)\.map\(s => s\.number\)', '.slice(0, maxMainSelection).map(s => s.number)'
$content = $content -replace '\.slice\(0, 5\)\.map\(\[num\]\]', '.slice(0, maxMainSelection).map([num]'
$content = $content -replace '\.slice\(0, 5\)\.sort\(\(a, b\) => a - b\)', '.slice(0, maxMainSelection).sort((a, b) => a - b)'

# Replace while (predictedMain.length < 5)
$content = $content -replace 'while \(predictedMain\.length < 5\)', 'while (predictedMain.length < maxMainSelection)'
$content = $content -replace 'while \(selected\.length < 5\)', 'while (selected.length < maxMainSelection)'

# Replace for (let pos = 0; pos < 5; pos++)
$content = $content -replace 'for \(let pos = 0; pos < 5; pos\+\+\)', 'for (let pos = 0; pos < maxMainSelection; pos++)'

# Replace hardcoded [0, 0, 0, 0, 0] arrays with dynamic ones (this is tricky, skip for now)

# Replace dependency arrays }, [historicalDraws]) with }, [historicalDraws, maxMainNumber, maxMainSelection])
$content = $content -replace '\}, \[historicalDraws\]\)', '}, [historicalDraws, maxMainNumber, maxMainSelection])'

# Write back to file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Fixed hardcoded values in ImprovedPrediction.tsx"
