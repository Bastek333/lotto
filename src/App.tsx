import React, { useEffect, useRef, useState } from 'react'
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
import {
  fetchEuroJackpotResults,
  fetchSavedDrawsFromServer as fetchSavedEuroJackpotDrawsFromServer,
  getAllCachedDraws as getAllCachedEuroJackpotDraws,
  getIncompleteCachedDates as getIncompleteEuroJackpotDates,
  clearDrawsCache as clearEuroJackpotDrawsCache,
  saveDrawsToBackend as saveEuroJackpotDrawsToBackend
} from './api/eurojackpot'
import {
  fetchLottoResults,
  fetchSavedDrawsFromServer as fetchSavedLottoDrawsFromServer,
  getAllCachedDraws as getAllCachedLottoDraws,
  getIncompleteCachedDates as getIncompleteLottoDates,
  clearDrawsCache as clearLottoDrawsCache,
  saveDrawsToBackend as saveLottoDrawsToBackend
} from './api/lotto'
import { applyDomTranslations, type Language } from './utils/domI18n'

type GameType = 'eurojackpot' | 'lotto'
type DataSource = 'none' | 'server-json' | 'local-cache' | 'api-live'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers?: number[]
  jackpot?: string
  jackpotAmount?: string
}

type GapBackfillStatus = {
  at: string
  fromDate: string
  fetchedCount: number
  addedCount: number
}

type TabType = 'results' | 'frequency' | 'combinations' | 'checker' | 'prediction' | 'following' | 'improved' | 'advanced' | 'adaptive' | 'bignumber'

