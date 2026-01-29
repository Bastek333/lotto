import React, { useEffect, useState } from 'react'
import ResultsTable from './components/ResultsTable'
import FrequencyAnalysis from './components/FrequencyAnalysis'
import CombinationAnalysis from './components/CombinationAnalysis'
import CombinationChecker from './components/CombinationChecker'
import NextDrawPrediction from './components/NextDrawPrediction'
import FollowingDrawsAnalysis from './components/FollowingDrawsAnalysis'
import ImprovedPrediction from './components/ImprovedPrediction'
import AdvancedPredictor from './components/AdvancedPredictor'
import AdaptivePredictor from './components/AdaptivePredictor'
import BigNumberPredictor from './components/BigNumberPredictor'
import { fetchEuroJackpotResults, getAllCachedDraws, getIncompleteCachedDates, downloadDrawsAsJson } from './api/eurojackpot'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
  jackpot?: string
  jackpotAmount?: string
}

type TabType = 'results' | 'frequency' | 'combinations' | 'checker' | 'prediction' | 'following' | 'improved' | 'advanced' | 'adaptive' | 'bignumber'

export default function App(): JSX.Element {
  const [data, setData] = useState<Draw[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('results')
  const [loading, setLoading] = useState<boolean>(false)
  const [drawsCount, setDrawsCount] = useState<number>(0)
  const [useRange, setUseRange] = useState<boolean>(false)
  const [rangeFrom, setRangeFrom] = useState<number>(1)
  const [rangeTo, setRangeTo] = useState<number>(0)
  const [optimalRange, setOptimalRange] = useState<{from: number, to: number, score: number, algorithm: string} | null>(null)
  const [autoExport, setAutoExport] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoExportEnabled')
    // Default to true (enabled) if no preference saved
    return saved === 'false' ? false : true
  })
  const [exportNotification, setExportNotification] = useState<string>('')

  // Function to fetch data from API
  const fetchData = async (forceRefetch: boolean = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // First, load cached data immediately (unless forcing refetch)
      if (!forceRefetch) {
        const cachedDraws = getAllCachedDraws()
        if (cachedDraws.length > 0) {
          console.log(`Loaded ${cachedDraws.length} draws from cache`)
          const draws = cachedDraws.map(d => ({
            drawDate: d.drawDate,
            numbers: d.numbers,
            euroNumbers: d.euroNumbers,
            jackpot: d.jackpot,
            jackpotAmount: d.jackpotAmount?.toString()
          }))
          setData(draws)
          
          // Check for incomplete draws
          const incompleteDates = getIncompleteCachedDates()
          if (incompleteDates.length > 0) {
            console.log(`Found ${incompleteDates.length} draws with missing numbers, refetching those dates...`)
            // Refetch only incomplete dates in the background
            setTimeout(() => fetchIncompleteDraws(), 100)
            return
          }
        }
      }
      
      // Fetch from API (full refetch)
      console.log(forceRefetch ? 'Force refetching all EuroJackpot data...' : 'Checking for updated EuroJackpot data...')
      const apiDraws = await fetchEuroJackpotResults(false)
      
      const draws = apiDraws.map(d => ({
        drawDate: d.drawDate,
        numbers: d.numbers,
        euroNumbers: d.euroNumbers,
        jackpot: d.jackpot,
        jackpotAmount: d.jackpotAmount?.toString()
      }))

      console.log(`Loaded ${draws.length} draws (updated from API)`)
      setData(draws)
      
      // Auto-export if enabled
      if (autoExport && forceRefetch) {
        console.log('Auto-export enabled, downloading updated data...')
        setExportNotification('📥 Auto-exporting → Save to src/data/eurojackpot_draws.json')
        setTimeout(() => {
          downloadDrawsAsJson()
          setExportNotification('✅ Exported! Replace src/data/eurojackpot_draws.json with downloaded file')
          setTimeout(() => setExportNotification(''), 5000)
        }, 500)
      }
    } catch (e: any) {
      console.error('Failed to load real results', e)
      const cachedDraws = getAllCachedDraws()
      if (cachedDraws.length === 0) {
        // Only show error if we don't have cached data
        setError(e.message || 'Failed to fetch real EuroJackpot data. Please try again later.')
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch only incomplete draws
  const fetchIncompleteDraws = async () => {
    try {
      console.log('Refetching incomplete draws only...')
      const apiDraws = await fetchEuroJackpotResults(true)
      
      const draws = apiDraws.map(d => ({
        drawDate: d.drawDate,
        numbers: d.numbers,
        euroNumbers: d.euroNumbers,
        jackpot: d.jackpot,
        jackpotAmount: d.jackpotAmount?.toString()
      }))

      console.log(`Updated ${draws.length} draws with complete data`)
      setData(draws)
      
      // Auto-export if enabled
      if (autoExport) {
        console.log('Auto-export enabled, downloading updated data...')
        setExportNotification('📥 Auto-exporting → Save to src/data/eurojackpot_draws.json')
        setTimeout(() => {
          downloadDrawsAsJson()
          setExportNotification('✅ Exported! Replace src/data/eurojackpot_draws.json with downloaded file')
          setTimeout(() => setExportNotification(''), 5000)
        }, 500)
      }
    } catch (e: any) {
      console.error('Failed to refetch incomplete draws', e)
      // Don't show error, keep existing data
    }
  }

  // Calculate optimal range based on algorithm performance
  React.useEffect(() => {
    if (!data || data.length < 50) {
      setOptimalRange(null)
      return
    }

    // Test different range sizes to find the best performing one
    const testRanges = [
      { from: 1, to: 50 },
      { from: 1, to: 100 },
      { from: 1, to: 150 },
      { from: 1, to: 200 },
      { from: 1, to: Math.min(300, data.length) },
      { from: 1, to: data.length }
    ]

    let bestRange = testRanges[0]
    let bestScore = 0
    let bestAlgorithm = ''

    testRanges.forEach(range => {
      if (range.to > data.length) return
      
      const testData = data.slice(range.from - 1, range.to)
      if (testData.length < 10) return

      // Advanced performance test: calculate weighted hybrid scores
      const latestDraw = testData[0]
      const historicalDraws = testData.slice(1)
      
      // Calculate weighted hybrid scores for main numbers
      const mainScores: Array<{number: number, totalScore: number}> = []
      
      for (let num = 1; num <= 50; num++) {
        const totalAppearances = historicalDraws.filter(d => d.numbers.includes(num)).length
        const frequencyScore = (totalAppearances / historicalDraws.length) * 100
        
        const recentDraws = historicalDraws.slice(0, Math.min(20, historicalDraws.length))
        const recentAppearances = recentDraws.filter(d => d.numbers.includes(num)).length
        const recentScore = (recentAppearances / recentDraws.length) * 100
        
        let gapSinceLastAppearance = 0
        for (let i = 0; i < historicalDraws.length; i++) {
          if (historicalDraws[i].numbers.includes(num)) {
            gapSinceLastAppearance = i
            break
          }
        }
        
        let gapScore = 0
        if (gapSinceLastAppearance === 0) {
          gapScore = 20
        } else if (gapSinceLastAppearance <= 3) {
          gapScore = 100
        } else if (gapSinceLastAppearance <= 8) {
          gapScore = 70
        } else if (gapSinceLastAppearance <= 15) {
          gapScore = 40
        } else {
          gapScore = 10
        }
        
        let patternMatches = 0
        let patternTotal = 0
        latestDraw.numbers.forEach(currentNum => {
          for (let i = 1; i < historicalDraws.length; i++) {
            if (historicalDraws[i].numbers.includes(currentNum)) {
              patternTotal++
              if (i > 0 && historicalDraws[i - 1].numbers.includes(num)) {
                patternMatches++
              }
            }
          }
        })
        const patternScore = patternTotal > 0 ? (patternMatches / patternTotal) * 100 : 0
        
        const totalScore = 
          frequencyScore * 0.25 + 
          recentScore * 0.30 + 
          gapScore * 0.20 + 
          patternScore * 0.25
        
        mainScores.push({ number: num, totalScore })
      }
      
      // Get top 10 numbers by total score
      const topNumbers = mainScores
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10)
        .map(s => s.number)
      
      const matches = latestDraw.numbers.filter(n => topNumbers.includes(n)).length
      const score = matches * 20 + (historicalDraws.length / 10)  // Heavily favor matches, slight preference for more data
      
      if (score > bestScore) {
        bestScore = score
        bestRange = range
        bestAlgorithm = 'Weighted Hybrid'
      }
    })

    setOptimalRange({
      from: bestRange.from,
      to: bestRange.to,
      score: bestScore,
      algorithm: bestAlgorithm
    })
  }, [data])

  // Filter draws based on drawsCount or range
  const filteredDraws = React.useMemo(() => {
    if (!data) return null
    
    if (useRange) {
      // Use range mode: from draw X to draw Y (1-indexed, newest = 1)
      const from = Math.max(1, Math.min(rangeFrom, data.length))
      const to = Math.max(from, Math.min(rangeTo, data.length))
      // Convert to 0-indexed: draw 1 is index 0, draw N is index N-1
      return data.slice(from - 1, to)
    } else {
      // Use count mode: take the most recent N draws
      if (drawsCount === 0 || drawsCount >= data.length) return data
      return data.slice(0, drawsCount)
    }
  }, [data, drawsCount, useRange, rangeFrom, rangeTo])

  useEffect(() => {
    let mounted = true
    
    // Check if there's cached data
    const cachedDraws = getAllCachedDraws()
    
    if (cachedDraws.length === 0) {
      console.log('No data in local storage, triggering refetch...')
    }
    
    // Fetch data (will check cache first if data exists)
    fetchData(false)
    
    return () => {
      mounted = false
    }
  }, [])

  // Set drawsCount and rangeTo to total data length when data loads
  useEffect(() => {
    if (data && data.length > 0) {
      if (drawsCount === 0) {
        setDrawsCount(data.length)
      }
      if (rangeTo === 0) {
        setRangeTo(data.length)
      }
    }
  }, [data])

  return (
    <div className="app">
      <header>
        <h1>Eurojackpot Draw Results</h1>
        <p className="muted">Complete historical data from official Lotto.pl API</p>
        
        <div className="header-controls">
          <div className="draws-control">
            <label>
              <input
                type="radio"
                name="draw-mode"
                checked={!useRange}
                onChange={() => setUseRange(false)}
              />
              Most recent draws:
            </label>
            <input
              type="number"
              min="1"
              max={data?.length || 1000}
              value={drawsCount}
              onChange={(e) => setDrawsCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="draws-input"
              disabled={useRange}
            />
            <span className="draws-info">of {data?.length || 0} total</span>
          </div>
          
          <div className="draws-control">
            <label>
              <input
                type="radio"
                name="draw-mode"
                checked={useRange}
                onChange={() => setUseRange(true)}
              />
              Draw range:
            </label>
            <span className="range-inputs">
              <input
                type="number"
                min="1"
                max={data?.length || 1000}
                value={rangeFrom}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, data?.length || 1000))
                  setRangeFrom(val)
                  if (val > rangeTo) setRangeTo(val)
                }}
                className="draws-input"
                disabled={!useRange}
                title="From draw # (1 = newest)"
              />
              <span>to</span>
              <input
                type="number"
                min={rangeFrom}
                max={data?.length || 1000}
                value={rangeTo}
                onChange={(e) => {
                  const val = Math.max(rangeFrom, Math.min(parseInt(e.target.value) || rangeFrom, data?.length || 1000))
                  setRangeTo(val)
                }}
                className="draws-input"
                disabled={!useRange}
                title="To draw # (1 = newest)"
              />
            </span>
            <span className="draws-info">
              ({useRange ? (rangeTo - rangeFrom + 1) : drawsCount} draws selected)
              {optimalRange && (
                <span className="optimal-range-hint" style={{ marginLeft: '10px', color: '#1976d2', fontSize: '0.9em' }}>
                  💡 Recommended: draws 1-{optimalRange.to} for best algorithm performance
                </span>
              )}
            </span>
          </div>
        </div>
        
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Draw Results
          </button>
          <button
            className={`tab ${activeTab === 'frequency' ? 'active' : ''}`}
            onClick={() => setActiveTab('frequency')}
          >
            Frequency Analysis
          </button>
          <button
            className={`tab ${activeTab === 'combinations' ? 'active' : ''}`}
            onClick={() => setActiveTab('combinations')}
          >
            Combinations
          </button>
          <button
            className={`tab ${activeTab === 'checker' ? 'active' : ''}`}
            onClick={() => setActiveTab('checker')}
          >
            Check Numbers
          </button>
          <button
            className={`tab ${activeTab === 'prediction' ? 'active' : ''}`}
            onClick={() => setActiveTab('prediction')}
          >
            Next Draw Prediction
          </button>
          <button
            className={`tab ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            Following Draws
          </button>
          <button
            className={`tab ${activeTab === 'improved' ? 'active' : ''}`}
            onClick={() => setActiveTab('improved')}
          >
            Improved Algorithm
          </button>
          <button
            className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            🎯 Advanced Predictor
          </button>
          <button
            className={`tab ${activeTab === 'adaptive' ? 'active' : ''}`}
            onClick={() => setActiveTab('adaptive')}
            style={{ background: activeTab === 'adaptive' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '', color: activeTab === 'adaptive' ? 'white' : '' }}
          >
            🧬 Adaptive AI
          </button>
          <button
            className={`tab ${activeTab === 'bignumber' ? 'active' : ''}`}
            onClick={() => setActiveTab('bignumber')}
            style={{ background: activeTab === 'bignumber' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '', color: activeTab === 'bignumber' ? 'white' : '' }}
          >
            🔢 Big Number Pattern
          </button>
          <button
            className="tab"
            onClick={() => fetchData(true)}
            disabled={loading}
            style={{ marginLeft: 'auto', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Refetching...' : '🔄 Refetch'}
          </button>
          <button
            className="tab"
            onClick={downloadDrawsAsJson}
            disabled={!data || data.length === 0}
            style={{ opacity: (!data || data.length === 0) ? 0.5 : 1 }}
            title="Export all historical draws to JSON file"
          >
            💾 Export Data
          </button>
          <button
            className={`tab ${autoExport ? 'active' : ''}`}
            onClick={() => {
              const newValue = !autoExport
              setAutoExport(newValue)
              localStorage.setItem('autoExportEnabled', String(newValue))
              console.log(`Auto-export ${newValue ? 'enabled' : 'disabled'}`)
            }}
            title={autoExport ? 'Auto-export enabled - file will download after each refetch' : 'Auto-export disabled - click to enable automatic downloads'}
            style={{ 
              background: autoExport ? '#2e7d32' : undefined,
              opacity: autoExport ? 1 : 0.7
            }}
          >
            {autoExport ? '✓ Auto-Export' : '○ Auto-Export'}
          </button>
        </div>
      </header>
      <main>
        {exportNotification && (
          <div className="error" style={{ 
            background: exportNotification.includes('✅') ? '#e8f5e9' : '#e3f2fd', 
            color: exportNotification.includes('✅') ? '#2e7d32' : '#1976d2', 
            border: exportNotification.includes('✅') ? '1px solid #2e7d32' : '1px solid #1976d2',
            marginBottom: '10px'
          }}>
            {exportNotification}
          </div>
        )}
        {loading && !data && (
          <div className="error" style={{ background: '#e3f2fd', color: '#1976d2', border: '1px solid #1976d2' }}>
            <strong>Loading...</strong> Fetching EuroJackpot data from API. This may take a moment.
          </div>
        )}
        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
            <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
              Unable to fetch data from Lotto.pl API. Please check your API key or network connection.
            </p>
            <p style={{ marginTop: '10px', fontSize: '0.85em', fontStyle: 'italic' }}>
              Check the browser console (F12) for detailed error information.
            </p>
            <button onClick={() => fetchData(true)} style={{ marginTop: '10px' }}>
              Try Again
            </button>
          </div>
        )}
        {!error && !loading && (!data || data.length === 0) && (
          <div className="error">
            <strong>No Data:</strong> The API returned no draw results.
            <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
              This might indicate an issue with the API key or the API endpoint.
            </p>
            <button onClick={() => fetchData(true)} style={{ marginTop: '10px' }}>
              Retry Fetch
            </button>
          </div>
        )}
        {filteredDraws && filteredDraws.length > 0 && (
          <div>
            {activeTab === 'results' && (
              <>
                <p className="info">✓ Showing {filteredDraws.length} most recent draws from official Lotto.pl API</p>
                <ResultsTable draws={filteredDraws} />
              </>
            )}
            {activeTab === 'frequency' && (
              <FrequencyAnalysis draws={filteredDraws} />
            )}
            {activeTab === 'combinations' && (
              <CombinationAnalysis draws={filteredDraws} />
            )}
            {activeTab === 'checker' && (
              <CombinationChecker draws={filteredDraws} />
            )}
            {activeTab === 'prediction' && (
              <NextDrawPrediction draws={filteredDraws} />
            )}
            {activeTab === 'following' && (
              <FollowingDrawsAnalysis draws={filteredDraws} />
            )}
            {activeTab === 'improved' && (
              <ImprovedPrediction draws={filteredDraws} />
            )}
            {activeTab === 'advanced' && (
              <AdvancedPredictor data={filteredDraws} />
            )}
            {activeTab === 'adaptive' && (
              <AdaptivePredictor data={filteredDraws} />
            )}
            {activeTab === 'bignumber' && (
              <BigNumberPredictor />
            )}
          </div>
        )}
      </main>
      <footer>
        <small>
          Official EuroJackpot data from Lotto.pl API (https://developers.lotto.pl/).
          Complete historical results since 2012.
        </small>
      </footer>
    </div>
  )
}
