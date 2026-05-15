#!/usr/bin/env node

/**
 * Installation Verification Script
 * Checks if the refetch system is properly set up
 * Usage: node verify-setup.js
 */

const fs = require('fs')
const path = require('path')

const checks = []

function check(name, result, details = '') {
  checks.push({ name, result, details })
  const icon = result ? '✅' : '❌'
  const status = result ? 'OK' : 'FAILED'
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`)
}

console.log('\n🔍 Verifying Refetch Installation...\n')

// Check Node files
const projectRoot = process.cwd()

check(
  'Backend server file',
  fs.existsSync(path.join(projectRoot, 'server.js')),
  'server.js'
)

check(
  'PHP upload endpoint',
  fs.existsSync(path.join(projectRoot, 'public', 'api-upload-draws.php')),
  'api-upload-draws.php'
)

check(
  'Sync utilities',
  fs.existsSync(path.join(projectRoot, 'src', 'utils', 'dataSyncService.ts')),
  'dataSyncService.ts'
)

// Check dependencies
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  
  check('express dependency', !!pkg.dependencies?.express, pkg.dependencies?.express || 'not found')
  check('cors dependency', !!pkg.dependencies?.cors, pkg.dependencies?.cors || 'not found')
  check('concurrently dev dependency', !!pkg.devDependencies?.concurrently, pkg.devDependencies?.concurrently || 'not found')
  
  check('server script', !!pkg.scripts?.server, '"npm run server"')
  check('dev:all script', !!pkg.scripts?.['dev:all'], '"npm run dev:all"')
} catch (err) {
  check('package.json', false, err.message)
}

// Check documentation
const docs = [
  'REFETCH_GUIDE.md',
  'REFETCH_IMPLEMENTATION.md',
  'REFETCH_QUICK_REFERENCE.md',
  'REFETCH_SETUP_COMPLETE.md'
]

docs.forEach(doc => {
  check(
    `Documentation: ${doc}`,
    fs.existsSync(path.join(projectRoot, doc))
  )
})

// Check test scripts
check(
  'Test scripts',
  fs.existsSync(path.join(projectRoot, 'test-refetch.bat')) &&
  fs.existsSync(path.join(projectRoot, 'test-refetch.sh'))
)

// Check data directory
const dataDir = path.join(projectRoot, 'src', 'data')
check('Data directory', fs.existsSync(dataDir), dataDir)

// Check vite config
try {
  const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.js'), 'utf8')
  check(
    'Vite proxy config',
    viteConfig.includes('localhost:3001'),
    'Backend proxy configured'
  )
} catch (err) {
  check('Vite proxy config', false, err.message)
}

// Summary
console.log('\n' + '='.repeat(60))

const passed = checks.filter(c => c.result).length
const total = checks.length
const percentage = Math.round((passed / total) * 100)

console.log(`\n📊 Summary: ${passed}/${total} checks passed (${percentage}%)\n`)

if (percentage === 100) {
  console.log('✅ Installation Complete!')
  console.log('\n🚀 Next steps:')
  console.log('  1. Install dependencies:  npm install')
  console.log('  2. Start servers:         npm run dev:all')
  console.log('  3. Open browser:          http://localhost:5173')
  console.log('  4. Click Refetch button')
  console.log('  5. Check src/data/ folder for saved files\n')
} else {
  console.log('⚠️  Some checks failed. Please review above.')
  console.log('\nTroubleshooting:')
  console.log('  - Run: npm install')
  console.log('  - Check file paths')
  console.log('  - Re-run: node verify-setup.js\n')
}

process.exit(percentage === 100 ? 0 : 1)
