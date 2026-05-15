# Fix hardcoded values in AdaptivePredictor.tsx and AdvancedPredictor.tsx

# Fix AdaptivePredictor.tsx
$filePath = "c:\Repo\lotto\src\components\AdaptivePredictor.tsx"
$content = Get-Content -Path $filePath -Raw

# Check if game detection already exists
if ($content -notmatch 'const hasEuroNumbers') {
    # Add game detection after "export default function AdaptivePredictor"
    $content = $content -replace '(export default function AdaptivePredictor\(\{ data \}: Props\): JSX\.Element \{[^\}]+?\n)(  const \[isLearning)', '$1  const hasEuroNumbers = data.some(d => d.euroNumbers && d.euroNumbers.length > 0)$2  const maxMainNumber = hasEuroNumbers ? 50 : 49$2  const maxMainSelection = hasEuroNumbers ? 5 : 6$2$2'
}

# Replace all hardcoded 50 loops
$content = $content -replace 'for \(let num = 1; num <= 50; num\+\+\)', 'for (let num = 1; num <= maxMainNumber; num++)'

# Replace .slice(0, 5) for main numbers
$content = $content -replace '\.slice\(0, 5\)\.map\(s => s\.number\)', '.slice(0, maxMainSelection).map(s => s.number)'
$content = $content -replace '\.slice\(0, 5\)\.sort\(\(a, b\) => a - b\)', '.slice(0, maxMainSelection).sort((a, b) => a - b)'
$content = $content -replace 'for \(let position = 0; position < 5; position\+\+\)', 'for (let position = 0; position < maxMainSelection; position++)'
$content = $content -replace 'selectedNumbers\.length < 5', 'selectedNumbers.length < maxMainSelection'

Set-Content -Path $filePath -Value $content -NoNewline
Write-Host "Fixed AdaptivePredictor.tsx"

# Fix AdvancedPredictor.tsx
$filePath = "c:\Repo\lotto\src\components\AdvancedPredictor.tsx"
$content = Get-Content -Path $filePath -Raw

# Check if game detection already exists
if ($content -notmatch 'const hasEuroNumbers') {
    # Add game detection at the start of the component function
    $content = $content -replace '(export default function AdvancedPredictor\(\{ data \}: Props\): JSX\.Element \{)', '$1$2  const hasEuroNumbers = data.some(d => d.euroNumbers && d.euroNumbers.length > 0)$2  const maxMainNumber = hasEuroNumbers ? 50 : 49$2  const maxMainSelection = hasEuroNumbers ? 5 : 6$2'
}

# Replace all hardcoded 50 loops
$content = $content -replace 'for \(let num = 1; num <= 50; num\+\+\)', 'for (let num = 1; num <= maxMainNumber; num++)'

# Replace .slice(0, 5) for main numbers
$content = $content -replace '\.slice\(0, 5\)\.map\(([^\)]+)\)', '.slice(0, maxMainSelection).map($1)'
$content = $content -replace '\.slice\(0, 5\)\.sort\(\(a, b\) => a - b\)', '.slice(0, maxMainSelection).sort((a, b) => a - b)'

Set-Content -Path $filePath -Value $content -NoNewline
Write-Host "Fixed AdvancedPredictor.tsx"
