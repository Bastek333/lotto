/**
 * Lotto Data Server
 * Handles local data storage and server-side backups
 * Run with: node server.js
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Data directory for storing JSON files
// Keep public/ as primary so dev saves update the same files used in production deploys.
const DATA_DIR = path.join(__dirname, 'public')
const LEGACY_DATA_DIR = path.join(__dirname, 'src', 'data')
const BACKUP_DIR = path.join(__dirname, 'server-backups')

function getGameFilename(gameType) {
  return gameType === 'eurojackpot' ? 'eurojackpot_draws.json' : 'lotto_draws.json'
}

function getCombinedFilename() {
  return 'lottery_draws.json'
}

function getPrimaryAndFallbackPaths(filename) {
  return {
    primaryPath: path.join(DATA_DIR, filename),
    fallbackPath: path.join(LEGACY_DATA_DIR, filename)
  }
}

function getFreshestExistingPath(...paths) {
  const existingPaths = paths.filter(p => fs.existsSync(p))
  if (existingPaths.length === 0) {
    return null
  }

  return existingPaths.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]
}

function normalizeCombinedPayload(raw) {
  const base = (raw && typeof raw === 'object') ? { ...raw } : {}
  const games = (base.games && typeof base.games === 'object') ? { ...base.games } : {}

  for (const gameType of ['eurojackpot', 'lotto']) {
    const gameEntry = (games[gameType] && typeof games[gameType] === 'object') ? { ...games[gameType] } : {}
    const gameMeta = (gameEntry.meta && typeof gameEntry.meta === 'object') ? { ...gameEntry.meta } : {
      gameType,
      lastFetchedAt: null,
      drawsCount: 0,
      source: 'unknown'
    }
    const gameDraws = normalizeDrawCollection(gameEntry)

    games[gameType] = {
      meta: gameMeta,
      draws: gameDraws
    }
  }

  return {
    meta: {
      lastUpdatedAt: base.meta?.lastUpdatedAt || new Date().toISOString(),
      source: base.meta?.source || 'unknown'
    },
    games
  }
}

function getCompletenessScore(draw) {
  const mainCount = Array.isArray(draw?.numbers) ? draw.numbers.length : 0
  const euroCount = Array.isArray(draw?.euroNumbers) ? draw.euroNumbers.length : 0
  return (mainCount * 100) + euroCount
}

function normalizeDrawCollection(raw) {
  if (Array.isArray(raw)) {
    return raw
  }
  if (raw && Array.isArray(raw.draws)) {
    return raw.draws
  }
  return []
}

function toDateKey(dateValue) {
  if (typeof dateValue === 'string') {
    const directDateMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/)
    if (directDateMatch) {
      return directDateMatch[1]
    }
  }

  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return typeof dateValue === 'string' ? dateValue : ''
  }

  const year = parsedDate.getFullYear()
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsedDate.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mergeDrawsByDate(existingDraws, incomingDraws) {
  const merged = new Map()

  for (const draw of existingDraws) {
    if (!draw || !draw.drawDate) continue
    const dateKey = toDateKey(draw.drawDate)
    if (!dateKey) continue
    merged.set(dateKey, { ...draw, drawDate: dateKey })
  }

  for (const draw of incomingDraws) {
    if (!draw || !draw.drawDate) continue
    const dateKey = toDateKey(draw.drawDate)
    if (!dateKey) continue
    const normalizedDraw = { ...draw, drawDate: dateKey }

    const current = merged.get(dateKey)
    if (!current) {
      merged.set(dateKey, normalizedDraw)
      continue
    }

    if (getCompletenessScore(normalizedDraw) >= getCompletenessScore(current)) {
      merged.set(dateKey, { ...current, ...normalizedDraw })
    }
  }

  return [...merged.values()].sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
}

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

/**
 * GET /api/draws?gameType=lotto|eurojackpot
 * Serve saved draws file for the requested game type
 */
