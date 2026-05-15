/**
 * GET /api/draws?gameType=lotto|eurojackpot
 * Serve saved draws file for the requested game type
 */
app.get('/api/draws', (req, res) => {
  try {
    const gameType = req.query.gameType === 'lotto' ? 'lotto' : 'eurojackpot';
    const filename = gameType === 'eurojackpot' ? 'eurojackpot_draws.json' : 'lotto_draws.json';
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'Draws file not found' });
    }
    const data = fs.readFileSync(filepath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    console.error('Error serving draws file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
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
const DATA_DIR = path.join(__dirname, 'src', 'data')
const BACKUP_DIR = path.join(__dirname, 'server-backups')

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

/**
 * POST /api/save-draws
 * Save draw data to local project directory
 * Body: { gameType: 'eurojackpot' | 'lotto', draws: Array }
 */
app.post('/api/save-draws', (req, res) => {
  try {
    const { gameType, draws } = req.body

    if (!gameType || !Array.isArray(draws)) {
      return res.status(400).json({
        success: false,
        error: 'Missing gameType or draws array'
      })
    }

    // Determine filename
    const filename = gameType === 'eurojackpot' ? 'eurojackpot_draws.json' : 'lotto_draws.json'
    const filepath = path.join(DATA_DIR, filename)
    const backupName = `${gameType}_draws_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const backupPath = path.join(BACKUP_DIR, backupName)

    // Create backup of existing file if it exists
    if (fs.existsSync(filepath)) {
      try {
        const existingData = fs.readFileSync(filepath, 'utf8')
        fs.writeFileSync(backupPath, existingData)
        console.log(`✓ Backup created: ${backupName}`)
      } catch (backupErr) {
        console.warn('Warning: Could not create backup', backupErr.message)
      }
    }

    // Write new data
    const jsonData = JSON.stringify(draws, null, 2)
    fs.writeFileSync(filepath, jsonData)

    console.log(`✓ Saved ${draws.length} ${gameType} draws to ${filename}`)

    res.json({
      success: true,
      message: `Saved ${draws.length} draws to ${filename}`,
      filepath,
      drawsCount: draws.length,
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
    const eurojackpotPath = path.join(DATA_DIR, 'eurojackpot_draws.json')
    if (fs.existsSync(eurojackpotPath)) {
      const data = JSON.parse(fs.readFileSync(eurojackpotPath, 'utf8'))
      const stats = fs.statSync(eurojackpotPath)
      status.eurojackpot = {
        exists: true,
        count: data.length,
        size: stats.size,
        lastModified: stats.mtime
      }
    } else {
      status.eurojackpot = { exists: false, count: 0 }
    }

    // Check lotto file
    const lottoPath = path.join(DATA_DIR, 'lotto_draws.json')
    if (fs.existsSync(lottoPath)) {
      const data = JSON.parse(fs.readFileSync(lottoPath, 'utf8'))
      const stats = fs.statSync(lottoPath)
      status.lotto = {
        exists: true,
        count: data.length,
        size: stats.size,
        lastModified: stats.mtime
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
