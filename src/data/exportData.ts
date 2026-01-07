/**
 * Utility script to export EuroJackpot draw data from localStorage to JSON file
 * Run this in browser console after loading the application with cached data
 */

import { getAllCachedDraws, exportDrawsToJson } from '../api/eurojackpot'

/**
 * Browser-compatible version to copy JSON to clipboard
 * Run this in browser console or import in your components
 */
export function copyDrawsToClipboard(): void {
  const jsonData = exportDrawsToJson()
  
  navigator.clipboard.writeText(jsonData).then(() => {
    console.log('Draw data copied to clipboard! Paste it into eurojackpot_draws.json')
    console.log(`Total draws: ${getAllCachedDraws().length}`)
  }).catch(err => {
    console.error('Failed to copy to clipboard:', err)
    console.log('You can manually copy this JSON:')
    console.log(jsonData)
  })
}

/**
 * Download draws as JSON file directly from browser
 */
export function downloadDrawsFile(): void {
  const jsonData = exportDrawsToJson()
  const draws = getAllCachedDraws()
  
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eurojackpot_draws_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  console.log(`Downloaded ${draws.length} draws as JSON file`)
}

/**
 * Console helper - paste this in browser console to export data:
 * 
 * // Step 1: Import the function
 * import { getAllCachedDraws } from './src/api/eurojackpot.ts'
 * 
 * // Step 2: Get the data
 * const draws = getAllCachedDraws()
 * 
 * // Step 3: Convert to JSON
 * const json = JSON.stringify(draws, null, 2)
 * 
 * // Step 4: Copy to clipboard (or use copy(json) in Chrome DevTools)
 * navigator.clipboard.writeText(json)
 * 
 * // Or download as file
 * const blob = new Blob([json], { type: 'application/json' })
 * const url = URL.createObjectURL(blob)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'eurojackpot_draws.json'
 * a.click()
 */