export default function App(): JSX.Element {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('uiLanguage')
    return saved === 'en' ? 'en' : 'pl'
  })
  const [gameType, setGameType] = useState<GameType>(() => {
    const saved = localStorage.getItem('selectedGame')
    return (saved === 'lotto' ? 'lotto' : 'eurojackpot') as GameType
  })
  const [data, setData] = useState<Draw[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('results')
  const [loading, setLoading] = useState<boolean>(false)
  const [drawsCount, setDrawsCount] = useState<number>(0)
  const [useRange, setUseRange] = useState<boolean>(false)
  const [rangeFrom, setRangeFrom] = useState<number>(1)
  const [rangeTo, setRangeTo] = useState<number>(0)
  const [optimalRange, setOptimalRange] = useState<{from: number, to: number, score: number, algorithm: string} | null>(null)
  const [isPredictionsMenuOpen, setIsPredictionsMenuOpen] = useState<boolean>(false)
  const [dataSource, setDataSource] = useState<DataSource>('none')
  const [lastServerSaveAt, setLastServerSaveAt] = useState<string | null>(null)
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)
  const [lastGapBackfill, setLastGapBackfill] = useState<GapBackfillStatus | null>(null)
  const activeGameRef = useRef<GameType>(gameType)

  const predictionTabs: Array<{ key: TabType; label: string }> = [
    { key: 'prediction', label: '🔮 Next Draw Prediction' },
    { key: 'following', label: '📆 Following Draws' },
    { key: 'improved', label: '⚡ Improved Algorithm' },
    { key: 'advanced', label: '🎯 Advanced Predictor' },
    { key: 'adaptive', label: '🧬 Adaptive AI' },
    { key: 'bignumber', label: '🔢 Big Number Pattern' }
  ]

  const isPredictionTabActive = predictionTabs.some(tab => tab.key === activeTab)

  // Helper functions to get the right API based on game type
  const getAllCachedDraws = (selectedGame: GameType = gameType) => {
    return selectedGame === 'eurojackpot' ? getAllCachedEuroJackpotDraws() : getAllCachedLottoDraws()
  }

  const getIncompleteCachedDates = (selectedGame: GameType = gameType) => {
    return selectedGame === 'eurojackpot' ? getIncompleteEuroJackpotDates() : getIncompleteLottoDates()
  }

  const clearCurrentGameCache = (selectedGame: GameType = gameType) => {
    if (selectedGame === 'eurojackpot') {
      clearEuroJackpotDrawsCache()
      return
    }

    clearLottoDrawsCache()
  }

  const getSavedServerDraws = async (selectedGame: GameType = gameType): Promise<{ draws: Draw[]; lastFetchedAt: string | null }> => {
    const result = selectedGame === 'eurojackpot'
      ? await fetchSavedEuroJackpotDrawsFromServer()
      : await fetchSavedLottoDrawsFromServer()

    return {
      draws: result.draws as Draw[],
      lastFetchedAt: result.lastFetchedAt
    }
  }

  const persistCurrentGameDraws = async (drawsToSave: Draw[], selectedGame: GameType = gameType) => {
    try {
      if (selectedGame === 'eurojackpot') {
        const result = await saveEuroJackpotDrawsToBackend(false, drawsToSave)
        return Boolean(result?.success)
      } else {
        const result = await saveLottoDrawsToBackend(false, drawsToSave)
        return Boolean(result?.success)
      }
    } catch (error) {
      console.warn(`Failed to persist ${selectedGame} draws to backend:`, error)
      return false
    }
  }

  const isLikelyValidDataset = (draws: Draw[], selectedGame: GameType = gameType) => {
    if (draws.length < 50) {
      return false
    }

    return draws.every(draw => {
      const hasMainNumbers = Array.isArray(draw.numbers) && draw.numbers.length === (selectedGame === 'eurojackpot' ? 5 : 6)
      const hasExpectedEuroNumbers = selectedGame === 'eurojackpot'
        ? Array.isArray(draw.euroNumbers) && draw.euroNumbers.length === 2
        : !draw.euroNumbers || draw.euroNumbers.length === 0

      return Boolean(draw.drawDate) && hasMainNumbers && hasExpectedEuroNumbers
    })
  }

  const fetchResults = async (refetchIncompleteDatesOnly: boolean, selectedGame: GameType = gameType, startFromDate?: string | Date) => {
    return selectedGame === 'eurojackpot' 
      ? await fetchEuroJackpotResults(refetchIncompleteDatesOnly, startFromDate)
      : await fetchLottoResults(refetchIncompleteDatesOnly, startFromDate)
  }

  const normalizeDrawsForGame = (rawDraws: Array<Draw & { jackpotAmount?: string | number }>, selectedGame: GameType): Draw[] => {
    return rawDraws.map(draw => ({
      drawDate: draw.drawDate,
      numbers: draw.numbers,
      euroNumbers: selectedGame === 'eurojackpot' ? draw.euroNumbers : undefined,
      jackpot: draw.jackpot,
      jackpotAmount: draw.jackpotAmount?.toString()
    }))
  }

  const mergeAndDeduplicateDraws = (baseDraws: Draw[], incomingDraws: Draw[]): Draw[] => {
    const combined = [...incomingDraws, ...baseDraws]
    const uniqueDraws = combined.filter((draw, index, self) =>
      index === self.findIndex(d => d.drawDate === draw.drawDate && d.numbers.join(',') === draw.numbers.join(',') && (d.euroNumbers?.join(',') || '') === (draw.euroNumbers?.join(',') || ''))
    )

    uniqueDraws.sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
    return uniqueDraws
  }

  const getMostRecentDrawDate = (draws: Draw[]): string | null => {
    return draws.length > 0 ? draws[0].drawDate : null
  }

  const getOldestDrawDate = (draws: Draw[]): string | null => {
    return draws.length > 0 ? draws[draws.length - 1].drawDate : null
  }

  const toDateKey = (dateValue: string): string => new Date(dateValue).toISOString().split('T')[0]

  const isExpectedDrawDay = (date: Date, selectedGame: GameType): boolean => {
    const dayOfWeek = date.getDay()
    if (selectedGame === 'eurojackpot') {
      return dayOfWeek === 2 || dayOfWeek === 5
    }
    return dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6
  }

  const findNewestMissingDrawDate = (draws: Draw[], selectedGame: GameType): string | null => {
    if (draws.length < 2) {
      return null
    }

    const normalizedDateKeys = new Set(draws.map(draw => toDateKey(draw.drawDate)))
    const oldestDateValue = getOldestDrawDate(draws)
    const newestDateValue = getMostRecentDrawDate(draws)

    if (!oldestDateValue || !newestDateValue) {
      return null
    }

    const currentDate = new Date(newestDateValue)
    currentDate.setHours(0, 0, 0, 0)
    const newestDate = new Date(newestDateValue)
    newestDate.setHours(0, 0, 0, 0)
    const oldestDate = new Date(oldestDateValue)
    oldestDate.setHours(0, 0, 0, 0)

    while (currentDate >= oldestDate) {
      if (isExpectedDrawDay(currentDate, selectedGame)) {
        const dateKey = currentDate.toISOString().split('T')[0]
        if (!normalizedDateKeys.has(dateKey)) {
          return dateKey
        }
      }
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return null
  }

  // Function to fetch data from API
  const fetchData = async (forceRefetch: boolean = false, selectedGame: GameType = gameType) => {
    setLoading(true)
    setError(null)
    
    try {
      // First, load server-saved data (unless forcing refetch)
      if (!forceRefetch) {
        const serverState = await getSavedServerDraws(selectedGame)
        const normalizedServerDraws = normalizeDrawsForGame(serverState.draws as Array<Draw & { jackpotAmount?: string | number }>, selectedGame)

        if (serverState.draws.length > 0 && isLikelyValidDataset(normalizedServerDraws, selectedGame)) {
          console.log(`Loaded ${serverState.draws.length} ${selectedGame} draws from server JSON`)
          if (activeGameRef.current === selectedGame) {
            setData(normalizedServerDraws)
            setDataSource('server-json')
            setLastRefreshAt(new Date().toISOString())
          }
        }

        // Fallback to browser cache if server data is unavailable
        const cachedDraws = getAllCachedDraws(selectedGame)
        const normalizedCachedDraws = normalizeDrawsForGame(cachedDraws as Array<Draw & { jackpotAmount?: string | number }>, selectedGame)

        if (serverState.draws.length === 0 && cachedDraws.length > 0 && isLikelyValidDataset(normalizedCachedDraws, selectedGame)) {
          console.log(`Loaded ${cachedDraws.length} draws from cache`)
          if (activeGameRef.current === selectedGame) {
            setData(normalizedCachedDraws)
            setDataSource('local-cache')
            setLastRefreshAt(new Date().toISOString())
          }
        } else if (cachedDraws.length > 0) {
          console.warn(`Ignoring invalid ${selectedGame} cache dataset (${cachedDraws.length} draws)`)
          clearCurrentGameCache(selectedGame)
        }

        // If cache contains incomplete rows, update those in background while full refresh continues.
        const incompleteDates = getIncompleteCachedDates(selectedGame)
        if (incompleteDates.length > 0) {
          console.log(`Found ${incompleteDates.length} draws with missing numbers, refetching those dates in background...`)
          setTimeout(() => fetchIncompleteDraws(selectedGame), 100)
        }

        const incrementalStartDate = getMostRecentDrawDate(normalizedServerDraws) || getMostRecentDrawDate(normalizedCachedDraws) || undefined
        const hasServerBaseline = normalizedServerDraws.length > 0 || normalizedCachedDraws.length > 0

        if (hasServerBaseline) {
          const gameName = selectedGame === 'eurojackpot' ? 'EuroJackpot' : 'Lotto'
          let gapBackfillStatus: GapBackfillStatus | null = null
          console.log(`Checking for updated ${gameName} data from ${incrementalStartDate ? new Date(incrementalStartDate).toISOString().split('T')[0] : '2017-01-03'} to current...`)
          const apiDraws = await fetchResults(false, selectedGame, incrementalStartDate)
          const incrementalDraws = normalizeDrawsForGame(apiDraws as Array<Draw & { jackpotAmount?: string | number }>, selectedGame)
          let mergedDraws = mergeAndDeduplicateDraws(normalizedServerDraws.length > 0 ? normalizedServerDraws : normalizedCachedDraws, incrementalDraws)

          const newestMissingDate = findNewestMissingDrawDate(mergedDraws, selectedGame)
          if (newestMissingDate) {
            console.log(`Detected missing ${gameName} draws near latest history at ${newestMissingDate}, backfilling from that date...`)
            const beforeGapBackfillCount = mergedDraws.length
            const gapFillApiDraws = await fetchResults(false, selectedGame, newestMissingDate)
            const gapFillDraws = normalizeDrawsForGame(gapFillApiDraws as Array<Draw & { jackpotAmount?: string | number }>, selectedGame)
            mergedDraws = mergeAndDeduplicateDraws(mergedDraws, gapFillDraws)
            const addedCount = Math.max(mergedDraws.length - beforeGapBackfillCount, 0)
            gapBackfillStatus = {
              at: new Date().toISOString(),
              fromDate: newestMissingDate,
              fetchedCount: gapFillDraws.length,
              addedCount
            }
            console.log(`Backfilled ${gapFillDraws.length} draws from missing range, ${mergedDraws.length} total after merge`)
          }

          console.log(`Loaded ${incrementalDraws.length} incremental draws from API, ${mergedDraws.length} total after merge`)
          if (activeGameRef.current !== selectedGame) {
            return
          }
          setData(mergedDraws)
          setDataSource(incrementalDraws.length > 0 ? 'api-live' : (serverState.draws.length > 0 ? 'server-json' : 'local-cache'))
          setLastRefreshAt(new Date().toISOString())
          setLastGapBackfill(gapBackfillStatus)
          const saved = await persistCurrentGameDraws(mergedDraws, selectedGame)
          if (saved) {
            setLastServerSaveAt(new Date().toISOString())
          }
          return
        }
      }
      
      // Fetch from API (full refetch)
      const gameName = selectedGame === 'eurojackpot' ? 'EuroJackpot' : 'Lotto'
      console.log(forceRefetch ? `Force refetching all ${gameName} data...` : `Checking for updated ${gameName} data...`)
      const apiDraws = await fetchResults(false, selectedGame)
      const draws = normalizeDrawsForGame(apiDraws as Array<Draw & { jackpotAmount?: string | number }>, selectedGame)

      console.log(`Loaded ${draws.length} draws (updated from API)`)
      if (activeGameRef.current !== selectedGame) {
        return
      }
      setData(draws)
      setDataSource('api-live')
      setLastRefreshAt(new Date().toISOString())
      setLastGapBackfill(null)
      const saved = await persistCurrentGameDraws(draws, selectedGame)
      if (saved) {
        setLastServerSaveAt(new Date().toISOString())
      }
    } catch (e: any) {
      const gameName = selectedGame === 'eurojackpot' ? 'EuroJackpot' : 'Lotto'
      console.error('Failed to load real results', e)
      const cachedDraws = getAllCachedDraws(selectedGame)
      if (activeGameRef.current !== selectedGame) {
        return
      }
      if (cachedDraws.length === 0) {
        // Only show error if we don't have cached data
        setError(e.message || `Failed to fetch real ${gameName} data. Please try again later.`)
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch only incomplete draws
  const fetchIncompleteDraws = async (selectedGame: GameType = gameType) => {
    try {
      console.log('Refetching incomplete draws only...')
      const apiDraws = await fetchResults(true, selectedGame)
      const draws = normalizeDrawsForGame(apiDraws as Array<Draw & { jackpotAmount?: string | number }>, selectedGame)

      console.log(`Updated ${draws.length} draws with complete data`)
      if (activeGameRef.current !== selectedGame) {
        return
      }
      setData(draws)
      setDataSource('api-live')
      setLastRefreshAt(new Date().toISOString())
      const saved = await persistCurrentGameDraws(draws, selectedGame)
      if (saved) {
        setLastServerSaveAt(new Date().toISOString())
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

  const resultsViewKey = filteredDraws && filteredDraws.length > 0
    ? `${gameType}-${filteredDraws[0].drawDate}-${filteredDraws.length}`
    : `${gameType}-empty`

  useEffect(() => {
    activeGameRef.current = gameType
  }, [gameType])

  useEffect(() => {
    // Reset drawsCount and rangeTo so new game data is always shown fully
    activeGameRef.current = gameType
    setData(null)
    setDrawsCount(0)
    setRangeTo(0)
    setLastGapBackfill(null)

    // Unified startup flow: server JSON first, then API refresh.
    fetchData(false, gameType)
  }, [gameType]);

  const statusSourceLabel = (() => {
    if (dataSource === 'server-json') return 'Server JSON'
    if (dataSource === 'local-cache') return 'Browser cache'
    if (dataSource === 'api-live') return 'Lotto API (live)'
    return 'No data source yet'
  })()

  const formatStatusTime = (isoTime: string | null) => {
    if (!isoTime) return 'n/a'
    return new Date(isoTime).toLocaleString()
  }

  const gapBackfillStatusLabel = lastGapBackfill
    ? `${formatStatusTime(lastGapBackfill.at)} (from ${lastGapBackfill.fromDate}, fetched ${lastGapBackfill.fetchedCount}, added ${lastGapBackfill.addedCount})`
    : 'none'

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

  useEffect(() => {
    localStorage.setItem('uiLanguage', language)
    document.documentElement.lang = language === 'pl' ? 'pl' : 'en'
  }, [language])

  useEffect(() => {
    const appRoot = document.querySelector('.app')
    if (!appRoot) return

    // Translate visible text after each relevant render so all components follow UI language.
    const timer = window.setTimeout(() => {
      applyDomTranslations(appRoot, language)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [
    language,
    gameType,
    activeTab,
    loading,
    error,
    data,
    filteredDraws,
    useRange,
    drawsCount,
    rangeFrom,
    rangeTo,
    optimalRange,
    isPredictionsMenuOpen
  ])

  return (
    <div className="app">
      <header>
        <div style={{ marginBottom: '15px' }}>
          <h1>{gameType === 'eurojackpot' ? 'Eurojackpot Draw Results' : 'Lotto Draw Results'}</h1>
          <p className="muted">Complete historical data from official Lotto.pl API</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Game:</span>
            <div style={{
              display: 'inline-flex',
              background: '#f5f5f5',
              borderRadius: '25px',
              padding: '4px',
              border: '2px solid #e0e0e0'
            }}>
              <button
                onClick={() => {
                  setGameType('eurojackpot');
                  localStorage.setItem('selectedGame', 'eurojackpot');
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: gameType === 'eurojackpot' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                  color: gameType === 'eurojackpot' ? 'white' : '#666',
                  fontWeight: gameType === 'eurojackpot' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
              >
                EuroJackpot
              </button>
              <button
                onClick={() => {
                  setGameType('lotto');
                  localStorage.setItem('selectedGame', 'lotto');
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: gameType === 'lotto' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent',
                  color: gameType === 'lotto' ? 'white' : '#666',
                  fontWeight: gameType === 'lotto' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
              >
                Lotto
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Language:</span>
            <div style={{
              display: 'inline-flex',
              background: '#f5f5f5',
              borderRadius: '20px',
              padding: '3px',
              border: '1px solid #e0e0e0'
            }}>
              <button
                onClick={() => setLanguage('pl')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: language === 'pl' ? '#1f6feb' : 'transparent',
                  color: language === 'pl' ? 'white' : '#666',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                PL
              </button>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: language === 'en' ? '#1f6feb' : 'transparent',
                  color: language === 'en' ? 'white' : '#666',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                EN
              </button>
            </div>
          </div>
        </div>
        
        <div className="header-controls">
          <div
            style={{
              marginBottom: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#f7faff',
              border: '1px solid #cfe3ff',
              fontSize: '13px',
              color: '#1d3a5f'
            }}
          >
            <strong>Data status:</strong> source {statusSourceLabel} | loaded {formatStatusTime(lastRefreshAt)} | last server save {formatStatusTime(lastServerSaveAt)} | gap backfill {gapBackfillStatusLabel}
          </div>
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
            onClick={() => {
              setActiveTab('results')
              setIsPredictionsMenuOpen(false)
            }}
          >
            Draw Results
          </button>
          <button
            className={`tab ${activeTab === 'frequency' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('frequency')
              setIsPredictionsMenuOpen(false)
            }}
          >
            Frequency Analysis
          </button>
          <button
            className={`tab ${activeTab === 'combinations' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('combinations')
              setIsPredictionsMenuOpen(false)
            }}
          >
            Combinations
          </button>
          <button
            className={`tab ${activeTab === 'checker' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('checker')
              setIsPredictionsMenuOpen(false)
            }}
          >
            Check Numbers
          </button>
          <div className="tab-parent-menu">
            <button
              className={`tab ${isPredictionTabActive ? 'active' : ''}`}
              onClick={() => setIsPredictionsMenuOpen(prev => !prev)}
              title="Prediction tools"
            >
              Predictions {isPredictionsMenuOpen ? '▲' : '▼'}
            </button>
            {isPredictionsMenuOpen && (
              <div className="tab-submenu">
                {predictionTabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`tab submenu-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.key)
                      setIsPredictionsMenuOpen(false)
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="tab"
                onClick={() => fetchData(false)}
            disabled={loading}
            style={{ marginLeft: 'auto', opacity: loading ? 0.5 : 1 }}
          >
                {loading ? 'Checking...' : '🔄 Check latest'}
          </button>
        </div>
      </header>
      <main>
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
            <button onClick={() => fetchData(false)} style={{ marginTop: '10px' }}>
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
          <div key={resultsViewKey}>
            {activeTab === 'results' && (
              <>
                <p className="info">✓ Showing {filteredDraws.length} most recent draws from official Lotto.pl API</p>
                <ResultsTable key={resultsViewKey} draws={filteredDraws} />
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
              <BigNumberPredictor draws={filteredDraws} />
            )}
          </div>
        )}
      </main>
      <footer>
        <small>
          Official {gameType === 'eurojackpot' ? 'EuroJackpot' : 'Lotto'} data from Lotto.pl API (https://developers.lotto.pl/).
          Complete historical results since {gameType === 'eurojackpot' ? '2012' : '2017'}.
        </small>
      </footer>
    </div>
  )
}