app.get('/api/draws', (req, res) => {
  try {
    const requestedGameType = String(req.query.gameType || 'eurojackpot').toLowerCase()
    if (requestedGameType !== 'eurojackpot' && requestedGameType !== 'lotto') {
      return res.status(400).json({ success: false, error: 'Invalid gameType' })
    }

    const filename = getGameFilename(requestedGameType)
    const { primaryPath, fallbackPath } = getPrimaryAndFallbackPaths(filename)
    const combinedFilename = getCombinedFilename()
    const { primaryPath: combinedPrimaryPath, fallbackPath: combinedFallbackPath } = getPrimaryAndFallbackPaths(combinedFilename)

    const freshestPath = getFreshestExistingPath(primaryPath, fallbackPath, combinedPrimaryPath, combinedFallbackPath)

    if (!freshestPath) {
      return res.status(404).json({ success: false, error: 'Draws file not found' })
    }

    const data = fs.readFileSync(freshestPath, 'utf8')
    const decoded = JSON.parse(data)

    if (decoded && typeof decoded === 'object' && decoded.games && decoded.games[requestedGameType]) {
      // Combined file format: { games: { eurojackpot: { meta, draws }, lotto: { meta, draws } } }
      const gamePayload = decoded.games[requestedGameType]
      const draws = normalizeDrawCollection(gamePayload)
      const lastFetchedAt = gamePayload.meta?.lastFetchedAt || new Date(fs.statSync(freshestPath).mtimeMs).toISOString()
      return res.json({
        meta: {
          gameType: requestedGameType,
          lastFetchedAt,
          source: gamePayload.meta?.source || 'combined-server-json'
        },
        draws
      })
    }

    if (decoded && typeof decoded === 'object' && Array.isArray(decoded.draws) && decoded.meta) {
      // Per-game file format: { meta, draws } (written by dev server or PHP)
      const lastFetchedAt = decoded.meta.lastFetchedAt || new Date(fs.statSync(freshestPath).mtimeMs).toISOString()
      return res.json({
        meta: {
          gameType: requestedGameType,
          lastFetchedAt,
          source: decoded.meta.source || 'server-json'
        },
        draws: decoded.draws
      })
    }

    res.setHeader('Content-Type', 'application/json')
    res.send(data)
  } catch (error) {
    console.error('Error serving draws file:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/save-draws
 * Save draw data to local project directory
 * Body: { gameType: 'eurojackpot' | 'lotto', draws: Array }
 */
app.post('/api/save-draws', (req, res) => {
  try {
    const { gameType: rawGameType, draws } = req.body
    const gameType = String(rawGameType || '').toLowerCase()

    if (!gameType || !Array.isArray(draws)) {
      return res.status(400).json({
        success: false,
        error: 'Missing gameType or draws array'
      })
    }

    if (gameType !== 'eurojackpot' && gameType !== 'lotto') {
      return res.status(400).json({
        success: false,
        error: 'Invalid gameType'
      })
    }

    // Determine filename
    const filename = getGameFilename(gameType)
    const { primaryPath, fallbackPath } = getPrimaryAndFallbackPaths(filename)
    const backupName = `${gameType}_draws_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const backupPath = path.join(BACKUP_DIR, backupName)

    const existingFilepath = fs.existsSync(primaryPath)
      ? primaryPath
      : (fs.existsSync(fallbackPath) ? fallbackPath : null)

    // Create backup of existing file if it exists
    if (existingFilepath) {
      try {
        const existingData = fs.readFileSync(existingFilepath, 'utf8')
        fs.writeFileSync(backupPath, existingData)
        console.log(`✓ Backup created: ${backupName}`)
      } catch (backupErr) {
        console.warn('Warning: Could not create backup', backupErr.message)
      }
    }

    const existingRaw = existingFilepath ? JSON.parse(fs.readFileSync(existingFilepath, 'utf8')) : []
    const existingDraws = normalizeDrawCollection(existingRaw)
    const mergedDraws = mergeDrawsByDate(existingDraws, draws)

    // Write merged data with meta wrapper (consistent with PHP backend)
    const saveTimestamp = req.body.timestamp || new Date().toISOString()
    const perGamePayload = {
      meta: {
        gameType,
        lastFetchedAt: saveTimestamp,
        drawsCount: mergedDraws.length,
        source: req.body.source || 'web-app'
      },
      draws: mergedDraws
    }
    const jsonData = JSON.stringify(perGamePayload, null, 2)
    fs.writeFileSync(primaryPath, jsonData)

    // Keep legacy path in sync for older tooling that still reads src/data.
    try {
      fs.writeFileSync(fallbackPath, jsonData)
    } catch (legacyWriteError) {
      console.warn('Warning: Could not sync legacy data path:', legacyWriteError.message)
    }

    // Keep a combined file with both games to simplify deployments that prefer one shared file.
    const combinedFilename = getCombinedFilename()
    const { primaryPath: combinedPrimaryPath, fallbackPath: combinedFallbackPath } = getPrimaryAndFallbackPaths(combinedFilename)
    const existingCombinedPath = getFreshestExistingPath(combinedPrimaryPath, combinedFallbackPath)
    let existingCombined = {}
    if (existingCombinedPath) {
      try {
        existingCombined = JSON.parse(fs.readFileSync(existingCombinedPath, 'utf8'))
      } catch (combinedReadError) {
        console.warn('Warning: Could not parse combined file, recreating it:', combinedReadError.message)
      }
    }

    const combinedPayload = normalizeCombinedPayload(existingCombined)
    combinedPayload.meta.lastUpdatedAt = saveTimestamp
    combinedPayload.meta.source = req.body.source || 'web-app'
    combinedPayload.games[gameType] = {
      meta: {
        gameType,
        lastFetchedAt: saveTimestamp,
        drawsCount: mergedDraws.length,
        source: req.body.source || 'web-app'
      },
      draws: mergedDraws
    }

    const combinedJsonData = JSON.stringify(combinedPayload, null, 2)
    fs.writeFileSync(combinedPrimaryPath, combinedJsonData)
    try {
      fs.writeFileSync(combinedFallbackPath, combinedJsonData)
    } catch (combinedLegacyWriteError) {
      console.warn('Warning: Could not sync legacy combined path:', combinedLegacyWriteError.message)
    }

    console.log(`✓ Saved ${mergedDraws.length} ${gameType} draws to ${filename} (incoming ${draws.length})`)

    res.json({
      success: true,
      message: `Saved ${mergedDraws.length} draws to ${filename}`,
      filepath: primaryPath,
      combinedFilepath: combinedPrimaryPath,
      drawsCount: mergedDraws.length,
      merged: {
        existingCount: existingDraws.length,
        incomingCount: draws.length,
        resultCount: mergedDraws.length
      },
      gameType
    })
  } catch (error) {
    console.error('Error saving draws:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/draws-status
 * Get information about saved draw files
 */
app.get('/api/draws-status', (req, res) => {
  try {
    const status = {}

    // Check eurojackpot file
    const eurojackpotPrimaryPath = path.join(DATA_DIR, 'eurojackpot_draws.json')
    const eurojackpotFallbackPath = path.join(LEGACY_DATA_DIR, 'eurojackpot_draws.json')
    const eurojackpotPath = fs.existsSync(eurojackpotPrimaryPath) ? eurojackpotPrimaryPath : eurojackpotFallbackPath
    if (fs.existsSync(eurojackpotPath)) {
      const data = JSON.parse(fs.readFileSync(eurojackpotPath, 'utf8'))
      const draws = normalizeDrawCollection(data)
      const stats = fs.statSync(eurojackpotPath)
      status.eurojackpot = {
        exists: true,
        count: draws.length,
        size: stats.size,
        lastModified: stats.mtime,
        filepath: eurojackpotPath
      }
    } else {
      status.eurojackpot = { exists: false, count: 0 }
    }

    // Check lotto file
    const lottoPrimaryPath = path.join(DATA_DIR, 'lotto_draws.json')
    const lottoFallbackPath = path.join(LEGACY_DATA_DIR, 'lotto_draws.json')
    const lottoPath = fs.existsSync(lottoPrimaryPath) ? lottoPrimaryPath : lottoFallbackPath
    if (fs.existsSync(lottoPath)) {
      const data = JSON.parse(fs.readFileSync(lottoPath, 'utf8'))
      const draws = normalizeDrawCollection(data)
      const stats = fs.statSync(lottoPath)
      status.lotto = {
        exists: true,
        count: draws.length,
        size: stats.size,
        lastModified: stats.mtime,
        filepath: lottoPath
      }
    } else {
      status.lotto = { exists: false, count: 0 }
    }

    // Check backups
    const backups = fs.readdirSync(BACKUP_DIR).map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      size: fs.statSync(path.join(BACKUP_DIR, file)).size
    }))

    status.backups = backups

    res.json(status)
  } catch (error) {
    console.error('Error getting draws status:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/backups
 * List all backup files
 */
app.get('/api/backups', (req, res) => {
  try {
    const backups = fs.readdirSync(BACKUP_DIR)
      .map(file => {
        const filepath = path.join(BACKUP_DIR, file)
        const stats = fs.statSync(filepath)
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      })
      .sort((a, b) => b.modified - a.modified)

    res.json({
      backups,
      total: backups.length
    })
  } catch (error) {
    console.error('Error getting backups:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dataDir: DATA_DIR,
    backupDir: BACKUP_DIR
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: err.message
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n🎰 Lotto Data Server running on http://localhost:${PORT}`)
  console.log(`📁 Data directory: ${DATA_DIR}`)
  console.log(`📦 Backup directory: ${BACKUP_DIR}`)
  console.log('\nAvailable endpoints:')
  console.log('  POST   /api/save-draws  - Save draw data')
  console.log('  GET    /api/draws-status - Get file status')
  console.log('  GET    /api/backups      - List backups')
  console.log('  GET    /api/health       - Health check\n')
})

export default app
