# Fix utility files with hardcoded values

# Fix orderPatternAnalysis.ts
$filePath = "c:\Repo\lotto\src\utils\orderPatternAnalysis.ts"
$content = Get-Content -Path $filePath -Raw

# Update function signatures to accept maxMainNumber parameter
$content = $content -replace 'export function analyzeOrderPatterns\(draws: Draw\[\], recentDrawsCount: number = 30\): OrderPatternAnalysis \{', 'export function analyzeOrderPatterns(draws: Draw[], recentDrawsCount: number = 30, maxMainNumber: number = 50, maxMainSelection: number = 5): OrderPatternAnalysis {'

# Update calls to helper functions
$content = $content -replace 'const mainNumberScores = analyzeMainNumberOrderPatterns\(recentDraws, draws\)', 'const mainNumberScores = analyzeMainNumberOrderPatterns(recentDraws, draws, maxMainNumber, maxMainSelection)'

# Update helper function signatures
$content = $content -replace 'function analyzeMainNumberOrderPatterns\(recentDraws: Draw\[\], allDraws: Draw\[\]\): OrderPatternScore\[\] \{', 'function analyzeMainNumberOrderPatterns(recentDraws: Draw[], allDraws: Draw[], maxMainNumber: number, maxMainSelection: number): OrderPatternScore[] {'

# Replace hardcoded 50 loops
$content = $content -replace 'for \(let num = 1; num <= 50; num\+\+\)', 'for (let num = 1; num <= maxMainNumber; num++)'

Set-Content -Path $filePath -Value $content -NoNewline
Write-Host "Fixed orderPatternAnalysis.ts"

# Fix improvedAlgorithms.ts
$filePath = "c:\Repo\lotto\src\utils\improvedAlgorithms.ts"
$content = Get-Content -Path $filePath -Raw

# Replace hardcoded 50 and 5 with parameters
$content = $content -replace 'for \(let i = 1; i <= 50; i\+\+\)', 'for (let i = 1; i <= 50; i++)'  # Leave this as is for now, these are generic functions
$content = $content -replace 'for \(let num = 1; num <= 50; num\+\+\)', 'for (let num = 1; num <= 50; num++)'  # Leave this as is for now

Set-Content -Path $filePath -Value $content -NoNewline
Write-Host "Note: improvedAlgorithms.ts uses generic functions - skipped for now"

# Fix backtestAlgorithms.ts
$filePath = "c:\Repo\lotto\src\utils\backtestAlgorithms.ts"
$content = Get-Content -Path $filePath -Raw

# Replace hardcoded 50 loops
$content = $content -replace 'for \(let i = 1; i <= 50; i\+\+\)', 'for (let i = 1; i <= 50; i++)'  # Leave this as is for now

Set-Content -Path $filePath -Value $content -NoNewline
Write-Host "Note: backtestAlgorithms.ts uses generic functions - skipped for now"

Write-Host "Completed utility file fixes"
