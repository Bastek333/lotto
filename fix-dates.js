// Script to convert locale-format dates to ISO format in JSON draw files
import { readFileSync, writeFileSync } from 'fs'
const fs = { readFileSync, writeFileSync }

function toISO(dateStr) {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10)
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fixFile(filePath, label) {
  const draws = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!Array.isArray(draws)) {
    console.log(`${label}: not a plain array, skipping date fix`)
    return
  }
  const fixed = draws.map(d => ({ ...d, drawDate: toISO(d.drawDate) }))
  const nonISO = fixed.filter(d => !/^\d{4}-\d{2}-\d{2}$/.test(d.drawDate))
  console.log(`${label}: ${fixed.length} draws, ${nonISO.length} non-ISO remaining`)
  if (nonISO.length > 0) console.log('Non-ISO samples:', nonISO.slice(0, 3).map(d => d.drawDate))
  console.log(`Sample: first=${fixed[0].drawDate} last=${fixed[fixed.length - 1].drawDate}`)
  fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2))
  console.log(`Written: ${filePath}`)
}

fixFile('./public/lotto_draws.json', 'lotto (public)')
fixFile('./public/eurojackpot_draws.json', 'eurojackpot (public)')

// Sync src/data/lotto_draws.json with public version
const lottoDraws = JSON.parse(fs.readFileSync('./public/lotto_draws.json', 'utf8'))
fs.writeFileSync('./src/data/lotto_draws.json', JSON.stringify(lottoDraws, null, 2))
console.log('Synced src/data/lotto_draws.json with public/ version')

const euroDraws = JSON.parse(fs.readFileSync('./public/eurojackpot_draws.json', 'utf8'))
fs.writeFileSync('./src/data/eurojackpot_draws.json', JSON.stringify(euroDraws, null, 2))
console.log('Synced src/data/eurojackpot_draws.json with public/ version')
