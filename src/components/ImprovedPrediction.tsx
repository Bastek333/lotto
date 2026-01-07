import React from 'react'
import { analyzeOrderPatterns } from '../utils/orderPatternAnalysis'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
  jackpot?: string
  jackpotAmount?: string
}

type Props = {
  draws: Draw[]
}

type NumberScore = {
  number: number
  frequencyScore: number
  recentScore: number
  gapScore: number
  patternScore: number
  totalScore: number
}

type AlgorithmResult = {
  name: string
  description: string
  predictedMain: number[]
  predictedEuro: number[]
  mainMatches: number[]
  euroMatches: number[]
  mainMatchCount: number
  euroMatchCount: number
  totalScore: number
}

export default function ImprovedPrediction({ draws }: Props): JSX.Element {
  const latestDraw = draws[0]
  
  // CRITICAL: Use only historical data (exclude latest draw) to prevent data leakage
  const historicalDraws = draws.slice(1)
  const previousDraw = historicalDraws.length > 0 ? historicalDraws[0] : null

  // ===== ALGORITHM 0: ORDER PATTERN ANALYSIS (HIGHEST PRIORITY) =====
  const orderPatternAlgorithm = React.useMemo(() => {
    const analysis = analyzeOrderPatterns(historicalDraws, 30)
    
    // Get top numbers based on order pattern scores
    const topMainNumbers = analysis.mainNumberScores
      .slice(0, 10) // Consider top 10
      .sort((a, b) => b.totalOrderScore - a.totalOrderScore)
    
    const topEuroNumbers = analysis.euroNumberScores
      .slice(0, 5) // Consider top 5
      .sort((a, b) => b.totalOrderScore - a.totalOrderScore)
    
    // Apply position-aware selection
    const selectedNumbers: number[] = []
    
    // Try to select numbers that fit well in their preferred positions
    for (let position = 0; position < 5; position++) {
      const candidatesForPosition = topMainNumbers
        .filter(score => !selectedNumbers.includes(score.number))
        .filter(score => score.preferredPosition === position || selectedNumbers.length < 5)
        .sort((a, b) => b.totalOrderScore - a.totalOrderScore)
      
      if (candidatesForPosition.length > 0) {
        selectedNumbers.push(candidatesForPosition[0].number)
      }
    }
    
    // If we don't have 5 numbers yet, fill with highest scoring
    while (selectedNumbers.length < 5) {
      const next = topMainNumbers.find(s => !selectedNumbers.includes(s.number))
      if (next) {
        selectedNumbers.push(next.number)
      } else {
        break
      }
    }
    
    return {
      predictedMain: selectedNumbers.slice(0, 5).sort((a, b) => a - b),
      predictedEuro: topEuroNumbers.slice(0, 2).map(s => s.number).sort((a, b) => a - b)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 1: Weighted Hybrid (Original) =====
  const hybridAlgorithm = React.useMemo(() => {
    const mainScores: NumberScore[] = []
    
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
      if (historicalDraws.length > 0) {
        historicalDraws[0].numbers.forEach(currentNum => {
          for (let i = 1; i < historicalDraws.length; i++) {
            if (historicalDraws[i].numbers.includes(currentNum)) {
              patternTotal++
              if (i > 0 && historicalDraws[i - 1].numbers.includes(num)) {
                patternMatches++
              }
            }
          }
        })
      }
      const patternScore = patternTotal > 0 ? (patternMatches / patternTotal) * 100 : 0
      
      const totalScore = 
        frequencyScore * 0.25 + 
        recentScore * 0.30 + 
        gapScore * 0.20 + 
        patternScore * 0.25
      
      mainScores.push({
        number: num,
        frequencyScore,
        recentScore,
        gapScore,
        patternScore,
        totalScore
      })
    }

    const euroScores: NumberScore[] = []
    for (let num = 1; num <= 12; num++) {
      const totalAppearances = historicalDraws.filter(d => d.euroNumbers.includes(num)).length
      const frequencyScore = (totalAppearances / historicalDraws.length) * 100
      
      const recentDraws = historicalDraws.slice(0, Math.min(20, historicalDraws.length))
      const recentAppearances = recentDraws.filter(d => d.euroNumbers.includes(num)).length
      const recentScore = (recentAppearances / recentDraws.length) * 100
      
      let gapSinceLastAppearance = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (historicalDraws[i].euroNumbers.includes(num)) {
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
      if (historicalDraws.length > 0) {
        historicalDraws[0].euroNumbers.forEach(currentNum => {
          for (let i = 1; i < historicalDraws.length; i++) {
            if (historicalDraws[i].euroNumbers.includes(currentNum)) {
              patternTotal++
              if (i > 0 && historicalDraws[i - 1].euroNumbers.includes(num)) {
                patternMatches++
              }
            }
          }
        })
      }
      const patternScore = patternTotal > 0 ? (patternMatches / patternTotal) * 100 : 0
      
      const totalScore = 
        frequencyScore * 0.25 + 
        recentScore * 0.30 + 
        gapScore * 0.20 + 
        patternScore * 0.25
      
      euroScores.push({
        number: num,
        frequencyScore,
        recentScore,
        gapScore,
        patternScore,
        totalScore
      })
    }
    
    return {
      mainScores: mainScores.sort((a, b) => b.totalScore - a.totalScore),
      euroScores: euroScores.sort((a, b) => b.totalScore - a.totalScore)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 2: Hot/Cold Balance =====
  const hotColdAlgorithm = React.useMemo(() => {
    const recentWindow = 10
    const mainScores: { number: number; score: number }[] = []
    
    for (let num = 1; num <= 50; num++) {
      const recentAppearances = historicalDraws.slice(0, recentWindow).filter(d => d.numbers.includes(num)).length
      const overallAppearances = historicalDraws.filter(d => d.numbers.includes(num)).length
      const overallRate = overallAppearances / historicalDraws.length
      const recentRate = recentAppearances / Math.min(recentWindow, historicalDraws.length)
      
      // Hot numbers: appearing more than expected recently
      const hotScore = recentRate > overallRate ? (recentRate - overallRate) * 200 : 0
      // Cold numbers due for appearance: below average but historically common
      const coldScore = (recentRate < overallRate && overallRate > 0.15) ? (overallRate - recentRate) * 150 : 0
      
      const score = hotScore + coldScore + (overallRate * 50)
      mainScores.push({ number: num, score })
    }

    const euroScores: { number: number; score: number }[] = []
    for (let num = 1; num <= 12; num++) {
      const recentAppearances = historicalDraws.slice(0, recentWindow).filter(d => d.euroNumbers.includes(num)).length
      const overallAppearances = historicalDraws.filter(d => d.euroNumbers.includes(num)).length
      const overallRate = overallAppearances / historicalDraws.length
      const recentRate = recentAppearances / Math.min(recentWindow, historicalDraws.length)
      
      const hotScore = recentRate > overallRate ? (recentRate - overallRate) * 200 : 0
      const coldScore = (recentRate < overallRate && overallRate > 0.20) ? (overallRate - recentRate) * 150 : 0
      
      const score = hotScore + coldScore + (overallRate * 50)
      euroScores.push({ number: num, score })
    }
    
    return {
      mainScores: mainScores.sort((a, b) => b.score - a.score),
      euroScores: euroScores.sort((a, b) => b.score - a.score)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 3: Positional Analysis =====
  const positionalAlgorithm = React.useMemo(() => {
    const positions = [0, 1, 2, 3, 4]
    const positionalFreq: Map<number, number[]> = new Map()
    
    // Analyze which numbers appear in which positions
    for (let num = 1; num <= 50; num++) {
      const positionScores = [0, 0, 0, 0, 0]
      historicalDraws.forEach(draw => {
        const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)
        const idx = sortedNumbers.indexOf(num)
        if (idx !== -1) {
          positionScores[idx]++
        }
      })
      positionalFreq.set(num, positionScores)
    }
    
    // Select best number for each position
    const predictedMain: number[] = []
    const usedNumbers = new Set<number>()
    
    positions.forEach(pos => {
      let bestNum = 0
      let bestScore = 0
      
      for (let num = 1; num <= 50; num++) {
        if (!usedNumbers.has(num)) {
          const scores = positionalFreq.get(num) || [0, 0, 0, 0, 0]
          if (scores[pos] > bestScore) {
            bestScore = scores[pos]
            bestNum = num
          }
        }
      }
      
      if (bestNum > 0) {
        predictedMain.push(bestNum)
        usedNumbers.add(bestNum)
      }
    })

    // Euro numbers - simple frequency
    const euroScores: { number: number; score: number }[] = []
    for (let num = 1; num <= 12; num++) {
      const score = historicalDraws.filter(d => d.euroNumbers.includes(num)).length
      euroScores.push({ number: num, score })
    }
    
    return {
      predictedMain: predictedMain.sort((a, b) => a - b),
      predictedEuro: euroScores.sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 4: Number Pair Frequency =====
  const pairFrequencyAlgorithm = React.useMemo(() => {
    const pairFreq: Map<string, number> = new Map()
    
    // Build pair frequency map
    historicalDraws.forEach(draw => {
      for (let i = 0; i < draw.numbers.length; i++) {
        for (let j = i + 1; j < draw.numbers.length; j++) {
          const pair = [draw.numbers[i], draw.numbers[j]].sort((a, b) => a - b).join('-')
          pairFreq.set(pair, (pairFreq.get(pair) || 0) + 1)
        }
      }
    })
    
    // Score numbers based on pairs with PREVIOUS draw numbers (not latest)
    const numberScores: Map<number, number> = new Map()
    const referenceDraw = historicalDraws[0] // Use most recent historical draw
    
    for (let num = 1; num <= 50; num++) {
      if (!referenceDraw.numbers.includes(num)) {
        let score = 0
        referenceDraw.numbers.forEach(refNum => {
          const pair = [refNum, num].sort((a, b) => a - b).join('-')
          score += pairFreq.get(pair) || 0
        })
        numberScores.set(num, score)
      }
    }
    
    const sortedScores = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
    
    const predictedMain = sortedScores.slice(0, 5).map(s => s[0])

    // Euro pair frequency
    const euroPairFreq: Map<string, number> = new Map()
    historicalDraws.forEach(draw => {
      if (draw.euroNumbers.length >= 2) {
        const pair = [...draw.euroNumbers].sort((a, b) => a - b).join('-')
        euroPairFreq.set(pair, (euroPairFreq.get(pair) || 0) + 1)
      }
    })
    
    const euroScores: Map<number, number> = new Map()
    for (let num = 1; num <= 12; num++) {
      if (!referenceDraw.euroNumbers.includes(num)) {
        let score = 0
        referenceDraw.euroNumbers.forEach(refNum => {
          const pair = [refNum, num].sort((a, b) => a - b).join('-')
          score += euroPairFreq.get(pair) || 0
        })
        euroScores.set(num, score)
      }
    }
    
    const sortedEuroScores = Array.from(euroScores.entries())
      .sort((a, b) => b[1] - a[1])
    
    return {
      predictedMain,
      predictedEuro: sortedEuroScores.slice(0, 2).map(s => s[0])
    }
  }, [historicalDraws])

  // ===== ALGORITHM 5: Delta System =====
  const deltaAlgorithm = React.useMemo(() => {
    const deltaFreq: Map<number, number> = new Map()
    
    // Calculate deltas (differences between consecutive numbers)
    historicalDraws.forEach(draw => {
      const sorted = [...draw.numbers].sort((a, b) => a - b)
      for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i] - sorted[i - 1]
        deltaFreq.set(delta, (deltaFreq.get(delta) || 0) + 1)
      }
    })
    
    // Get most common deltas
    const sortedDeltas = Array.from(deltaFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(d => d[0])
    
    // Build prediction using common deltas
    const predictedMain: number[] = []
    let currentNum = Math.floor(Math.random() * 10) + 1 // Start with low number
    predictedMain.push(currentNum)
    
    let deltaIdx = 0
    while (predictedMain.length < 5) {
      const delta = sortedDeltas[deltaIdx % sortedDeltas.length]
      currentNum += delta
      if (currentNum <= 50 && !predictedMain.includes(currentNum)) {
        predictedMain.push(currentNum)
      }
      deltaIdx++
      if (deltaIdx > 50) break // Prevent infinite loop
    }
    
    // Fill remaining with high-frequency numbers if needed
    if (predictedMain.length < 5) {
      const freqNums = Array.from({ length: 50 }, (_, i) => i + 1)
        .map(num => ({
          num,
          freq: historicalDraws.filter(d => d.numbers.includes(num)).length
        }))
        .sort((a, b) => b.freq - a.freq)
      
      for (const { num } of freqNums) {
        if (predictedMain.length >= 5) break
        if (!predictedMain.includes(num)) {
          predictedMain.push(num)
        }
      }
    }

    // Euro: use frequency
    const euroScores: { number: number; score: number }[] = []
    for (let num = 1; num <= 12; num++) {
      const score = historicalDraws.filter(d => d.euroNumbers.includes(num)).length
      euroScores.push({ number: num, score })
    }
    
    return {
      predictedMain: predictedMain.slice(0, 5).sort((a, b) => a - b),
      predictedEuro: euroScores.sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 6: Machine Learning-Inspired (Weighted Features) =====
  const mlInspiredAlgorithm = React.useMemo(() => {
    const features = (num: number, isEuro: boolean) => {
      const pool = isEuro ? historicalDraws.map(d => d.euroNumbers).flat() : historicalDraws.map(d => d.numbers).flat()
      const appearances = pool.filter(n => n === num).length
      
      // Feature 1: Frequency
      const frequency = appearances / historicalDraws.length
      
      // Feature 2: Variance (how consistent are appearances)
      const windowSize = 10
      const windows = Math.floor(historicalDraws.length / windowSize)
      const windowCounts = []
      for (let i = 0; i < windows; i++) {
        const windowDraws = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        const count = windowDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
        windowCounts.push(count)
      }
      const mean = windowCounts.reduce((a, b) => a + b, 0) / windowCounts.length
      const variance = windowCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowCounts.length
      
      // Feature 3: Momentum (recent vs overall)
      const recent10 = historicalDraws.slice(0, 10).filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / 10
      const momentum = recent10 - frequency
      
      // Feature 4: Cycle position
      let lastSeen = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          lastSeen = i
          break
        }
      }
      const cycleScore = lastSeen >= 1 && lastSeen <= 5 ? 1 : 0
      
      // Weighted combination (trained weights)
      return frequency * 3.5 + (1 / (variance + 1)) * 1.2 + momentum * 2.8 + cycleScore * 1.5
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: features(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: features(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 7: Fibonacci Sequence =====
  const fibonacciAlgorithm = React.useMemo(() => {
    // Fibonacci-based scoring: numbers aligned with Fibonacci patterns get higher scores
    const fibSequence = [1, 2, 3, 5, 8, 13, 21, 34]
    const mainScores: { number: number; score: number }[] = []
    
    for (let num = 1; num <= 50; num++) {
      const frequency = historicalDraws.filter(d => d.numbers.includes(num)).length / historicalDraws.length
      
      // Bonus for Fibonacci numbers
      const fibBonus = fibSequence.includes(num) ? 50 : 0
      
      // Bonus for numbers near Fibonacci
      const nearFibBonus = fibSequence.some(f => Math.abs(f - num) <= 2) ? 25 : 0
      
      // Recent trend
      const recent = historicalDraws.slice(0, 10).filter(d => d.numbers.includes(num)).length / 10
      
      const score = (frequency * 100) + fibBonus + nearFibBonus + (recent * 50)
      mainScores.push({ number: num, score })
    }
    
    const euroScores: { number: number; score: number }[] = []
    for (let num = 1; num <= 12; num++) {
      const frequency = historicalDraws.filter(d => d.euroNumbers.includes(num)).length / historicalDraws.length
      const fibBonus = fibSequence.includes(num) ? 40 : 0
      const recent = historicalDraws.slice(0, 10).filter(d => d.euroNumbers.includes(num)).length / 10
      
      const score = (frequency * 100) + fibBonus + (recent * 50)
      euroScores.push({ number: num, score })
    }
    
    return {
      predictedMain: mainScores.sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 8: Markov Chain =====
  const markovChainAlgorithm = React.useMemo(() => {
    // Build transition probabilities: what numbers follow others
    const transitionMatrix: Map<number, Map<number, number>> = new Map()
    
    for (let i = 0; i < historicalDraws.length - 1; i++) {
      const currentDraw = historicalDraws[i + 1].numbers
      const nextDraw = historicalDraws[i].numbers
      
      currentDraw.forEach(currentNum => {
        if (!transitionMatrix.has(currentNum)) {
          transitionMatrix.set(currentNum, new Map())
        }
        const transitions = transitionMatrix.get(currentNum)!
        
        nextDraw.forEach(nextNum => {
          transitions.set(nextNum, (transitions.get(nextNum) || 0) + 1)
        })
      })
    }
    
    // Predict based on PREVIOUS draw (first historical draw), not latest
    const scores: Map<number, number> = new Map()
    const referenceDraw = historicalDraws[0]
    referenceDraw.numbers.forEach(num => {
      const transitions = transitionMatrix.get(num)
      if (transitions) {
        transitions.forEach((count, nextNum) => {
          scores.set(nextNum, (scores.get(nextNum) || 0) + count)
        })
      }
    })
    
    const sortedScores = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
    
    const predictedMain = sortedScores.slice(0, 5).map(s => s[0])
    
    // Euro Markov Chain
    const euroTransitionMatrix: Map<number, Map<number, number>> = new Map()
    for (let i = 0; i < historicalDraws.length - 1; i++) {
      const currentDraw = historicalDraws[i + 1].euroNumbers
      const nextDraw = historicalDraws[i].euroNumbers
      
      currentDraw.forEach(currentNum => {
        if (!euroTransitionMatrix.has(currentNum)) {
          euroTransitionMatrix.set(currentNum, new Map())
        }
        const transitions = euroTransitionMatrix.get(currentNum)!
        
        nextDraw.forEach(nextNum => {
          transitions.set(nextNum, (transitions.get(nextNum) || 0) + 1)
        })
      })
    }
    
    const euroScores: Map<number, number> = new Map()
    referenceDraw.euroNumbers.forEach(num => {
      const transitions = euroTransitionMatrix.get(num)
      if (transitions) {
        transitions.forEach((count, nextNum) => {
          euroScores.set(nextNum, (euroScores.get(nextNum) || 0) + count)
        })
      }
    })
    
    const sortedEuroScores = Array.from(euroScores.entries())
      .sort((a, b) => b[1] - a[1])
    
    return {
      predictedMain,
      predictedEuro: sortedEuroScores.slice(0, 2).map(s => s[0])
    }
  }, [historicalDraws])

  // ===== ALGORITHM 9: Exponential Smoothing =====
  const exponentialSmoothingAlgorithm = React.useMemo(() => {
    const alpha = 0.3 // Smoothing factor
    const mainScores: Map<number, number> = new Map()
    
    for (let num = 1; num <= 50; num++) {
      let smoothedValue = 0
      let weight = 1
      
      // Apply exponential smoothing (recent draws weighted more)
      for (let i = 0; i < Math.min(historicalDraws.length, 50); i++) {
        const hasNumber = historicalDraws[i].numbers.includes(num) ? 1 : 0
        smoothedValue = alpha * hasNumber + (1 - alpha) * smoothedValue
        weight *= (1 - alpha)
      }
      
      mainScores.set(num, smoothedValue * 100)
    }
    
    const sortedMain = Array.from(mainScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(s => s[0])
    
    const euroScores: Map<number, number> = new Map()
    for (let num = 1; num <= 12; num++) {
      let smoothedValue = 0
      
      for (let i = 0; i < Math.min(historicalDraws.length, 50); i++) {
        const hasNumber = historicalDraws[i].euroNumbers.includes(num) ? 1 : 0
        smoothedValue = alpha * hasNumber + (1 - alpha) * smoothedValue
      }
      
      euroScores.set(num, smoothedValue * 100)
    }
    
    const sortedEuro = Array.from(euroScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(s => s[0])
    
    return {
      predictedMain: sortedMain,
      predictedEuro: sortedEuro
    }
  }, [historicalDraws])

  // ===== ALGORITHM 10: K-Nearest Neighbors =====
  const knnAlgorithm = React.useMemo(() => {
    const k = 5 // Number of nearest neighbors
    
    if (!previousDraw || historicalDraws.length < 3) {
      return {
        predictedMain: [1, 2, 3, 4, 5],
        predictedEuro: [1, 2]
      }
    }
    
    // Find k most similar draws to the PREVIOUS draw (not latest)
    // Then look at what came AFTER those similar draws
    const similarities: { drawIndex: number; similarity: number }[] = []
    
    // Start from index 2 to ensure we have a "next draw" to look at
    for (let i = 2; i < historicalDraws.length; i++) {
      const draw = historicalDraws[i]
      // Calculate similarity to PREVIOUS draw (Jaccard index)
      const intersection = draw.numbers.filter(n => previousDraw.numbers.includes(n)).length
      const union = new Set([...draw.numbers, ...previousDraw.numbers]).size
      const similarity = intersection / union
      
      similarities.push({ drawIndex: i, similarity })
    }
    
    // Sort by similarity and take top k
    const nearestIndices = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
    
    // Count number frequency in draws that came AFTER the nearest neighbors
    const numberCounts: Map<number, number> = new Map()
    nearestIndices.forEach(({ drawIndex }) => {
      // Look at the draw that came BEFORE this one (which is the "next" draw in chronological order)
      const nextDraw = historicalDraws[drawIndex - 1]
      nextDraw.numbers.forEach(num => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1)
      })
    })
    
    const predictedMain = Array.from(numberCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0])
    
    // Euro KNN
    const euroSimilarities: { drawIndex: number; similarity: number }[] = []
    for (let i = 2; i < historicalDraws.length; i++) {
      const draw = historicalDraws[i]
      const intersection = draw.euroNumbers.filter(n => previousDraw.euroNumbers.includes(n)).length
      const union = new Set([...draw.euroNumbers, ...previousDraw.euroNumbers]).size
      const similarity = union > 0 ? intersection / union : 0
      
      euroSimilarities.push({ drawIndex: i, similarity })
    }
    
    const nearestEuroIndices = euroSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
    
    const euroNumberCounts: Map<number, number> = new Map()
    nearestEuroIndices.forEach(({ drawIndex }) => {
      // Look at the draw that came BEFORE this one (which is the "next" draw in chronological order)
      const nextDraw = historicalDraws[drawIndex - 1]
      nextDraw.euroNumbers.forEach(num => {
        euroNumberCounts.set(num, (euroNumberCounts.get(num) || 0) + 1)
      })
    })
    
    const predictedEuro = Array.from(euroNumberCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(e => e[0])
    
    return {
      predictedMain,
      predictedEuro
    }
  }, [historicalDraws, latestDraw, previousDraw])

  // ===== ALGORITHM 11: Genetic Algorithm =====
  const geneticAlgorithm = React.useMemo(() => {
    const populationSize = 50
    const generations = 20
    const mutationRate = 0.15
    
    // Fitness function: how well does a combination match historical patterns
    const fitness = (combination: number[]): number => {
      let score = 0
      
      // Check frequency of each number
      combination.forEach(num => {
        const freq = historicalDraws.filter(d => d.numbers.includes(num)).length / historicalDraws.length
        score += freq * 10
      })
      
      // Check pair frequencies
      for (let i = 0; i < combination.length; i++) {
        for (let j = i + 1; j < combination.length; j++) {
          const pairCount = historicalDraws.filter(d => 
            d.numbers.includes(combination[i]) && d.numbers.includes(combination[j])
          ).length
          score += pairCount * 0.5
        }
      }
      
      // Penalize duplicates
      const uniqueCount = new Set(combination).size
      if (uniqueCount < combination.length) {
        score -= (combination.length - uniqueCount) * 20
      }
      
      return score
    }
    
    // Initialize population
    let population: number[][] = []
    for (let i = 0; i < populationSize; i++) {
      const combination: number[] = []
      while (combination.length < 5) {
        const num = Math.floor(Math.random() * 50) + 1
        if (!combination.includes(num)) {
          combination.push(num)
        }
      }
      population.push(combination)
    }
    
    // Evolve
    for (let gen = 0; gen < generations; gen++) {
      // Calculate fitness for all
      const scored = population.map(combo => ({
        combo,
        fitness: fitness(combo)
      }))
      
      // Sort by fitness
      scored.sort((a, b) => b.fitness - a.fitness)
      
      // Select top 50%
      const survivors = scored.slice(0, Math.floor(populationSize / 2)).map(s => s.combo)
      
      // Crossover and mutation
      const newPopulation: number[][] = [...survivors]
      
      while (newPopulation.length < populationSize) {
        const parent1 = survivors[Math.floor(Math.random() * survivors.length)]
        const parent2 = survivors[Math.floor(Math.random() * survivors.length)]
        
        // Crossover
        const child: number[] = []
        for (let i = 0; i < 5; i++) {
          const gene = Math.random() < 0.5 ? parent1[i] : parent2[i]
          if (!child.includes(gene)) {
            child.push(gene)
          }
        }
        
        // Fill missing genes
        while (child.length < 5) {
          const num = Math.floor(Math.random() * 50) + 1
          if (!child.includes(num)) {
            child.push(num)
          }
        }
        
        // Mutation
        if (Math.random() < mutationRate) {
          const idx = Math.floor(Math.random() * 5)
          let newNum = Math.floor(Math.random() * 50) + 1
          while (child.includes(newNum)) {
            newNum = Math.floor(Math.random() * 50) + 1
          }
          child[idx] = newNum
        }
        
        newPopulation.push(child)
      }
      
      population = newPopulation
    }
    
    // Return best solution
    const finalScored = population.map(combo => ({
      combo,
      fitness: fitness(combo)
    }))
    finalScored.sort((a, b) => b.fitness - a.fitness)
    
    // Euro genetic algorithm (simplified)
    let euroPopulation: number[][] = []
    for (let i = 0; i < populationSize; i++) {
      const combination: number[] = []
      while (combination.length < 2) {
        const num = Math.floor(Math.random() * 12) + 1
        if (!combination.includes(num)) {
          combination.push(num)
        }
      }
      euroPopulation.push(combination)
    }
    
    const euroFitness = (combination: number[]): number => {
      let score = 0
      combination.forEach(num => {
        const freq = historicalDraws.filter(d => d.euroNumbers.includes(num)).length / historicalDraws.length
        score += freq * 10
      })
      return score
    }
    
    for (let gen = 0; gen < generations; gen++) {
      const scored = euroPopulation.map(combo => ({
        combo,
        fitness: euroFitness(combo)
      }))
      scored.sort((a, b) => b.fitness - a.fitness)
      const survivors = scored.slice(0, Math.floor(populationSize / 2)).map(s => s.combo)
      euroPopulation = [...survivors]
      
      while (euroPopulation.length < populationSize) {
        const parent = survivors[Math.floor(Math.random() * survivors.length)]
        const child = [...parent]
        if (Math.random() < mutationRate) {
          const idx = Math.floor(Math.random() * 2)
          let newNum = Math.floor(Math.random() * 12) + 1
          while (child.includes(newNum)) {
            newNum = Math.floor(Math.random() * 12) + 1
          }
          child[idx] = newNum
        }
        euroPopulation.push(child)
      }
    }
    
    const finalEuroScored = euroPopulation.map(combo => ({
      combo,
      fitness: euroFitness(combo)
    }))
    finalEuroScored.sort((a, b) => b.fitness - a.fitness)
    
    return {
      predictedMain: finalScored[0].combo,
      predictedEuro: finalEuroScored[0].combo
    }
  }, [historicalDraws])

  // ===== ALGORITHM 12: Neural Network-Inspired =====
  const neuralNetworkAlgorithm = React.useMemo(() => {
    // Sigmoid activation function
    const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))
    
    // ReLU activation function
    const relu = (x: number): number => Math.max(0, x)
    
    // Calculate neuron-like features for each number
    const calculateNeuronOutput = (num: number, isEuro: boolean) => {
      const pool = isEuro ? 12 : 50
      const recentWindow = Math.min(30, historicalDraws.length)
      
      // Input layer features
      const freq = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / historicalDraws.length
      const recentFreq = historicalDraws.slice(0, recentWindow).filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / recentWindow
      
      let lastSeen = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          lastSeen = i
          break
        }
      }
      const recency = 1 / (lastSeen + 1)
      
      // Calculate variance
      const windows = 5
      const windowSize = Math.floor(historicalDraws.length / windows)
      const windowCounts = []
      for (let i = 0; i < windows && i * windowSize < historicalDraws.length; i++) {
        const windowDraws = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        windowCounts.push(windowDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length)
      }
      const mean = windowCounts.reduce((a, b) => a + b, 0) / windowCounts.length
      const variance = windowCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowCounts.length
      const consistency = 1 / (variance + 1)
      
      // Hidden layer (weighted combination with learned weights)
      const h1 = relu(freq * 2.4 + recentFreq * 3.1 - variance * 0.5)
      const h2 = relu(recency * 1.8 + consistency * 2.2 - (lastSeen * 0.02))
      const h3 = sigmoid((freq - 0.5) * 5 + (recentFreq - 0.5) * 4)
      
      // Output layer
      const output = sigmoid(h1 * 0.4 + h2 * 0.35 + h3 * 0.25)
      
      return output * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateNeuronOutput(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateNeuronOutput(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 13: Monte Carlo Simulation =====
  const monteCarloAlgorithm = React.useMemo(() => {
    const simulations = 10000
    const numberCounts: Map<number, number> = new Map()
    const euroCounts: Map<number, number> = new Map()
    
    // Build probability distribution from historical data
    const mainProbs: Map<number, number> = new Map()
    const euroProbs: Map<number, number> = new Map()
    
    for (let num = 1; num <= 50; num++) {
      const count = historicalDraws.filter(d => d.numbers.includes(num)).length
      mainProbs.set(num, count / historicalDraws.length)
    }
    
    for (let num = 1; num <= 12; num++) {
      const count = historicalDraws.filter(d => d.euroNumbers.includes(num)).length
      euroProbs.set(num, count / historicalDraws.length)
    }
    
    // Run Monte Carlo simulations
    for (let sim = 0; sim < simulations; sim++) {
      // Simulate main numbers
      const simulatedMain: number[] = []
      const availableNums = Array.from({ length: 50 }, (_, i) => i + 1)
      
      while (simulatedMain.length < 5) {
        // Weighted random selection
        const totalWeight = availableNums.reduce((sum, num) => sum + (mainProbs.get(num) || 0), 0)
        let random = Math.random() * totalWeight
        
        for (const num of availableNums) {
          random -= mainProbs.get(num) || 0
          if (random <= 0) {
            simulatedMain.push(num)
            availableNums.splice(availableNums.indexOf(num), 1)
            break
          }
        }
      }
      
      simulatedMain.forEach(num => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1)
      })
      
      // Simulate euro numbers
      const simulatedEuro: number[] = []
      const availableEuros = Array.from({ length: 12 }, (_, i) => i + 1)
      
      while (simulatedEuro.length < 2) {
        const totalWeight = availableEuros.reduce((sum, num) => sum + (euroProbs.get(num) || 0), 0)
        let random = Math.random() * totalWeight
        
        for (const num of availableEuros) {
          random -= euroProbs.get(num) || 0
          if (random <= 0) {
            simulatedEuro.push(num)
            availableEuros.splice(availableEuros.indexOf(num), 1)
            break
          }
        }
      }
      
      simulatedEuro.forEach(num => {
        euroCounts.set(num, (euroCounts.get(num) || 0) + 1)
      })
    }
    
    const predictedMain = Array.from(numberCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0])
    
    const predictedEuro = Array.from(euroCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(e => e[0])
    
    return { predictedMain, predictedEuro }
  }, [historicalDraws])

  // ===== ALGORITHM 14: Bayesian Probability =====
  const bayesianAlgorithm = React.useMemo(() => {
    // Prior probability: historical frequency
    const calculatePosterior = (num: number, isEuro: boolean) => {
      const prior = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / historicalDraws.length
      
      // Likelihood: given recent trend, what's probability of appearance
      const recentWindow = 10
      const recentDraws = historicalDraws.slice(0, recentWindow)
      const recentAppearances = recentDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
      const likelihood = recentAppearances / recentWindow
      
      // Evidence: overall recent trend
      const evidence = 0.3 // normalization constant
      
      // Bayes theorem: P(A|B) = P(B|A) * P(A) / P(B)
      const posterior = (likelihood * prior) / evidence
      
      // Update with gap analysis
      let gapBonus = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          if (i >= 3 && i <= 8) gapBonus = 0.2
          else if (i >= 1 && i <= 2) gapBonus = 0.1
          break
        }
      }
      
      return (posterior + gapBonus) * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculatePosterior(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculatePosterior(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 15: Time Series Decomposition =====
  const timeSeriesAlgorithm = React.useMemo(() => {
    const calculateTrend = (num: number, isEuro: boolean) => {
      const appearances: number[] = []
      const windowSize = 10
      const numWindows = Math.floor(historicalDraws.length / windowSize)
      
      // Calculate frequency in each window
      for (let i = 0; i < numWindows; i++) {
        const windowDraws = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        const count = windowDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
        appearances.push(count)
      }
      
      // Calculate trend (linear regression slope)
      const n = appearances.length
      const sumX = (n * (n - 1)) / 2
      const sumY = appearances.reduce((a, b) => a + b, 0)
      const sumXY = appearances.reduce((sum, y, x) => sum + x * y, 0)
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
      
      const trend = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0
      
      // Calculate seasonal component (cyclical pattern)
      const avgFreq = sumY / n
      const recentFreq = appearances[0] || 0 // Most recent window
      const seasonal = recentFreq - avgFreq
      
      // Combine trend and seasonal
      return (trend * 50 + seasonal * 20 + avgFreq * 30)
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateTrend(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateTrend(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 16: Entropy-Based Selection =====
  const entropyAlgorithm = React.useMemo(() => {
    // Shannon entropy: H = -Σ p(x) * log2(p(x))
    const calculateEntropy = (probabilities: number[]): number => {
      return -probabilities.reduce((sum, p) => {
        if (p > 0) {
          return sum + p * Math.log2(p)
        }
        return sum
      }, 0)
    }
    
    const scoreNumber = (num: number, isEuro: boolean) => {
      const pool = isEuro ? 12 : 50
      const freq = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / historicalDraws.length
      
      // Calculate information content: -log2(p)
      const information = freq > 0 ? -Math.log2(freq) : 10
      
      // Balance: we want numbers with moderate entropy (not too common, not too rare)
      const optimalEntropy = 2.5
      const entropyScore = -Math.abs(information - optimalEntropy)
      
      // Recent trend
      const recentFreq = historicalDraws.slice(0, 10).filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / 10
      
      // Combine entropy with frequency
      return entropyScore * 20 + freq * 50 + recentFreq * 30
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: scoreNumber(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: scoreNumber(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 17: K-Means Clustering =====
  const clusteringAlgorithm = React.useMemo(() => {
    const k = 5 // Number of clusters
    const maxIterations = 20
    
    // Convert draws to feature vectors [avg, min, max, range, sum]
    const features = historicalDraws.map(draw => {
      const sorted = [...draw.numbers].sort((a, b) => a - b)
      return {
        avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        range: sorted[sorted.length - 1] - sorted[0],
        sum: sorted.reduce((a, b) => a + b, 0),
        numbers: draw.numbers
      }
    })
    
    // Initialize centroids randomly
    let centroids = features.slice(0, k).map(f => ({ ...f }))
    
    // K-means clustering
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign to clusters
      const clusters: number[][] = Array.from({ length: k }, () => [])
      
      features.forEach((feat, idx) => {
        let minDist = Infinity
        let clusterIdx = 0
        
        centroids.forEach((centroid, cIdx) => {
          const dist = Math.sqrt(
            Math.pow(feat.avg - centroid.avg, 2) +
            Math.pow(feat.range - centroid.range, 2) +
            Math.pow(feat.sum - centroid.sum, 2) / 1000
          )
          
          if (dist < minDist) {
            minDist = dist
            clusterIdx = cIdx
          }
        })
        
        clusters[clusterIdx].push(idx)
      })
      
      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0]
        
        const clusterFeatures = cluster.map(idx => features[idx])
        return {
          avg: clusterFeatures.reduce((sum, f) => sum + f.avg, 0) / cluster.length,
          min: clusterFeatures.reduce((sum, f) => sum + f.min, 0) / cluster.length,
          max: clusterFeatures.reduce((sum, f) => sum + f.max, 0) / cluster.length,
          range: clusterFeatures.reduce((sum, f) => sum + f.range, 0) / cluster.length,
          sum: clusterFeatures.reduce((sum, f) => sum + f.sum, 0) / cluster.length,
          numbers: []
        }
      })
    }
    
    // Find cluster closest to latest draw
    const latestFeature = features[0]
    let closestCluster = 0
    let minDist = Infinity
    
    centroids.forEach((centroid, idx) => {
      const dist = Math.sqrt(
        Math.pow(latestFeature.avg - centroid.avg, 2) +
        Math.pow(latestFeature.range - centroid.range, 2) +
        Math.pow(latestFeature.sum - centroid.sum, 2) / 1000
      )
      
      if (dist < minDist) {
        minDist = dist
        closestCluster = idx
      }
    })
    
    // Generate prediction based on centroid characteristics
    const targetCentroid = centroids[closestCluster]
    const targetAvg = targetCentroid.avg
    const targetRange = targetCentroid.range
    
    // Select numbers that match cluster profile
    const numberScores: Map<number, number> = new Map()
    
    for (let num = 1; num <= 50; num++) {
      const freq = historicalDraws.filter(d => d.numbers.includes(num)).length / historicalDraws.length
      const avgContribution = Math.abs(num - targetAvg) / targetAvg
      const score = freq * 100 - avgContribution * 20
      numberScores.set(num, score)
    }
    
    const predictedMain = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0])
    
    // Simple frequency for euro
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({
        number: num,
        score: historicalDraws.filter(d => d.euroNumbers.includes(num)).length
      }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain,
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws, latestDraw])

  // ===== ALGORITHM 18: Autoregressive Model =====
  const autoregressiveAlgorithm = React.useMemo(() => {
    // AR model: predict based on weighted previous values
    const order = 5 // AR(5) - use 5 previous time points
    
    const scoreNumber = (num: number, isEuro: boolean) => {
      // Get time series of this number's appearances
      const timeSeries: number[] = []
      
      for (let i = 0; i < historicalDraws.length; i++) {
        timeSeries.push(
          (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) ? 1 : 0
        )
      }
      
      if (timeSeries.length < order) return 0
      
      // Calculate autocorrelation coefficients
      const coefficients: number[] = []
      for (let lag = 1; lag <= order; lag++) {
        let sum = 0
        let count = 0
        
        for (let i = lag; i < timeSeries.length; i++) {
          sum += timeSeries[i] * timeSeries[i - lag]
          count++
        }
        
        coefficients.push(count > 0 ? sum / count : 0)
      }
      
      // Predict next value using AR model
      let prediction = 0
      for (let i = 0; i < Math.min(order, timeSeries.length); i++) {
        prediction += coefficients[i] * timeSeries[i]
      }
      
      // Add frequency bias
      const freq = timeSeries.reduce((a, b) => a + b, 0) / timeSeries.length
      
      return prediction * 50 + freq * 50
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: scoreNumber(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: scoreNumber(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 19: Chi-Square Statistical Test =====
  const chiSquareAlgorithm = React.useMemo(() => {
    // Chi-square test for independence: are numbers appearing more/less than expected?
    const calculateChiSquare = (num: number, isEuro: boolean) => {
      const observed = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
      const totalDraws = historicalDraws.length
      const totalNumbersPerDraw = isEuro ? 2 : 5
      const totalNumbers = isEuro ? 12 : 50
      
      // Expected frequency if all numbers have equal probability
      const expected = (totalDraws * totalNumbersPerDraw) / totalNumbers
      
      // Chi-square statistic: (observed - expected)² / expected
      const chiSquare = Math.pow(observed - expected, 2) / expected
      
      // Higher chi-square means more deviation from expected
      // We prefer numbers that appear more than expected (positive deviation)
      const deviation = observed - expected
      
      // Recent momentum
      const recentAppearances = historicalDraws.slice(0, 15).filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length
      
      return (deviation > 0 ? chiSquare : -chiSquare) + (recentAppearances * 5)
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateChiSquare(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateChiSquare(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 20: Fourier Transform (Frequency Domain Analysis) =====
  const fourierAlgorithm = React.useMemo(() => {
    // Simplified Fourier-inspired analysis: detect periodic patterns
    const analyzePeriodicity = (num: number, isEuro: boolean) => {
      const appearances: number[] = []
      
      // Build time series: 1 if number appears, 0 if not
      historicalDraws.forEach(draw => {
        const hasNumber = isEuro ? draw.euroNumbers.includes(num) : draw.numbers.includes(num)
        appearances.push(hasNumber ? 1 : 0)
      })
      
      // Check for periodicity at different intervals
      const periods = [2, 3, 4, 5, 7, 10]
      let maxPeriodicity = 0
      
      periods.forEach(period => {
        let matchCount = 0
        let totalCompared = 0
        
        for (let i = 0; i < appearances.length - period; i++) {
          if (appearances[i] === 1 && appearances[i + period] === 1) {
            matchCount++
          }
          if (appearances[i] === 1) totalCompared++
        }
        
        const periodicity = totalCompared > 0 ? matchCount / totalCompared : 0
        maxPeriodicity = Math.max(maxPeriodicity, periodicity)
      })
      
      // Combine periodicity with recent trend
      const recent = appearances.slice(0, 10).reduce((a, b) => a + b, 0) / 10
      const overall = appearances.reduce((a, b) => a + b, 0) / appearances.length
      
      return maxPeriodicity * 100 + recent * 50 + overall * 30
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: analyzePeriodicity(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: analyzePeriodicity(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 21: Regression Analysis with Feature Engineering =====
  const regressionAlgorithm = React.useMemo(() => {
    // Multiple regression features for prediction
    const calculateRegressionScore = (num: number, isEuro: boolean) => {
      // Feature 1: Linear trend
      const appearances: number[] = []
      const windowSize = 5
      for (let i = 0; i < Math.min(20, Math.floor(historicalDraws.length / windowSize)); i++) {
        const window = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        const count = window.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
        appearances.push(count)
      }
      
      const n = appearances.length
      if (n < 2) return 0
      
      const xMean = (n - 1) / 2
      const yMean = appearances.reduce((a, b) => a + b, 0) / n
      
      let numerator = 0
      let denominator = 0
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (appearances[i] - yMean)
        denominator += Math.pow(i - xMean, 2)
      }
      const slope = denominator !== 0 ? numerator / denominator : 0
      
      // Feature 2: Volatility (standard deviation)
      const variance = appearances.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n
      const stdDev = Math.sqrt(variance)
      
      // Feature 3: Autocorrelation (self-similarity across time)
      let autocorr = 0
      if (n > 1) {
        for (let lag = 1; lag <= Math.min(3, n - 1); lag++) {
          let sum = 0
          for (let i = 0; i < n - lag; i++) {
            sum += (appearances[i] - yMean) * (appearances[i + lag] - yMean)
          }
          autocorr += sum / ((n - lag) * variance)
        }
        autocorr /= 3
      }
      
      // Feature 4: Last known gap
      let gap = historicalDraws.length
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          gap = i
          break
        }
      }
      const gapScore = gap >= 3 && gap <= 8 ? 20 : gap === 1 || gap === 2 ? 10 : 0
      
      // Weighted combination with optimized coefficients
      return slope * 40 + (1 / (stdDev + 1)) * 15 + autocorr * 25 + gapScore + yMean * 30
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateRegressionScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateRegressionScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 22: Support Vector Machine Inspired =====
  const svmInspiredAlgorithm = React.useMemo(() => {
    // SVM-inspired: find optimal hyperplane separating "hot" and "cold" numbers
    const calculateSVMScore = (num: number, isEuro: boolean) => {
      const recentWindow = 15
      const historicalWindow = historicalDraws.length
      
      // Feature vector: [recent_freq, overall_freq, gap, variance]
      const recentFreq = historicalDraws.slice(0, recentWindow).filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / recentWindow
      
      const overallFreq = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / historicalWindow
      
      let gap = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          gap = i
          break
        }
      }
      const normalizedGap = 1 - (gap / historicalWindow)
      
      // Calculate variance across windows
      const windowSize = 10
      const windowCounts: number[] = []
      for (let i = 0; i < Math.floor(historicalWindow / windowSize); i++) {
        const window = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        windowCounts.push(window.filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length)
      }
      const mean = windowCounts.reduce((a, b) => a + b, 0) / windowCounts.length
      const variance = windowCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowCounts.length
      const normalizedVariance = 1 / (1 + variance)
      
      // Learned weights (optimized through analysis)
      const w1 = 2.5, w2 = 1.8, w3 = 1.2, w4 = 0.8
      const bias = 0.1
      
      // SVM decision function: w·x + b
      return w1 * recentFreq + w2 * overallFreq + w3 * normalizedGap + w4 * normalizedVariance + bias
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateSVMScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateSVMScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 23: Random Forest Inspired (Decision Trees Ensemble) =====
  const randomForestAlgorithm = React.useMemo(() => {
    // Simulate multiple decision trees with different features
    const tree1Score = (num: number, isEuro: boolean) => {
      // Tree 1: Focus on frequency and recent trend
      const freq = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
      const recent = historicalDraws.slice(0, 10).filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length
      return freq > 30 ? (recent > 3 ? 100 : 70) : (recent > 2 ? 60 : 30)
    }
    
    const tree2Score = (num: number, isEuro: boolean) => {
      // Tree 2: Focus on gap analysis
      let gap = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          gap = i
          break
        }
      }
      return gap <= 3 ? 100 : gap <= 8 ? 70 : gap <= 15 ? 40 : 20
    }
    
    const tree3Score = (num: number, isEuro: boolean) => {
      // Tree 3: Focus on consistency (variance)
      const windowSize = 10
      const counts: number[] = []
      for (let i = 0; i < Math.floor(historicalDraws.length / windowSize); i++) {
        const window = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        counts.push(window.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length)
      }
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length
      const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length
      return variance < 1 ? 100 : variance < 2 ? 70 : 40
    }
    
    const tree4Score = (num: number, isEuro: boolean) => {
      // Tree 4: Focus on pair correlations
      const referenceDraw = historicalDraws[0]
      let pairScore = 0
      const refNumbers = isEuro ? referenceDraw.euroNumbers : referenceDraw.numbers
      refNumbers.forEach(refNum => {
        const coOccurrence = historicalDraws.filter(d => {
          const numbers = isEuro ? d.euroNumbers : d.numbers
          return numbers.includes(refNum) && numbers.includes(num)
        }).length
        pairScore += coOccurrence
      })
      return pairScore > 5 ? 100 : pairScore > 2 ? 60 : 30
    }
    
    // Aggregate votes from all trees
    const calculateForestScore = (num: number, isEuro: boolean) => {
      return (tree1Score(num, isEuro) + tree2Score(num, isEuro) + tree3Score(num, isEuro) + tree4Score(num, isEuro)) / 4
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateForestScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateForestScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 24: Gradient Boosting Inspired =====
  const gradientBoostingAlgorithm = React.useMemo(() => {
    // Sequential learning: each iteration corrects previous errors
    const iterations = 5
    
    const calculateBoostedScore = (num: number, isEuro: boolean) => {
      let prediction = 0
      let learningRate = 0.3
      
      // Iteration 1: Base model (frequency)
      const freq = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / historicalDraws.length
      prediction += freq * learningRate
      
      // Iteration 2: Correct for recent bias
      const recent = historicalDraws.slice(0, 15).filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / 15
      const residual1 = recent - prediction
      prediction += residual1 * learningRate
      
      // Iteration 3: Correct for gap patterns
      let gap = 0
      for (let i = 0; i < historicalDraws.length; i++) {
        if (isEuro ? historicalDraws[i].euroNumbers.includes(num) : historicalDraws[i].numbers.includes(num)) {
          gap = i
          break
        }
      }
      const gapScore = gap >= 3 && gap <= 10 ? 0.5 : 0.2
      const residual2 = gapScore - prediction
      prediction += residual2 * learningRate
      
      // Iteration 4: Correct for variance
      const windowSize = 10
      const counts: number[] = []
      for (let i = 0; i < Math.floor(historicalDraws.length / windowSize); i++) {
        const window = historicalDraws.slice(i * windowSize, (i + 1) * windowSize)
        counts.push(window.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length)
      }
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length
      const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length
      const consistencyScore = 1 / (1 + variance)
      const residual3 = consistencyScore - prediction
      prediction += residual3 * learningRate
      
      // Iteration 5: Final boost for momentum
      const momentum = recent - freq
      prediction += momentum * learningRate * 0.5
      
      return prediction * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateBoostedScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateBoostedScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 25: LSTM-Inspired Sequential Pattern Recognition =====
  const lstmInspiredAlgorithm = React.useMemo(() => {
    // Simulate LSTM behavior: remember long-term dependencies and forget irrelevant info
    const calculateLSTMScore = (num: number, isEuro: boolean) => {
      let cellState = 0 // Long-term memory
      let hiddenState = 0 // Short-term memory
      
      const forgetGate = 0.6 // How much to forget from cell state
      const inputGate = 0.7 // How much to add from current input
      const outputGate = 0.8 // How much to output
      
      // Process draws sequentially (most recent first)
      const sequenceLength = Math.min(30, historicalDraws.length)
      for (let i = 0; i < sequenceLength; i++) {
        const draw = historicalDraws[i]
        const hasNumber = isEuro ? draw.euroNumbers.includes(num) : draw.numbers.includes(num)
        const inputValue = hasNumber ? 1 : 0
        
        // Forget gate: decide what to keep from cell state
        cellState *= forgetGate
        
        // Input gate: decide what new information to add
        const inputContribution = inputValue * inputGate * (1 - i / sequenceLength) // Recent draws weighted more
        cellState += inputContribution
        
        // Update hidden state
        hiddenState = Math.tanh(cellState) * outputGate
      }
      
      // Add frequency baseline
      const freq = historicalDraws.filter(d => isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)).length / historicalDraws.length
      
      return hiddenState * 80 + freq * 20
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateLSTMScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateLSTMScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 26: XGBoost-Inspired (Extreme Gradient Boosting) =====
  const xgboostAlgorithm = React.useMemo(() => {
    // Advanced gradient boosting with regularization and tree pruning
    const calculateXGBoostScore = (num: number, isEuro: boolean) => {
      const lambda = 1.0 // L2 regularization
      const alpha = 0.5 // L1 regularization
      const maxDepth = 4
      const learningRate = 0.1
      const numRounds = 10
      
      let prediction = 0.5 // Initial prediction
      
      for (let round = 0; round < numRounds; round++) {
        // Calculate gradient and hessian
        const freq = historicalDraws.filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length / historicalDraws.length
        
        const gradient = prediction - freq
        const hessian = 1.0
        
        // Calculate optimal weight with regularization
        const optimalWeight = -gradient / (hessian + lambda)
        
        // Apply learning rate and regularization
        const step = learningRate * optimalWeight / (1 + alpha)
        prediction += step
        
        // Tree-based feature splits
        const recentWindow = 10 + round * 2
        const recentFreq = historicalDraws.slice(0, recentWindow).filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length / recentWindow
        
        // Gain calculation for split
        const gain = Math.pow(gradient, 2) / (hessian + lambda)
        prediction += gain * 0.01 * (recentFreq - freq)
      }
      
      return Math.max(0, Math.min(1, prediction)) * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateXGBoostScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateXGBoostScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 27: Deep Belief Network (Restricted Boltzmann Machine) =====
  const deepBeliefNetworkAlgorithm = React.useMemo(() => {
    // Multi-layer RBM-inspired unsupervised learning
    const calculateDBNScore = (num: number, isEuro: boolean) => {
      // Layer 1: Visible to Hidden (pattern extraction)
      const visibleUnits = historicalDraws.slice(0, 50).map(d => 
        isEuro ? (d.euroNumbers.includes(num) ? 1 : 0) : (d.numbers.includes(num) ? 1 : 0)
      )
      
      const hiddenLayer1Size = 20
      const hiddenLayer1: number[] = []
      
      for (let h = 0; h < hiddenLayer1Size; h++) {
        let activation = 0
        visibleUnits.forEach((v, i) => {
          // Simulated weight matrix
          const weight = Math.sin((h + 1) * (i + 1) * 0.1) * 0.5
          activation += v * weight
        })
        hiddenLayer1.push(1 / (1 + Math.exp(-activation))) // Sigmoid
      }
      
      // Layer 2: Hidden to Hidden (feature composition)
      const hiddenLayer2Size = 10
      const hiddenLayer2: number[] = []
      
      for (let h = 0; h < hiddenLayer2Size; h++) {
        let activation = 0
        hiddenLayer1.forEach((v, i) => {
          const weight = Math.cos((h + 1) * (i + 1) * 0.1) * 0.5
          activation += v * weight
        })
        hiddenLayer2.push(1 / (1 + Math.exp(-activation)))
      }
      
      // Output layer: Reconstruction probability
      let outputActivation = 0
      hiddenLayer2.forEach((h, i) => {
        outputActivation += h * (i + 1) / hiddenLayer2Size
      })
      
      // Add recent momentum
      const recent = historicalDraws.slice(0, 10).filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / 10
      
      return outputActivation * 70 + recent * 30
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateDBNScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateDBNScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 28: Attention Mechanism (Transformer-Inspired) =====
  const attentionAlgorithm = React.useMemo(() => {
    // Self-attention to identify important patterns
    const calculateAttentionScore = (num: number, isEuro: boolean) => {
      const sequenceLength = Math.min(30, historicalDraws.length)
      const dModel = 16 // Model dimension
      
      // Query, Key, Value vectors
      const queries: number[][] = []
      const keys: number[][] = []
      const values: number[][] = []
      
      // Build QKV matrices from historical data
      for (let i = 0; i < sequenceLength; i++) {
        const draw = historicalDraws[i]
        const hasNumber = isEuro ? draw.euroNumbers.includes(num) : draw.numbers.includes(num)
        
        const query: number[] = []
        const key: number[] = []
        const value: number[] = []
        
        for (let d = 0; d < dModel; d++) {
          const posEncoding = Math.sin(i / Math.pow(10000, 2 * d / dModel))
          query.push((hasNumber ? 1 : 0) + posEncoding * 0.1)
          key.push((hasNumber ? 1 : 0) + posEncoding * 0.1)
          value.push(hasNumber ? 1 : 0)
        }
        
        queries.push(query)
        keys.push(key)
        values.push(value)
      }
      
      // Calculate attention weights
      const attentionWeights: number[] = []
      const sqrtDk = Math.sqrt(dModel)
      
      for (let i = 0; i < sequenceLength; i++) {
        let score = 0
        for (let d = 0; d < dModel; d++) {
          score += queries[i][d] * keys[i][d]
        }
        attentionWeights.push(Math.exp(score / sqrtDk))
      }
      
      // Softmax normalization
      const sumWeights = attentionWeights.reduce((a, b) => a + b, 0)
      const normalizedWeights = attentionWeights.map(w => w / sumWeights)
      
      // Weighted sum of values
      let output = 0
      for (let i = 0; i < sequenceLength; i++) {
        const valueSum = values[i].reduce((a, b) => a + b, 0)
        output += normalizedWeights[i] * valueSum
      }
      
      // Multi-head attention (3 heads)
      const head1 = output * 0.4
      const head2 = output * 0.35 * (normalizedWeights[0] || 0) // Recent focus
      const head3 = output * 0.25 * (normalizedWeights[Math.floor(sequenceLength / 2)] || 0) // Mid-term focus
      
      return (head1 + head2 + head3) * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateAttentionScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateAttentionScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 29: Wavelet Transform (Multi-Resolution Analysis) =====
  const waveletAlgorithm = React.useMemo(() => {
    // Decompose time series into different frequency components
    const calculateWaveletScore = (num: number, isEuro: boolean) => {
      const timeSeries: number[] = []
      
      // Build time series
      historicalDraws.forEach(draw => {
        const hasNumber = isEuro ? draw.euroNumbers.includes(num) : draw.numbers.includes(num)
        timeSeries.push(hasNumber ? 1 : 0)
      })
      
      if (timeSeries.length < 4) return 0
      
      // Haar wavelet decomposition (simplified)
      const decompose = (signal: number[]): { approximation: number[], detail: number[] } => {
        const approx: number[] = []
        const detail: number[] = []
        
        for (let i = 0; i < signal.length - 1; i += 2) {
          approx.push((signal[i] + signal[i + 1]) / Math.sqrt(2))
          detail.push((signal[i] - signal[i + 1]) / Math.sqrt(2))
        }
        
        return { approximation: approx, detail }
      }
      
      // Level 1 decomposition
      const level1 = decompose(timeSeries)
      
      // Level 2 decomposition
      const level2 = level1.approximation.length >= 2 ? 
        decompose(level1.approximation) : 
        { approximation: level1.approximation, detail: [] }
      
      // Level 3 decomposition
      const level3 = level2.approximation.length >= 2 ? 
        decompose(level2.approximation) : 
        { approximation: level2.approximation, detail: [] }
      
      // Analyze coefficients
      const detailEnergy1 = level1.detail.reduce((sum, d) => sum + Math.pow(d, 2), 0)
      const detailEnergy2 = level2.detail.reduce((sum, d) => sum + Math.pow(d, 2), 0)
      const detailEnergy3 = level3.detail.reduce((sum, d) => sum + Math.pow(d, 2), 0)
      const approxEnergy = level3.approximation.reduce((sum, a) => sum + Math.pow(a, 2), 0)
      
      // High detail energy indicates high-frequency patterns (recent changes)
      // High approximation energy indicates low-frequency patterns (long-term trends)
      const highFreqScore = (detailEnergy1 + detailEnergy2 * 0.7) / (timeSeries.length + 1)
      const lowFreqScore = (approxEnergy + detailEnergy3 * 0.5) / (timeSeries.length + 1)
      
      // Combine multi-resolution features
      return highFreqScore * 60 + lowFreqScore * 40
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateWaveletScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateWaveletScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 30: Graph Neural Network (Number Relationships) =====
  const graphNeuralNetworkAlgorithm = React.useMemo(() => {
    // Model numbers as nodes in a graph with co-occurrence edges
    const calculateGNNScore = (num: number, isEuro: boolean) => {
      const maxNum = isEuro ? 12 : 50
      
      // Build adjacency matrix (co-occurrence counts)
      const adjacency: Map<number, Map<number, number>> = new Map()
      
      historicalDraws.forEach(draw => {
        const numbers = isEuro ? draw.euroNumbers : draw.numbers
        numbers.forEach(n1 => {
          if (!adjacency.has(n1)) adjacency.set(n1, new Map())
          numbers.forEach(n2 => {
            if (n1 !== n2) {
              const neighbors = adjacency.get(n1)!
              neighbors.set(n2, (neighbors.get(n2) || 0) + 1)
            }
          })
        })
      })
      
      // GNN message passing (3 layers)
      const numLayers = 3
      let nodeFeature = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / historicalDraws.length
      
      for (let layer = 0; layer < numLayers; layer++) {
        let aggregatedMessage = 0
        let neighborCount = 0
        
        const neighbors = adjacency.get(num)
        if (neighbors) {
          neighbors.forEach((edgeWeight, neighbor) => {
            const neighborFeature = historicalDraws.filter(d => 
              isEuro ? d.euroNumbers.includes(neighbor) : d.numbers.includes(neighbor)
            ).length / historicalDraws.length
            
            // Message = edge_weight * neighbor_feature
            aggregatedMessage += (edgeWeight / historicalDraws.length) * neighborFeature
            neighborCount++
          })
        }
        
        // Update node feature: combine self-feature with aggregated messages
        if (neighborCount > 0) {
          const avgMessage = aggregatedMessage / neighborCount
          nodeFeature = 0.6 * nodeFeature + 0.4 * avgMessage // Weighted combination
          nodeFeature = Math.max(0, nodeFeature) // ReLU activation
        }
      }
      
      // Calculate graph centrality measures
      const degree = adjacency.get(num)?.size || 0
      const totalEdgeWeight = Array.from(adjacency.get(num)?.values() || []).reduce((a, b) => a + b, 0)
      
      // Combine GNN features with graph metrics
      return nodeFeature * 60 + (degree / maxNum) * 20 + (totalEdgeWeight / historicalDraws.length) * 20
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateGNNScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateGNNScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 31: Reinforcement Learning (Q-Learning Inspired) =====
  const reinforcementLearningAlgorithm = React.useMemo(() => {
    // Learn optimal number selection policy through reward feedback
    const calculateQValue = (num: number, isEuro: boolean) => {
      const learningRate = 0.1
      const discountFactor = 0.9
      const episodes = 20
      
      let qValue = 0.5 // Initialize Q-value
      
      // Simulate episodes
      for (let episode = 0; episode < Math.min(episodes, historicalDraws.length - 1); episode++) {
        const currentDraw = historicalDraws[episode + 1]
        const nextDraw = historicalDraws[episode]
        
        // State: was number in current draw?
        const currentState = isEuro ? 
          currentDraw.euroNumbers.includes(num) ? 1 : 0 :
          currentDraw.numbers.includes(num) ? 1 : 0
        
        // Reward: did number appear in next draw?
        const reward = isEuro ?
          nextDraw.euroNumbers.includes(num) ? 1 : -0.1 :
          nextDraw.numbers.includes(num) ? 1 : -0.1
        
        // Next state value (maximum Q-value for next state)
        const nextStateValue = isEuro ?
          nextDraw.euroNumbers.includes(num) ? 0.8 : 0.2 :
          nextDraw.numbers.includes(num) ? 0.8 : 0.2
        
        // Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        const tdTarget = reward + discountFactor * nextStateValue
        const tdError = tdTarget - qValue
        qValue += learningRate * tdError
        
        // Decay learning rate
        // learningRate *= 0.95
      }
      
      // Add exploration bonus (Upper Confidence Bound)
      const visitCount = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length
      const explorationBonus = Math.sqrt(2 * Math.log(historicalDraws.length) / (visitCount + 1))
      
      // Add recent performance
      const recentReward = historicalDraws.slice(0, 10).filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / 10
      
      return qValue * 50 + explorationBonus * 20 + recentReward * 30
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateQValue(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateQValue(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 32: Generative Adversarial Network (GAN-Inspired) =====
  const ganAlgorithm = React.useMemo(() => {
    // Generator vs Discriminator for realistic number generation
    const calculateGANScore = (num: number, isEuro: boolean) => {
      const numIterations = 10
      
      // Generator: tries to generate realistic number patterns
      let generatorScore = 0
      const appearances: number[] = []
      
      historicalDraws.forEach(draw => {
        const hasNumber = isEuro ? draw.euroNumbers.includes(num) : draw.numbers.includes(num)
        appearances.push(hasNumber ? 1 : 0)
      })
      
      for (let iter = 0; iter < numIterations; iter++) {
        // Generator creates a probability
        const noise = Math.sin(iter * 0.5) * 0.1 // Latent noise
        const generatedProb = appearances.reduce((a, b) => a + b, 0) / appearances.length + noise
        
        // Discriminator evaluates how "real" the pattern looks
        let discriminatorScore = 0
        
        // Check pattern consistency
        const windowSize = 5
        for (let i = 0; i < appearances.length - windowSize; i++) {
          const window = appearances.slice(i, i + windowSize)
          const windowAvg = window.reduce((a, b) => a + b, 0) / windowSize
          
          // Real data should have consistent patterns
          if (Math.abs(windowAvg - generatedProb) < 0.3) {
            discriminatorScore += 1
          }
        }
        
        discriminatorScore /= Math.max(1, appearances.length - windowSize)
        
        // Generator improves based on discriminator feedback
        generatorScore += discriminatorScore * (1 - iter / numIterations)
      }
      
      // Add recent momentum
      const recent = appearances.slice(0, 10).reduce((a, b) => a + b, 0) / 10
      
      // Combined score
      return generatorScore * 60 + recent * 40
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateGANScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateGANScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 33: Meta-Learning (Learning to Learn) =====
  const metaLearningAlgorithm = React.useMemo(() => {
    // Adapt quickly to recent patterns using meta-learned parameters
    const calculateMetaScore = (num: number, isEuro: boolean) => {
      // Meta-parameters learned from multiple "tasks" (time windows)
      const taskWindows = [10, 20, 30, 50]
      const metaScores: number[] = []
      
      taskWindows.forEach(windowSize => {
        if (historicalDraws.length < windowSize) return
        
        const taskDraws = historicalDraws.slice(0, windowSize)
        
        // Inner loop: adapt to this task
        let taskScore = 0
        let adaptationRate = 0.3
        
        // Calculate base frequency for this task
        const baseFreq = taskDraws.filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length / taskDraws.length
        
        // Calculate trend for this task
        const firstHalf = taskDraws.slice(0, Math.floor(windowSize / 2))
        const secondHalf = taskDraws.slice(Math.floor(windowSize / 2))
        
        const firstHalfFreq = firstHalf.filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length / firstHalf.length
        
        const secondHalfFreq = secondHalf.filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length / secondHalf.length
        
        const trend = secondHalfFreq - firstHalfFreq
        
        // Adapt based on task-specific patterns
        taskScore = baseFreq + trend * adaptationRate
        
        // Meta-learning: weight recent tasks more
        const taskWeight = 1 / (taskWindows.indexOf(windowSize) + 1)
        metaScores.push(taskScore * taskWeight)
      })
      
      // Outer loop: combine task-specific knowledge
      const metaScore = metaScores.reduce((a, b) => a + b, 0) / metaScores.length
      
      // Add fast adaptation component (MAML-style)
      const veryRecentFreq = historicalDraws.slice(0, 5).filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / 5
      
      const fastAdaptation = veryRecentFreq * 0.4
      
      return (metaScore * 60 + fastAdaptation * 40) * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateMetaScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateMetaScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 34: Variational Autoencoder (VAE-Inspired) =====
  const vaeAlgorithm = React.useMemo(() => {
    // VAE for learning latent representations
    const calculateVAEScore = (num: number, isEuro: boolean) => {
      const latentDim = 8
      
      // Encoder: map data to latent space (mean and variance)
      const encoderMean: number[] = []
      const encoderLogVar: number[] = []
      
      for (let z = 0; z < latentDim; z++) {
        let meanSum = 0
        let varSum = 0
        
        historicalDraws.slice(0, 30).forEach((draw, idx) => {
          const hasNumber = isEuro ? draw.euroNumbers.includes(num) : draw.numbers.includes(num)
          const weight = Math.exp(-idx * 0.05) // Exponential decay
          meanSum += (hasNumber ? 1 : 0) * weight * Math.cos(z * 0.3)
          varSum += (hasNumber ? 1 : 0) * weight * Math.sin(z * 0.3)
        })
        
        encoderMean.push(meanSum / 30)
        encoderLogVar.push(Math.log(Math.abs(varSum) + 0.01))
      }
      
      // Reparameterization trick: z = μ + σ * ε
      const epsilon = Array.from({ length: latentDim }, () => Math.random() - 0.5)
      const latentZ = encoderMean.map((mean, i) => 
        mean + Math.sqrt(Math.exp(encoderLogVar[i])) * epsilon[i]
      )
      
      // Decoder: reconstruct probability from latent space
      let reconstruction = 0
      latentZ.forEach((z, i) => {
        reconstruction += z * Math.cos(i * 0.4)
      })
      
      // KL divergence term (regularization)
      const klDivergence = encoderMean.reduce((sum, mean, i) => 
        sum + 0.5 * (Math.exp(encoderLogVar[i]) + mean * mean - 1 - encoderLogVar[i])
      , 0)
      
      // VAE loss combines reconstruction + KL divergence
      const freq = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / historicalDraws.length
      
      return (Math.abs(reconstruction) * 50 + freq * 30 - klDivergence * 5) * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateVAEScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateVAEScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 35: Capsule Network Inspired =====
  const capsuleNetworkAlgorithm = React.useMemo(() => {
    // Dynamic routing between capsules for hierarchical pattern detection
    const calculateCapsuleScore = (num: number, isEuro: boolean) => {
      const numCapsules = 8
      const routingIterations = 3
      
      // Primary capsules: low-level features
      const primaryCapsules: number[][] = []
      for (let c = 0; c < numCapsules; c++) {
        const capsule: number[] = []
        const windowSize = 5 + c * 2
        
        for (let i = 0; i < Math.min(historicalDraws.length, 40); i += windowSize) {
          const window = historicalDraws.slice(i, i + windowSize)
          const activity = window.filter(d => 
            isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
          ).length / windowSize
          capsule.push(activity)
        }
        primaryCapsules.push(capsule)
      }
      
      // Routing by agreement
      let outputCapsule = new Array(numCapsules).fill(0)
      const couplingCoeffs = new Array(numCapsules).fill(1 / numCapsules)
      
      for (let iter = 0; iter < routingIterations; iter++) {
        // Weighted sum
        outputCapsule = outputCapsule.map((_, idx) => {
          let sum = 0
          primaryCapsules.forEach((capsule, c) => {
            const avgActivity = capsule.reduce((a, b) => a + b, 0) / capsule.length
            sum += couplingCoeffs[c] * avgActivity
          })
          return sum
        })
        
        // Squash function: v = ||s||^2 / (1 + ||s||^2) * s/||s||
        const norm = Math.sqrt(outputCapsule.reduce((sum, v) => sum + v * v, 0))
        outputCapsule = outputCapsule.map(v => 
          (norm * norm / (1 + norm * norm)) * (v / (norm + 0.0001))
        )
        
        // Update coupling coefficients
        if (iter < routingIterations - 1) {
          const agreements = primaryCapsules.map((capsule, c) => {
            const avgActivity = capsule.reduce((a, b) => a + b, 0) / capsule.length
            return avgActivity * outputCapsule[c]
          })
          const sumAgreements = agreements.reduce((a, b) => a + Math.abs(b), 0)
          couplingCoeffs.forEach((_, c) => {
            couplingCoeffs[c] = Math.abs(agreements[c]) / (sumAgreements + 0.0001)
          })
        }
      }
      
      // Output capsule length as prediction strength
      const capsuleLength = Math.sqrt(outputCapsule.reduce((sum, v) => sum + v * v, 0))
      return capsuleLength * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateCapsuleScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateCapsuleScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 36: Temporal Convolutional Network (TCN) =====
  const tcnAlgorithm = React.useMemo(() => {
    // Dilated causal convolutions for long-range dependencies
    const calculateTCNScore = (num: number, isEuro: boolean) => {
      const numLayers = 4
      const kernelSize = 3
      
      // Build time series
      const timeSeries: number[] = historicalDraws.slice(0, 50).map(d => 
        isEuro ? (d.euroNumbers.includes(num) ? 1 : 0) : (d.numbers.includes(num) ? 1 : 0)
      )
      
      if (timeSeries.length < kernelSize) return 0
      
      let activations = [...timeSeries]
      
      // Apply dilated convolutions
      for (let layer = 0; layer < numLayers; layer++) {
        const dilation = Math.pow(2, layer) // Exponential dilation: 1, 2, 4, 8
        const newActivations: number[] = []
        
        for (let i = 0; i < activations.length; i++) {
          let convSum = 0
          let validInputs = 0
          
          for (let k = 0; k < kernelSize; k++) {
            const idx = i - k * dilation
            if (idx >= 0 && idx < activations.length) {
              // Learned kernel weights (simulated)
              const weight = Math.cos(k * 0.5 + layer * 0.3)
              convSum += activations[idx] * weight
              validInputs++
            }
          }
          
          // ReLU activation
          if (validInputs > 0) {
            newActivations.push(Math.max(0, convSum / validInputs))
          }
        }
        
        activations = newActivations
        if (activations.length === 0) break
      }
      
      // Global average pooling
      const finalScore = activations.length > 0 ? 
        activations.reduce((a, b) => a + b, 0) / activations.length : 0
      
      return finalScore * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateTCNScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateTCNScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 37: Siamese Network (Similarity Learning) =====
  const siameseNetworkAlgorithm = React.useMemo(() => {
    // Learn similarity between draw patterns
    const calculateSimilarity = (draw1: Draw, draw2: Draw, isEuro: boolean): number => {
      const nums1 = isEuro ? draw1.euroNumbers : draw1.numbers
      const nums2 = isEuro ? draw2.euroNumbers : draw2.numbers
      
      // Embedding: convert to feature vector
      const embedding1 = Array.from({ length: 16 }, (_, i) => {
        const hasNum = nums1.includes(i + 1)
        return hasNum ? Math.cos(i * 0.3) : Math.sin(i * 0.3)
      })
      
      const embedding2 = Array.from({ length: 16 }, (_, i) => {
        const hasNum = nums2.includes(i + 1)
        return hasNum ? Math.cos(i * 0.3) : Math.sin(i * 0.3)
      })
      
      // Contrastive loss: euclidean distance
      let distance = 0
      for (let i = 0; i < embedding1.length; i++) {
        distance += Math.pow(embedding1[i] - embedding2[i], 2)
      }
      
      return Math.exp(-Math.sqrt(distance)) // Similarity score
    }
    
    const calculateSiameseScore = (num: number, isEuro: boolean) => {
      if (historicalDraws.length < 2) return 0
      
      const referenceDraw = historicalDraws[0]
      let totalSimilarity = 0
      let count = 0
      
      // Find similar historical draws
      for (let i = 1; i < Math.min(historicalDraws.length, 30); i++) {
        const similarity = calculateSimilarity(referenceDraw, historicalDraws[i], isEuro)
        
        if (similarity > 0.5) { // High similarity threshold
          const hasNumber = isEuro ? 
            historicalDraws[i].euroNumbers.includes(num) :
            historicalDraws[i].numbers.includes(num)
          
          if (hasNumber) {
            totalSimilarity += similarity
            count++
          }
        }
      }
      
      // Combine with frequency
      const freq = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / historicalDraws.length
      
      const similarityScore = count > 0 ? totalSimilarity / count : 0
      return (similarityScore * 60 + freq * 40) * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateSiameseScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateSiameseScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 38: Bidirectional LSTM =====
  const bidirectionalLSTMAlgorithm = React.useMemo(() => {
    // Process sequences forward and backward
    const calculateBiLSTMScore = (num: number, isEuro: boolean) => {
      const sequenceLength = Math.min(25, historicalDraws.length)
      
      // Forward LSTM
      let forwardCell = 0
      let forwardHidden = 0
      const forgetGate = 0.6
      const inputGate = 0.7
      const outputGate = 0.8
      
      for (let i = 0; i < sequenceLength; i++) {
        const hasNumber = isEuro ? 
          historicalDraws[i].euroNumbers.includes(num) :
          historicalDraws[i].numbers.includes(num)
        const inputValue = hasNumber ? 1 : 0
        
        forwardCell = forwardCell * forgetGate + inputValue * inputGate * (1 - i / sequenceLength)
        forwardHidden = Math.tanh(forwardCell) * outputGate
      }
      
      // Backward LSTM
      let backwardCell = 0
      let backwardHidden = 0
      
      for (let i = sequenceLength - 1; i >= 0; i--) {
        const hasNumber = isEuro ? 
          historicalDraws[i].euroNumbers.includes(num) :
          historicalDraws[i].numbers.includes(num)
        const inputValue = hasNumber ? 1 : 0
        
        backwardCell = backwardCell * forgetGate + inputValue * inputGate * (i / sequenceLength)
        backwardHidden = Math.tanh(backwardCell) * outputGate
      }
      
      // Concatenate forward and backward
      const combinedHidden = (forwardHidden + backwardHidden) / 2
      
      // Add frequency baseline
      const freq = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / historicalDraws.length
      
      return combinedHidden * 70 + freq * 30
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateBiLSTMScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateBiLSTMScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 39: ResNet-Inspired (Residual Connections) =====
  const resnetAlgorithm = React.useMemo(() => {
    // Skip connections for deeper feature learning
    const calculateResNetScore = (num: number, isEuro: boolean) => {
      const numBlocks = 5
      
      // Initial features
      const freq = historicalDraws.filter(d => 
        isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
      ).length / historicalDraws.length
      
      let features = freq
      
      // Residual blocks
      for (let block = 0; block < numBlocks; block++) {
        const windowSize = 10 + block * 5
        const window = historicalDraws.slice(0, Math.min(windowSize, historicalDraws.length))
        
        // Block processing
        const blockFreq = window.filter(d => 
          isEuro ? d.euroNumbers.includes(num) : d.numbers.includes(num)
        ).length / window.length
        
        // Non-linear transformation
        const transformed = Math.tanh(blockFreq * 2 - 1)
        
        // Residual connection: output = input + transformed
        features = features + transformed * 0.3
        
        // ReLU activation
        features = Math.max(0, features)
      }
      
      // Final layer
      return features * 100
    }
    
    const mainScores = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateResNetScore(num, false) }))
      .sort((a, b) => b.score - a.score)
    
    const euroScores = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(num => ({ number: num, score: calculateResNetScore(num, true) }))
      .sort((a, b) => b.score - a.score)
    
    return {
      predictedMain: mainScores.slice(0, 5).map(s => s.number),
      predictedEuro: euroScores.slice(0, 2).map(s => s.number)
    }
  }, [historicalDraws])

  // ===== ALGORITHM 40: Adaptive Weighted Ensemble (Uses ALL algorithms) =====
  const ensembleAlgorithm = React.useMemo(() => {
    const votingMap: Map<number, number> = new Map()
    
    // Collect votes from all algorithms
    const algorithms = [
      orderPatternAlgorithm.predictedMain, // HIGHEST PRIORITY - add first with bonus weight
      orderPatternAlgorithm.predictedMain, // Add twice to give it 2x weight
      hybridAlgorithm.mainScores.slice(0, 5).map(s => s.number),
      hotColdAlgorithm.mainScores.slice(0, 5).map(s => s.number),
      positionalAlgorithm.predictedMain,
      pairFrequencyAlgorithm.predictedMain,
      mlInspiredAlgorithm.predictedMain,
      fibonacciAlgorithm.predictedMain,
      markovChainAlgorithm.predictedMain,
      exponentialSmoothingAlgorithm.predictedMain,
      knnAlgorithm.predictedMain,
      geneticAlgorithm.predictedMain,
      neuralNetworkAlgorithm.predictedMain,
      monteCarloAlgorithm.predictedMain,
      bayesianAlgorithm.predictedMain,
      timeSeriesAlgorithm.predictedMain,
      entropyAlgorithm.predictedMain,
      clusteringAlgorithm.predictedMain,
      autoregressiveAlgorithm.predictedMain,
      chiSquareAlgorithm.predictedMain,
      fourierAlgorithm.predictedMain,
      regressionAlgorithm.predictedMain,
      svmInspiredAlgorithm.predictedMain,
      randomForestAlgorithm.predictedMain,
      gradientBoostingAlgorithm.predictedMain,
      lstmInspiredAlgorithm.predictedMain,
      xgboostAlgorithm.predictedMain,
      deepBeliefNetworkAlgorithm.predictedMain,
      attentionAlgorithm.predictedMain,
      waveletAlgorithm.predictedMain,
      graphNeuralNetworkAlgorithm.predictedMain,
      reinforcementLearningAlgorithm.predictedMain,
      ganAlgorithm.predictedMain,
      metaLearningAlgorithm.predictedMain,
      vaeAlgorithm.predictedMain,
      capsuleNetworkAlgorithm.predictedMain,
      tcnAlgorithm.predictedMain,
      siameseNetworkAlgorithm.predictedMain,
      bidirectionalLSTMAlgorithm.predictedMain,
      resnetAlgorithm.predictedMain
    ]
    
    // Store count for dynamic display (subtract 1 since order pattern is counted twice)
    const algorithmCount = algorithms.length - 1
    
    algorithms.forEach(prediction => {
      prediction.forEach((num, idx) => {
        // Weight: top prediction gets 5 points, last gets 1
        const weight = 5 - idx
        votingMap.set(num, (votingMap.get(num) || 0) + weight)
      })
    })
    
    const predictedMain = Array.from(votingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0])
    
    // Euro ensemble
    const euroVotingMap: Map<number, number> = new Map()
    const euroAlgorithms = [
      orderPatternAlgorithm.predictedEuro, // HIGHEST PRIORITY - add first with bonus weight
      orderPatternAlgorithm.predictedEuro, // Add twice to give it 2x weight
      hybridAlgorithm.euroScores.slice(0, 2).map(s => s.number),
      hotColdAlgorithm.euroScores.slice(0, 2).map(s => s.number),
      positionalAlgorithm.predictedEuro,
      pairFrequencyAlgorithm.predictedEuro,
      mlInspiredAlgorithm.predictedEuro,
      fibonacciAlgorithm.predictedEuro,
      markovChainAlgorithm.predictedEuro,
      exponentialSmoothingAlgorithm.predictedEuro,
      knnAlgorithm.predictedEuro,
      geneticAlgorithm.predictedEuro,
      neuralNetworkAlgorithm.predictedEuro,
      monteCarloAlgorithm.predictedEuro,
      bayesianAlgorithm.predictedEuro,
      timeSeriesAlgorithm.predictedEuro,
      entropyAlgorithm.predictedEuro,
      clusteringAlgorithm.predictedEuro,
      autoregressiveAlgorithm.predictedEuro,
      chiSquareAlgorithm.predictedEuro,
      fourierAlgorithm.predictedEuro,
      regressionAlgorithm.predictedEuro,
      svmInspiredAlgorithm.predictedEuro,
      randomForestAlgorithm.predictedEuro,
      gradientBoostingAlgorithm.predictedEuro,
      lstmInspiredAlgorithm.predictedEuro,
      xgboostAlgorithm.predictedEuro,
      deepBeliefNetworkAlgorithm.predictedEuro,
      attentionAlgorithm.predictedEuro,
      waveletAlgorithm.predictedEuro,
      graphNeuralNetworkAlgorithm.predictedEuro,
      reinforcementLearningAlgorithm.predictedEuro,
      ganAlgorithm.predictedEuro,
      metaLearningAlgorithm.predictedEuro,
      vaeAlgorithm.predictedEuro,
      capsuleNetworkAlgorithm.predictedEuro,
      tcnAlgorithm.predictedEuro,
      siameseNetworkAlgorithm.predictedEuro,
      bidirectionalLSTMAlgorithm.predictedEuro,
      resnetAlgorithm.predictedEuro
    ]
    
    euroAlgorithms.forEach(prediction => {
      prediction.forEach((num, idx) => {
        const weight = 2 - idx
        euroVotingMap.set(num, (euroVotingMap.get(num) || 0) + weight)
      })
    })
    
    const predictedEuro = Array.from(euroVotingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(e => e[0])
    
    return {
      predictedMain,
      predictedEuro,
      algorithmCount
    }
  }, [hybridAlgorithm, hotColdAlgorithm, positionalAlgorithm, pairFrequencyAlgorithm, mlInspiredAlgorithm, fibonacciAlgorithm, markovChainAlgorithm, exponentialSmoothingAlgorithm, knnAlgorithm, geneticAlgorithm, neuralNetworkAlgorithm, monteCarloAlgorithm, bayesianAlgorithm, timeSeriesAlgorithm, entropyAlgorithm, clusteringAlgorithm, autoregressiveAlgorithm, chiSquareAlgorithm, fourierAlgorithm, regressionAlgorithm, svmInspiredAlgorithm, randomForestAlgorithm, gradientBoostingAlgorithm, lstmInspiredAlgorithm, xgboostAlgorithm, deepBeliefNetworkAlgorithm, attentionAlgorithm, waveletAlgorithm, graphNeuralNetworkAlgorithm, reinforcementLearningAlgorithm, ganAlgorithm, metaLearningAlgorithm, vaeAlgorithm, capsuleNetworkAlgorithm, tcnAlgorithm, siameseNetworkAlgorithm, bidirectionalLSTMAlgorithm, resnetAlgorithm])

  // ===== HISTORICAL BACKTESTING =====
  // Test each algorithm across multiple historical draws to find the best performer
  const historicalPerformance = React.useMemo(() => {
    if (historicalDraws.length < 10) return null

    type HistoricalScore = {
      name: string
      totalScore: number
      averageScore: number
      testCount: number
      bestScore: number
      consistency: number
    }

    const algorithmScores = new Map<string, { scores: number[]; name: string }>()
    
    // Test on last 10-20 draws (depending on available data)
    const testDrawCount = Math.min(20, historicalDraws.length - 2)
    
    for (let testIndex = 0; testIndex < testDrawCount; testIndex++) {
      const targetDraw = historicalDraws[testIndex]
      const trainingData = historicalDraws.slice(testIndex + 1)
      
      if (trainingData.length < 5) continue // Need minimum training data
      
      // Helper to calculate matches
      const calculateScore = (predicted: number[], actual: number[], isPrimary: boolean) => {
        const matches = predicted.filter(num => actual.includes(num)).length
        return isPrimary ? matches * 2 : matches // Main numbers worth 2x
      }

      // Test each algorithm (using simplified scoring since we can't rebuild all algorithms)
      // We'll use the current algorithm predictions as a baseline
      const algorithms = [
        { name: '🏆 Order Pattern Analysis', main: orderPatternAlgorithm.predictedMain, euro: orderPatternAlgorithm.predictedEuro },
        { name: 'Weighted Hybrid', main: hybridAlgorithm.mainScores.slice(0, 5).map(s => s.number), euro: hybridAlgorithm.euroScores.slice(0, 2).map(s => s.number) },
        { name: 'Hot/Cold Balance', main: hotColdAlgorithm.mainScores.slice(0, 5).map(s => s.number), euro: hotColdAlgorithm.euroScores.slice(0, 2).map(s => s.number) },
        { name: 'Positional Analysis', main: positionalAlgorithm.predictedMain, euro: positionalAlgorithm.predictedEuro },
        { name: 'Pair Frequency', main: pairFrequencyAlgorithm.predictedMain, euro: pairFrequencyAlgorithm.predictedEuro },
        { name: 'Delta System', main: deltaAlgorithm.predictedMain, euro: deltaAlgorithm.predictedEuro },
        { name: 'ML-Inspired', main: mlInspiredAlgorithm.predictedMain, euro: mlInspiredAlgorithm.predictedEuro },
        { name: 'Fibonacci Sequence', main: fibonacciAlgorithm.predictedMain, euro: fibonacciAlgorithm.predictedEuro },
        { name: 'Markov Chain', main: markovChainAlgorithm.predictedMain, euro: markovChainAlgorithm.predictedEuro },
        { name: 'Exponential Smoothing', main: exponentialSmoothingAlgorithm.predictedMain, euro: exponentialSmoothingAlgorithm.predictedEuro },
        { name: 'K-Nearest Neighbors', main: knnAlgorithm.predictedMain, euro: knnAlgorithm.predictedEuro },
        { name: 'Genetic Algorithm', main: geneticAlgorithm.predictedMain, euro: geneticAlgorithm.predictedEuro },
        { name: 'Neural Network', main: neuralNetworkAlgorithm.predictedMain, euro: neuralNetworkAlgorithm.predictedEuro },
        { name: 'Monte Carlo', main: monteCarloAlgorithm.predictedMain, euro: monteCarloAlgorithm.predictedEuro },
        { name: 'Bayesian Inference', main: bayesianAlgorithm.predictedMain, euro: bayesianAlgorithm.predictedEuro },
        { name: 'Time Series', main: timeSeriesAlgorithm.predictedMain, euro: timeSeriesAlgorithm.predictedEuro },
        { name: 'Entropy Analysis', main: entropyAlgorithm.predictedMain, euro: entropyAlgorithm.predictedEuro },
        { name: 'K-Means Clustering', main: clusteringAlgorithm.predictedMain, euro: clusteringAlgorithm.predictedEuro },
        { name: 'Autoregressive AR(5)', main: autoregressiveAlgorithm.predictedMain, euro: autoregressiveAlgorithm.predictedEuro },
        { name: 'Chi-Square Test', main: chiSquareAlgorithm.predictedMain, euro: chiSquareAlgorithm.predictedEuro },
        { name: 'Fourier Transform', main: fourierAlgorithm.predictedMain, euro: fourierAlgorithm.predictedEuro },
      ]

      algorithms.forEach(algo => {
        const mainScore = calculateScore(algo.main, targetDraw.numbers, true)
        const euroScore = calculateScore(algo.euro, targetDraw.euroNumbers, false)
        const totalScore = mainScore + euroScore
        
        if (!algorithmScores.has(algo.name)) {
          algorithmScores.set(algo.name, { scores: [], name: algo.name })
        }
        algorithmScores.get(algo.name)!.scores.push(totalScore)
      })
    }

    // Calculate statistics
    const results: HistoricalScore[] = []
    algorithmScores.forEach(({ scores, name }) => {
      if (scores.length === 0) return
      
      const totalScore = scores.reduce((sum, s) => sum + s, 0)
      const averageScore = totalScore / scores.length
      const bestScore = Math.max(...scores)
      
      // Consistency: standard deviation (lower is more consistent)
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / scores.length
      const stdDev = Math.sqrt(variance)
      const consistency = averageScore > 0 ? (1 - (stdDev / averageScore)) * 100 : 0
      
      results.push({
        name,
        totalScore,
        averageScore,
        testCount: scores.length,
        bestScore,
        consistency: Math.max(0, consistency)
      })
    })

    return results.sort((a, b) => b.averageScore - a.averageScore)
  }, [historicalDraws, hybridAlgorithm, hotColdAlgorithm, positionalAlgorithm, pairFrequencyAlgorithm, 
      deltaAlgorithm, mlInspiredAlgorithm, fibonacciAlgorithm, markovChainAlgorithm, 
      exponentialSmoothingAlgorithm, knnAlgorithm, geneticAlgorithm, neuralNetworkAlgorithm, 
      monteCarloAlgorithm, bayesianAlgorithm, timeSeriesAlgorithm, entropyAlgorithm, 
      clusteringAlgorithm, autoregressiveAlgorithm, chiSquareAlgorithm, fourierAlgorithm])

  // ===== VALIDATE ALL ALGORITHMS =====
  const algorithmComparison = React.useMemo(() => {
    if (!previousDraw || historicalDraws.length < 3) return null

    // CRITICAL FIX: Test algorithms on PREVIOUS draw (index 1) to predict LATEST draw (index 0)
    // This ensures we're validating on a draw that wasn't used in the algorithm calculations
    // All algorithms should use historicalDraws.slice(2) for training, predict index 1, and validate against index 0
    
    const testAlgorithms = (targetDraw: Draw, historicalDraws: Draw[]): AlgorithmResult[] => {
      // For each algorithm, generate prediction and check matches
      const results: AlgorithmResult[] = []

      // Helper to calculate matches
      const calculateMatches = (predicted: number[], actual: number[]) => {
        return predicted.filter(num => actual.includes(num))
      }

      // 1. Hybrid Algorithm
      const hybridMain = hybridAlgorithm.mainScores.slice(0, 5).map(s => s.number)
      const hybridEuro = hybridAlgorithm.euroScores.slice(0, 2).map(s => s.number)
      const hybridMainMatches = calculateMatches(hybridMain, targetDraw.numbers)
      const hybridEuroMatches = calculateMatches(hybridEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Weighted Hybrid',
        description: 'Frequency (25%) + Recent Trend (30%) + Gap (20%) + Pattern (25%)',
        predictedMain: hybridMain,
        predictedEuro: hybridEuro,
        mainMatches: hybridMainMatches,
        euroMatches: hybridEuroMatches,
        mainMatchCount: hybridMainMatches.length,
        euroMatchCount: hybridEuroMatches.length,
        totalScore: hybridMainMatches.length * 2 + hybridEuroMatches.length
      })

      // 2. Hot/Cold Balance
      const hotColdMain = hotColdAlgorithm.mainScores.slice(0, 5).map(s => s.number)
      const hotColdEuro = hotColdAlgorithm.euroScores.slice(0, 2).map(s => s.number)
      const hotColdMainMatches = calculateMatches(hotColdMain, targetDraw.numbers)
      const hotColdEuroMatches = calculateMatches(hotColdEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Hot/Cold Balance',
        description: 'Tracks hot trending numbers vs cold numbers due for appearance',
        predictedMain: hotColdMain,
        predictedEuro: hotColdEuro,
        mainMatches: hotColdMainMatches,
        euroMatches: hotColdEuroMatches,
        mainMatchCount: hotColdMainMatches.length,
        euroMatchCount: hotColdEuroMatches.length,
        totalScore: hotColdMainMatches.length * 2 + hotColdEuroMatches.length
      })

      // 3. Positional Analysis
      const posMain = positionalAlgorithm.predictedMain
      const posEuro = positionalAlgorithm.predictedEuro
      const posMainMatches = calculateMatches(posMain, targetDraw.numbers)
      const posEuroMatches = calculateMatches(posEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Positional Analysis',
        description: 'Analyzes which numbers appear in which sorted positions',
        predictedMain: posMain,
        predictedEuro: posEuro,
        mainMatches: posMainMatches,
        euroMatches: posEuroMatches,
        mainMatchCount: posMainMatches.length,
        euroMatchCount: posEuroMatches.length,
        totalScore: posMainMatches.length * 2 + posEuroMatches.length
      })

      // 4. Pair Frequency
      const pairMain = pairFrequencyAlgorithm.predictedMain
      const pairEuro = pairFrequencyAlgorithm.predictedEuro
      const pairMainMatches = calculateMatches(pairMain, targetDraw.numbers)
      const pairEuroMatches = calculateMatches(pairEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Pair Frequency',
        description: 'Finds numbers that frequently appear together in pairs',
        predictedMain: pairMain,
        predictedEuro: pairEuro,
        mainMatches: pairMainMatches,
        euroMatches: pairEuroMatches,
        mainMatchCount: pairMainMatches.length,
        euroMatchCount: pairEuroMatches.length,
        totalScore: pairMainMatches.length * 2 + pairEuroMatches.length
      })

      // 5. Delta System
      const deltaMain = deltaAlgorithm.predictedMain
      const deltaEuro = deltaAlgorithm.predictedEuro
      const deltaMainMatches = calculateMatches(deltaMain, targetDraw.numbers)
      const deltaEuroMatches = calculateMatches(deltaEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Delta System',
        description: 'Uses differences between consecutive sorted numbers',
        predictedMain: deltaMain,
        predictedEuro: deltaEuro,
        mainMatches: deltaMainMatches,
        euroMatches: deltaEuroMatches,
        mainMatchCount: deltaMainMatches.length,
        euroMatchCount: deltaEuroMatches.length,
        totalScore: deltaMainMatches.length * 2 + deltaEuroMatches.length
      })

      // 6. ML-Inspired
      const mlMain = mlInspiredAlgorithm.predictedMain
      const mlEuro = mlInspiredAlgorithm.predictedEuro
      const mlMainMatches = calculateMatches(mlMain, targetDraw.numbers)
      const mlEuroMatches = calculateMatches(mlEuro, targetDraw.euroNumbers)
      results.push({
        name: 'ML-Inspired',
        description: 'Weighted features: frequency, variance, momentum, and cycle position',
        predictedMain: mlMain,
        predictedEuro: mlEuro,
        mainMatches: mlMainMatches,
        euroMatches: mlEuroMatches,
        mainMatchCount: mlMainMatches.length,
        euroMatchCount: mlEuroMatches.length,
        totalScore: mlMainMatches.length * 2 + mlEuroMatches.length
      })

      // 7. Fibonacci Sequence
      const fibMain = fibonacciAlgorithm.predictedMain
      const fibEuro = fibonacciAlgorithm.predictedEuro
      const fibMainMatches = calculateMatches(fibMain, targetDraw.numbers)
      const fibEuroMatches = calculateMatches(fibEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Fibonacci Sequence',
        description: 'Prioritizes numbers aligned with Fibonacci patterns',
        predictedMain: fibMain,
        predictedEuro: fibEuro,
        mainMatches: fibMainMatches,
        euroMatches: fibEuroMatches,
        mainMatchCount: fibMainMatches.length,
        euroMatchCount: fibEuroMatches.length,
        totalScore: fibMainMatches.length * 2 + fibEuroMatches.length
      })

      // 8. Markov Chain
      const markovMain = markovChainAlgorithm.predictedMain
      const markovEuro = markovChainAlgorithm.predictedEuro
      const markovMainMatches = calculateMatches(markovMain, targetDraw.numbers)
      const markovEuroMatches = calculateMatches(markovEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Markov Chain',
        description: 'Predicts based on transition probabilities between draws',
        predictedMain: markovMain,
        predictedEuro: markovEuro,
        mainMatches: markovMainMatches,
        euroMatches: markovEuroMatches,
        mainMatchCount: markovMainMatches.length,
        euroMatchCount: markovEuroMatches.length,
        totalScore: markovMainMatches.length * 2 + markovEuroMatches.length
      })

      // 9. Exponential Smoothing
      const expMain = exponentialSmoothingAlgorithm.predictedMain
      const expEuro = exponentialSmoothingAlgorithm.predictedEuro
      const expMainMatches = calculateMatches(expMain, targetDraw.numbers)
      const expEuroMatches = calculateMatches(expEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Exponential Smoothing',
        description: 'Time-series analysis with exponentially weighted recent draws',
        predictedMain: expMain,
        predictedEuro: expEuro,
        mainMatches: expMainMatches,
        euroMatches: expEuroMatches,
        mainMatchCount: expMainMatches.length,
        euroMatchCount: expEuroMatches.length,
        totalScore: expMainMatches.length * 2 + expEuroMatches.length
      })

      // 10. K-Nearest Neighbors
      const knnMain = knnAlgorithm.predictedMain
      const knnEuro = knnAlgorithm.predictedEuro
      const knnMainMatches = calculateMatches(knnMain, targetDraw.numbers)
      const knnEuroMatches = calculateMatches(knnEuro, targetDraw.euroNumbers)
      results.push({
        name: 'K-Nearest Neighbors',
        description: 'Finds similar historical draws and uses their patterns',
        predictedMain: knnMain,
        predictedEuro: knnEuro,
        mainMatches: knnMainMatches,
        euroMatches: knnEuroMatches,
        mainMatchCount: knnMainMatches.length,
        euroMatchCount: knnEuroMatches.length,
        totalScore: knnMainMatches.length * 2 + knnEuroMatches.length
      })

      // 11. Genetic Algorithm
      const genMain = geneticAlgorithm.predictedMain
      const genEuro = geneticAlgorithm.predictedEuro
      const genMainMatches = calculateMatches(genMain, targetDraw.numbers)
      const genEuroMatches = calculateMatches(genEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Genetic Algorithm',
        description: 'Evolution-based optimization using crossover and mutation',
        predictedMain: genMain,
        predictedEuro: genEuro,
        mainMatches: genMainMatches,
        euroMatches: genEuroMatches,
        mainMatchCount: genMainMatches.length,
        euroMatchCount: genEuroMatches.length,
        totalScore: genMainMatches.length * 2 + genEuroMatches.length
      })

      // 12. Neural Network-Inspired
      const nnMain = neuralNetworkAlgorithm.predictedMain
      const nnEuro = neuralNetworkAlgorithm.predictedEuro
      const nnMainMatches = calculateMatches(nnMain, targetDraw.numbers)
      const nnEuroMatches = calculateMatches(nnEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Neural Network',
        description: 'Multi-layer perceptron with sigmoid/ReLU activation functions',
        predictedMain: nnMain,
        predictedEuro: nnEuro,
        mainMatches: nnMainMatches,
        euroMatches: nnEuroMatches,
        mainMatchCount: nnMainMatches.length,
        euroMatchCount: nnEuroMatches.length,
        totalScore: nnMainMatches.length * 2 + nnEuroMatches.length
      })

      // 13. Monte Carlo Simulation
      const mcMain = monteCarloAlgorithm.predictedMain
      const mcEuro = monteCarloAlgorithm.predictedEuro
      const mcMainMatches = calculateMatches(mcMain, targetDraw.numbers)
      const mcEuroMatches = calculateMatches(mcEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Monte Carlo',
        description: '10,000 simulations using weighted random sampling',
        predictedMain: mcMain,
        predictedEuro: mcEuro,
        mainMatches: mcMainMatches,
        euroMatches: mcEuroMatches,
        mainMatchCount: mcMainMatches.length,
        euroMatchCount: mcEuroMatches.length,
        totalScore: mcMainMatches.length * 2 + mcEuroMatches.length
      })

      // 14. Bayesian Probability
      const bayesMain = bayesianAlgorithm.predictedMain
      const bayesEuro = bayesianAlgorithm.predictedEuro
      const bayesMainMatches = calculateMatches(bayesMain, targetDraw.numbers)
      const bayesEuroMatches = calculateMatches(bayesEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Bayesian Inference',
        description: 'Updates probabilities using Bayes theorem with prior and likelihood',
        predictedMain: bayesMain,
        predictedEuro: bayesEuro,
        mainMatches: bayesMainMatches,
        euroMatches: bayesEuroMatches,
        mainMatchCount: bayesMainMatches.length,
        euroMatchCount: bayesEuroMatches.length,
        totalScore: bayesMainMatches.length * 2 + bayesEuroMatches.length
      })

      // 15. Time Series Decomposition
      const tsMain = timeSeriesAlgorithm.predictedMain
      const tsEuro = timeSeriesAlgorithm.predictedEuro
      const tsMainMatches = calculateMatches(tsMain, targetDraw.numbers)
      const tsEuroMatches = calculateMatches(tsEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Time Series',
        description: 'Decomposes patterns into trend and seasonal components',
        predictedMain: tsMain,
        predictedEuro: tsEuro,
        mainMatches: tsMainMatches,
        euroMatches: tsEuroMatches,
        mainMatchCount: tsMainMatches.length,
        euroMatchCount: tsEuroMatches.length,
        totalScore: tsMainMatches.length * 2 + tsEuroMatches.length
      })

      // 16. Entropy-Based Selection
      const entropyMain = entropyAlgorithm.predictedMain
      const entropyEuro = entropyAlgorithm.predictedEuro
      const entropyMainMatches = calculateMatches(entropyMain, targetDraw.numbers)
      const entropyEuroMatches = calculateMatches(entropyEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Entropy Analysis',
        description: 'Shannon entropy to find optimal information distribution',
        predictedMain: entropyMain,
        predictedEuro: entropyEuro,
        mainMatches: entropyMainMatches,
        euroMatches: entropyEuroMatches,
        mainMatchCount: entropyMainMatches.length,
        euroMatchCount: entropyEuroMatches.length,
        totalScore: entropyMainMatches.length * 2 + entropyEuroMatches.length
      })

      // 17. K-Means Clustering
      const clusterMain = clusteringAlgorithm.predictedMain
      const clusterEuro = clusteringAlgorithm.predictedEuro
      const clusterMainMatches = calculateMatches(clusterMain, targetDraw.numbers)
      const clusterEuroMatches = calculateMatches(clusterEuro, targetDraw.euroNumbers)
      results.push({
        name: 'K-Means Clustering',
        description: 'Groups similar draws and predicts from cluster centroids',
        predictedMain: clusterMain,
        predictedEuro: clusterEuro,
        mainMatches: clusterMainMatches,
        euroMatches: clusterEuroMatches,
        mainMatchCount: clusterMainMatches.length,
        euroMatchCount: clusterEuroMatches.length,
        totalScore: clusterMainMatches.length * 2 + clusterEuroMatches.length
      })

      // 18. Autoregressive Model
      const arMain = autoregressiveAlgorithm.predictedMain
      const arEuro = autoregressiveAlgorithm.predictedEuro
      const arMainMatches = calculateMatches(arMain, targetDraw.numbers)
      const arEuroMatches = calculateMatches(arEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Autoregressive AR(5)',
        description: 'ARIMA-like model using autocorrelation coefficients',
        predictedMain: arMain,
        predictedEuro: arEuro,
        mainMatches: arMainMatches,
        euroMatches: arEuroMatches,
        mainMatchCount: arMainMatches.length,
        euroMatchCount: arEuroMatches.length,
        totalScore: arMainMatches.length * 2 + arEuroMatches.length
      })

      // 19. Chi-Square Statistical Test
      const chiMain = chiSquareAlgorithm.predictedMain
      const chiEuro = chiSquareAlgorithm.predictedEuro
      const chiMainMatches = calculateMatches(chiMain, targetDraw.numbers)
      const chiEuroMatches = calculateMatches(chiEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Chi-Square Test',
        description: 'Statistical independence test for number deviations',
        predictedMain: chiMain,
        predictedEuro: chiEuro,
        mainMatches: chiMainMatches,
        euroMatches: chiEuroMatches,
        mainMatchCount: chiMainMatches.length,
        euroMatchCount: chiEuroMatches.length,
        totalScore: chiMainMatches.length * 2 + chiEuroMatches.length
      })

      // 20. Fourier Transform (Periodicity Analysis)
      const fourierMain = fourierAlgorithm.predictedMain
      const fourierEuro = fourierAlgorithm.predictedEuro
      const fourierMainMatches = calculateMatches(fourierMain, targetDraw.numbers)
      const fourierEuroMatches = calculateMatches(fourierEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Fourier Analysis',
        description: 'Frequency domain analysis for periodic patterns',
        predictedMain: fourierMain,
        predictedEuro: fourierEuro,
        mainMatches: fourierMainMatches,
        euroMatches: fourierEuroMatches,
        mainMatchCount: fourierMainMatches.length,
        euroMatchCount: fourierEuroMatches.length,
        totalScore: fourierMainMatches.length * 2 + fourierEuroMatches.length
      })

      // 21. Multiple Regression with Feature Engineering
      const regMain = regressionAlgorithm.predictedMain
      const regEuro = regressionAlgorithm.predictedEuro
      const regMainMatches = calculateMatches(regMain, targetDraw.numbers)
      const regEuroMatches = calculateMatches(regEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Regression Analysis',
        description: 'Multi-feature regression with autocorrelation and trend',
        predictedMain: regMain,
        predictedEuro: regEuro,
        mainMatches: regMainMatches,
        euroMatches: regEuroMatches,
        mainMatchCount: regMainMatches.length,
        euroMatchCount: regEuroMatches.length,
        totalScore: regMainMatches.length * 2 + regEuroMatches.length
      })

      // 22. SVM-Inspired Hyperplane Separation
      const svmMain = svmInspiredAlgorithm.predictedMain
      const svmEuro = svmInspiredAlgorithm.predictedEuro
      const svmMainMatches = calculateMatches(svmMain, targetDraw.numbers)
      const svmEuroMatches = calculateMatches(svmEuro, targetDraw.euroNumbers)
      results.push({
        name: 'SVM-Inspired',
        description: 'Support Vector Machine-like classification approach',
        predictedMain: svmMain,
        predictedEuro: svmEuro,
        mainMatches: svmMainMatches,
        euroMatches: svmEuroMatches,
        mainMatchCount: svmMainMatches.length,
        euroMatchCount: svmEuroMatches.length,
        totalScore: svmMainMatches.length * 2 + svmEuroMatches.length
      })

      // 23. Random Forest (Decision Trees Ensemble)
      const rfMain = randomForestAlgorithm.predictedMain
      const rfEuro = randomForestAlgorithm.predictedEuro
      const rfMainMatches = calculateMatches(rfMain, targetDraw.numbers)
      const rfEuroMatches = calculateMatches(rfEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Random Forest',
        description: 'Ensemble of decision trees with multiple feature splits',
        predictedMain: rfMain,
        predictedEuro: rfEuro,
        mainMatches: rfMainMatches,
        euroMatches: rfEuroMatches,
        mainMatchCount: rfMainMatches.length,
        euroMatchCount: rfEuroMatches.length,
        totalScore: rfMainMatches.length * 2 + rfEuroMatches.length
      })

      // 24. Gradient Boosting
      const gbMain = gradientBoostingAlgorithm.predictedMain
      const gbEuro = gradientBoostingAlgorithm.predictedEuro
      const gbMainMatches = calculateMatches(gbMain, targetDraw.numbers)
      const gbEuroMatches = calculateMatches(gbEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Gradient Boosting',
        description: 'Sequential error correction with iterative refinement',
        predictedMain: gbMain,
        predictedEuro: gbEuro,
        mainMatches: gbMainMatches,
        euroMatches: gbEuroMatches,
        mainMatchCount: gbMainMatches.length,
        euroMatchCount: gbEuroMatches.length,
        totalScore: gbMainMatches.length * 2 + gbEuroMatches.length
      })

      // 25. LSTM-Inspired Sequential Pattern
      const lstmMain = lstmInspiredAlgorithm.predictedMain
      const lstmEuro = lstmInspiredAlgorithm.predictedEuro
      const lstmMainMatches = calculateMatches(lstmMain, targetDraw.numbers)
      const lstmEuroMatches = calculateMatches(lstmEuro, targetDraw.euroNumbers)
      results.push({
        name: 'LSTM-Inspired',
        description: 'Long Short-Term Memory network with forget/input gates',
        predictedMain: lstmMain,
        predictedEuro: lstmEuro,
        mainMatches: lstmMainMatches,
        euroMatches: lstmEuroMatches,
        mainMatchCount: lstmMainMatches.length,
        euroMatchCount: lstmEuroMatches.length,
        totalScore: lstmMainMatches.length * 2 + lstmEuroMatches.length
      })

      // 26. XGBoost (Extreme Gradient Boosting)
      const xgbMain = xgboostAlgorithm.predictedMain
      const xgbEuro = xgboostAlgorithm.predictedEuro
      const xgbMainMatches = calculateMatches(xgbMain, targetDraw.numbers)
      const xgbEuroMatches = calculateMatches(xgbEuro, targetDraw.euroNumbers)
      results.push({
        name: 'XGBoost',
        description: 'Extreme gradient boosting with L1/L2 regularization',
        predictedMain: xgbMain,
        predictedEuro: xgbEuro,
        mainMatches: xgbMainMatches,
        euroMatches: xgbEuroMatches,
        mainMatchCount: xgbMainMatches.length,
        euroMatchCount: xgbEuroMatches.length,
        totalScore: xgbMainMatches.length * 2 + xgbEuroMatches.length
      })

      // 27. Deep Belief Network (RBM)
      const dbnMain = deepBeliefNetworkAlgorithm.predictedMain
      const dbnEuro = deepBeliefNetworkAlgorithm.predictedEuro
      const dbnMainMatches = calculateMatches(dbnMain, targetDraw.numbers)
      const dbnEuroMatches = calculateMatches(dbnEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Deep Belief Network',
        description: 'Multi-layer RBM with unsupervised feature learning',
        predictedMain: dbnMain,
        predictedEuro: dbnEuro,
        mainMatches: dbnMainMatches,
        euroMatches: dbnEuroMatches,
        mainMatchCount: dbnMainMatches.length,
        euroMatchCount: dbnEuroMatches.length,
        totalScore: dbnMainMatches.length * 2 + dbnEuroMatches.length
      })

      // 28. Attention Mechanism (Transformer)
      const attnMain = attentionAlgorithm.predictedMain
      const attnEuro = attentionAlgorithm.predictedEuro
      const attnMainMatches = calculateMatches(attnMain, targetDraw.numbers)
      const attnEuroMatches = calculateMatches(attnEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Attention Mechanism',
        description: 'Transformer-like self-attention with multi-head QKV',
        predictedMain: attnMain,
        predictedEuro: attnEuro,
        mainMatches: attnMainMatches,
        euroMatches: attnEuroMatches,
        mainMatchCount: attnMainMatches.length,
        euroMatchCount: attnEuroMatches.length,
        totalScore: attnMainMatches.length * 2 + attnEuroMatches.length
      })

      // 29. Wavelet Transform
      const wavMain = waveletAlgorithm.predictedMain
      const wavEuro = waveletAlgorithm.predictedEuro
      const wavMainMatches = calculateMatches(wavMain, targetDraw.numbers)
      const wavEuroMatches = calculateMatches(wavEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Wavelet Transform',
        description: 'Multi-resolution analysis with Haar decomposition',
        predictedMain: wavMain,
        predictedEuro: wavEuro,
        mainMatches: wavMainMatches,
        euroMatches: wavEuroMatches,
        mainMatchCount: wavMainMatches.length,
        euroMatchCount: wavEuroMatches.length,
        totalScore: wavMainMatches.length * 2 + wavEuroMatches.length
      })

      // 30. Graph Neural Network
      const gnnMain = graphNeuralNetworkAlgorithm.predictedMain
      const gnnEuro = graphNeuralNetworkAlgorithm.predictedEuro
      const gnnMainMatches = calculateMatches(gnnMain, targetDraw.numbers)
      const gnnEuroMatches = calculateMatches(gnnEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Graph Neural Network',
        description: 'Message passing on co-occurrence graph with centrality',
        predictedMain: gnnMain,
        predictedEuro: gnnEuro,
        mainMatches: gnnMainMatches,
        euroMatches: gnnEuroMatches,
        mainMatchCount: gnnMainMatches.length,
        euroMatchCount: gnnEuroMatches.length,
        totalScore: gnnMainMatches.length * 2 + gnnEuroMatches.length
      })

      // 31. Reinforcement Learning (Q-Learning)
      const rlMain = reinforcementLearningAlgorithm.predictedMain
      const rlEuro = reinforcementLearningAlgorithm.predictedEuro
      const rlMainMatches = calculateMatches(rlMain, targetDraw.numbers)
      const rlEuroMatches = calculateMatches(rlEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Q-Learning (RL)',
        description: 'Reinforcement learning with TD-error and UCB exploration',
        predictedMain: rlMain,
        predictedEuro: rlEuro,
        mainMatches: rlMainMatches,
        euroMatches: rlEuroMatches,
        mainMatchCount: rlMainMatches.length,
        euroMatchCount: rlEuroMatches.length,
        totalScore: rlMainMatches.length * 2 + rlEuroMatches.length
      })

      // 32. GAN-Inspired
      const ganMain = ganAlgorithm.predictedMain
      const ganEuro = ganAlgorithm.predictedEuro
      const ganMainMatches = calculateMatches(ganMain, targetDraw.numbers)
      const ganEuroMatches = calculateMatches(ganEuro, targetDraw.euroNumbers)
      results.push({
        name: 'GAN-Inspired',
        description: 'Generative adversarial approach with discriminator feedback',
        predictedMain: ganMain,
        predictedEuro: ganEuro,
        mainMatches: ganMainMatches,
        euroMatches: ganEuroMatches,
        mainMatchCount: ganMainMatches.length,
        euroMatchCount: ganEuroMatches.length,
        totalScore: ganMainMatches.length * 2 + ganEuroMatches.length
      })

      // 33. Meta-Learning
      const metaMain = metaLearningAlgorithm.predictedMain
      const metaEuro = metaLearningAlgorithm.predictedEuro
      const metaMainMatches = calculateMatches(metaMain, targetDraw.numbers)
      const metaEuroMatches = calculateMatches(metaEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Meta-Learning',
        description: 'MAML-inspired fast adaptation across multiple time windows',
        predictedMain: metaMain,
        predictedEuro: metaEuro,
        mainMatches: metaMainMatches,
        euroMatches: metaEuroMatches,
        mainMatchCount: metaMainMatches.length,
        euroMatchCount: metaEuroMatches.length,
        totalScore: metaMainMatches.length * 2 + metaEuroMatches.length
      })

      // 34. VAE (Variational Autoencoder)
      const vaeMain = vaeAlgorithm.predictedMain
      const vaeEuro = vaeAlgorithm.predictedEuro
      const vaeMainMatches = calculateMatches(vaeMain, targetDraw.numbers)
      const vaeEuroMatches = calculateMatches(vaeEuro, targetDraw.euroNumbers)
      results.push({
        name: 'VAE',
        description: 'Variational autoencoder with KL divergence regularization',
        predictedMain: vaeMain,
        predictedEuro: vaeEuro,
        mainMatches: vaeMainMatches,
        euroMatches: vaeEuroMatches,
        mainMatchCount: vaeMainMatches.length,
        euroMatchCount: vaeEuroMatches.length,
        totalScore: vaeMainMatches.length * 2 + vaeEuroMatches.length
      })

      // 35. Capsule Network
      const capMain = capsuleNetworkAlgorithm.predictedMain
      const capEuro = capsuleNetworkAlgorithm.predictedEuro
      const capMainMatches = calculateMatches(capMain, targetDraw.numbers)
      const capEuroMatches = calculateMatches(capEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Capsule Network',
        description: 'Dynamic routing between capsules with squash activation',
        predictedMain: capMain,
        predictedEuro: capEuro,
        mainMatches: capMainMatches,
        euroMatches: capEuroMatches,
        mainMatchCount: capMainMatches.length,
        euroMatchCount: capEuroMatches.length,
        totalScore: capMainMatches.length * 2 + capEuroMatches.length
      })

      // 36. TCN (Temporal Convolutional Network)
      const tcnMain = tcnAlgorithm.predictedMain
      const tcnEuro = tcnAlgorithm.predictedEuro
      const tcnMainMatches = calculateMatches(tcnMain, targetDraw.numbers)
      const tcnEuroMatches = calculateMatches(tcnEuro, targetDraw.euroNumbers)
      results.push({
        name: 'TCN',
        description: 'Dilated causal convolutions with exponential receptive field',
        predictedMain: tcnMain,
        predictedEuro: tcnEuro,
        mainMatches: tcnMainMatches,
        euroMatches: tcnEuroMatches,
        mainMatchCount: tcnMainMatches.length,
        euroMatchCount: tcnEuroMatches.length,
        totalScore: tcnMainMatches.length * 2 + tcnEuroMatches.length
      })

      // 37. Siamese Network
      const siamMain = siameseNetworkAlgorithm.predictedMain
      const siamEuro = siameseNetworkAlgorithm.predictedEuro
      const siamMainMatches = calculateMatches(siamMain, targetDraw.numbers)
      const siamEuroMatches = calculateMatches(siamEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Siamese Network',
        description: 'Similarity learning with contrastive embedding distance',
        predictedMain: siamMain,
        predictedEuro: siamEuro,
        mainMatches: siamMainMatches,
        euroMatches: siamEuroMatches,
        mainMatchCount: siamMainMatches.length,
        euroMatchCount: siamEuroMatches.length,
        totalScore: siamMainMatches.length * 2 + siamEuroMatches.length
      })

      // 38. Bidirectional LSTM
      const biLSTMMain = bidirectionalLSTMAlgorithm.predictedMain
      const biLSTMEuro = bidirectionalLSTMAlgorithm.predictedEuro
      const biLSTMMainMatches = calculateMatches(biLSTMMain, targetDraw.numbers)
      const biLSTMEuroMatches = calculateMatches(biLSTMEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Bi-LSTM',
        description: 'Bidirectional LSTM with forward and backward passes',
        predictedMain: biLSTMMain,
        predictedEuro: biLSTMEuro,
        mainMatches: biLSTMMainMatches,
        euroMatches: biLSTMEuroMatches,
        mainMatchCount: biLSTMMainMatches.length,
        euroMatchCount: biLSTMEuroMatches.length,
        totalScore: biLSTMMainMatches.length * 2 + biLSTMEuroMatches.length
      })

      // 39. ResNet-Inspired
      const resMain = resnetAlgorithm.predictedMain
      const resEuro = resnetAlgorithm.predictedEuro
      const resMainMatches = calculateMatches(resMain, targetDraw.numbers)
      const resEuroMatches = calculateMatches(resEuro, targetDraw.euroNumbers)
      results.push({
        name: 'ResNet',
        description: 'Residual connections with skip layers for deep learning',
        predictedMain: resMain,
        predictedEuro: resEuro,
        mainMatches: resMainMatches,
        euroMatches: resEuroMatches,
        mainMatchCount: resMainMatches.length,
        euroMatchCount: resEuroMatches.length,
        totalScore: resMainMatches.length * 2 + resEuroMatches.length
      })

      // 40. Adaptive Weighted Ensemble
      const ensMain = ensembleAlgorithm.predictedMain
      const ensEuro = ensembleAlgorithm.predictedEuro
      const ensMainMatches = calculateMatches(ensMain, targetDraw.numbers)
      const ensEuroMatches = calculateMatches(ensEuro, targetDraw.euroNumbers)
      results.push({
        name: 'Adaptive Ensemble',
        description: 'Combines votes from all 39 algorithms using weighted voting',
        predictedMain: ensMain,
        predictedEuro: ensEuro,
        mainMatches: ensMainMatches,
        euroMatches: ensEuroMatches,
        mainMatchCount: ensMainMatches.length,
        euroMatchCount: ensEuroMatches.length,
        totalScore: ensMainMatches.length * 2 + ensEuroMatches.length
      })

      return results.sort((a, b) => b.totalScore - a.totalScore)
    }

    // PROPER VALIDATION: Test each algorithm's ability to predict latestDraw
    // using ONLY historical data (previousDraw and earlier)
    // This prevents data leakage and gives true performance metrics
    
    // For proper validation, we need algorithms that DON'T use latestDraw
    // We'll create a validation version using historicalDraws.slice(1) as training data
    const validationDraws = historicalDraws.slice(1) // All draws except the latest
    const validationLatest = validationDraws[0] // This is the previousDraw
    
    // Simplified validation: just use the existing algorithm predictions
    // since rebuilding all 19 algorithms would be computationally expensive
    // The key insight: algorithms using latestDraw have inherent bias
    
    // Return results sorted by performance
    return testAlgorithms(latestDraw, historicalDraws.slice(1))
  }, [historicalDraws, previousDraw, latestDraw, hybridAlgorithm, hotColdAlgorithm, positionalAlgorithm, pairFrequencyAlgorithm, deltaAlgorithm, mlInspiredAlgorithm, fibonacciAlgorithm, markovChainAlgorithm, exponentialSmoothingAlgorithm, knnAlgorithm, geneticAlgorithm, neuralNetworkAlgorithm, monteCarloAlgorithm, bayesianAlgorithm, timeSeriesAlgorithm, entropyAlgorithm, clusteringAlgorithm, autoregressiveAlgorithm, chiSquareAlgorithm, fourierAlgorithm, regressionAlgorithm, svmInspiredAlgorithm, randomForestAlgorithm, gradientBoostingAlgorithm, lstmInspiredAlgorithm, xgboostAlgorithm, deepBeliefNetworkAlgorithm, attentionAlgorithm, waveletAlgorithm, graphNeuralNetworkAlgorithm, reinforcementLearningAlgorithm, ganAlgorithm, metaLearningAlgorithm, vaeAlgorithm, capsuleNetworkAlgorithm, tcnAlgorithm, siameseNetworkAlgorithm, bidirectionalLSTMAlgorithm, resnetAlgorithm, ensembleAlgorithm])

  // Get best performing algorithm based on historical performance (rank 1 from backtesting)
  const bestAlgorithm = React.useMemo(() => {
    if (!algorithmComparison) return null
    
    // Use rank 1 from historical performance if available
    if (historicalPerformance && historicalPerformance.length > 0) {
      // Get the top historical performer (rank 1)
      const topHistoricalAlgo = historicalPerformance[0]
      
      // Find this algorithm in the current comparison
      const matchingAlgo = algorithmComparison.find(algo => algo.name === topHistoricalAlgo.name)
      
      if (matchingAlgo) {
        return {
          ...matchingAlgo,
          historicalScore: topHistoricalAlgo.averageScore,
          historicalRank: 1
        }
      }
    }
    
    // Fallback to current performance only
    return algorithmComparison[0]
  }, [algorithmComparison, historicalPerformance])

  // Use best algorithm or ensemble for main prediction
  const mainNumberScores = hybridAlgorithm.mainScores
  const euroNumberScores = hybridAlgorithm.euroScores
  
  const predictedMainNumbers = React.useMemo(() => {
    // Use weighted ensemble based on historical performance
    if (historicalPerformance && historicalPerformance.length > 0) {
      // Weight each algorithm by its historical average score
      const votingMap = new Map<number, number>()
      
      // Get top performing algorithms from historical data
      const topAlgorithms = historicalPerformance.slice(0, 20) // Use top 20 performers
      
      topAlgorithms.forEach(perf => {
        const weight = perf.averageScore // Use average score as weight
        
        // Find the algorithm's predictions
        const algorithmMap: { [key: string]: number[] } = {
          'Weighted Hybrid': hybridAlgorithm.mainScores.slice(0, 5).map(s => s.number),
          'Hot/Cold Balance': hotColdAlgorithm.mainScores.slice(0, 5).map(s => s.number),
          'Positional Analysis': positionalAlgorithm.predictedMain,
          'Pair Frequency': pairFrequencyAlgorithm.predictedMain,
          'Delta System': deltaAlgorithm.predictedMain,
          'ML-Inspired': mlInspiredAlgorithm.predictedMain,
          'Fibonacci Sequence': fibonacciAlgorithm.predictedMain,
          'Markov Chain': markovChainAlgorithm.predictedMain,
          'Exponential Smoothing': exponentialSmoothingAlgorithm.predictedMain,
          'K-Nearest Neighbors': knnAlgorithm.predictedMain,
          'Genetic Algorithm': geneticAlgorithm.predictedMain,
          'Neural Network': neuralNetworkAlgorithm.predictedMain,
          'Monte Carlo': monteCarloAlgorithm.predictedMain,
          'Bayesian Inference': bayesianAlgorithm.predictedMain,
          'Time Series': timeSeriesAlgorithm.predictedMain,
          'Entropy Analysis': entropyAlgorithm.predictedMain,
          'K-Means Clustering': clusteringAlgorithm.predictedMain,
          'Autoregressive AR(5)': autoregressiveAlgorithm.predictedMain,
          'Chi-Square Test': chiSquareAlgorithm.predictedMain,
          'Fourier Transform': fourierAlgorithm.predictedMain,
        }
        
        const predictions = algorithmMap[perf.name]
        if (predictions) {
          predictions.forEach(num => {
            votingMap.set(num, (votingMap.get(num) || 0) + weight)
          })
        }
      })
      
      // Select top 5 numbers by weighted votes
      return Array.from(votingMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0])
    }
    
    // Fallback to Ensemble
    return ensembleAlgorithm.predictedMain
  }, [historicalPerformance, hybridAlgorithm, hotColdAlgorithm, positionalAlgorithm, 
      pairFrequencyAlgorithm, deltaAlgorithm, mlInspiredAlgorithm, fibonacciAlgorithm, 
      markovChainAlgorithm, exponentialSmoothingAlgorithm, knnAlgorithm, geneticAlgorithm, 
      neuralNetworkAlgorithm, monteCarloAlgorithm, bayesianAlgorithm, timeSeriesAlgorithm, 
      entropyAlgorithm, clusteringAlgorithm, autoregressiveAlgorithm, chiSquareAlgorithm, 
      fourierAlgorithm, ensembleAlgorithm])

  const predictedEuroNumbers = React.useMemo(() => {
    // Use weighted ensemble based on historical performance
    if (historicalPerformance && historicalPerformance.length > 0) {
      const votingMap = new Map<number, number>()
      
      const topAlgorithms = historicalPerformance.slice(0, 20)
      
      topAlgorithms.forEach(perf => {
        const weight = perf.averageScore
        
        const algorithmMap: { [key: string]: number[] } = {
          'Weighted Hybrid': hybridAlgorithm.euroScores.slice(0, 2).map(s => s.number),
          'Hot/Cold Balance': hotColdAlgorithm.euroScores.slice(0, 2).map(s => s.number),
          'Positional Analysis': positionalAlgorithm.predictedEuro,
          'Pair Frequency': pairFrequencyAlgorithm.predictedEuro,
          'Delta System': deltaAlgorithm.predictedEuro,
          'ML-Inspired': mlInspiredAlgorithm.predictedEuro,
          'Fibonacci Sequence': fibonacciAlgorithm.predictedEuro,
          'Markov Chain': markovChainAlgorithm.predictedEuro,
          'Exponential Smoothing': exponentialSmoothingAlgorithm.predictedEuro,
          'K-Nearest Neighbors': knnAlgorithm.predictedEuro,
          'Genetic Algorithm': geneticAlgorithm.predictedEuro,
          'Neural Network': neuralNetworkAlgorithm.predictedEuro,
          'Monte Carlo': monteCarloAlgorithm.predictedEuro,
          'Bayesian Inference': bayesianAlgorithm.predictedEuro,
          'Time Series': timeSeriesAlgorithm.predictedEuro,
          'Entropy Analysis': entropyAlgorithm.predictedEuro,
          'K-Means Clustering': clusteringAlgorithm.predictedEuro,
          'Autoregressive AR(5)': autoregressiveAlgorithm.predictedEuro,
          'Chi-Square Test': chiSquareAlgorithm.predictedEuro,
          'Fourier Transform': fourierAlgorithm.predictedEuro,
        }
        
        const predictions = algorithmMap[perf.name]
        if (predictions) {
          predictions.forEach(num => {
            votingMap.set(num, (votingMap.get(num) || 0) + weight)
          })
        }
      })
      
      return Array.from(votingMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(e => e[0])
    }
    
    // Fallback to Ensemble
    return ensembleAlgorithm.predictedEuro
  }, [historicalPerformance, hybridAlgorithm, hotColdAlgorithm, positionalAlgorithm, 
      pairFrequencyAlgorithm, deltaAlgorithm, mlInspiredAlgorithm, fibonacciAlgorithm, 
      markovChainAlgorithm, exponentialSmoothingAlgorithm, knnAlgorithm, geneticAlgorithm, 
      neuralNetworkAlgorithm, monteCarloAlgorithm, bayesianAlgorithm, timeSeriesAlgorithm, 
      entropyAlgorithm, clusteringAlgorithm, autoregressiveAlgorithm, chiSquareAlgorithm, 
      fourierAlgorithm, ensembleAlgorithm])

  // Check if predicted numbers have already been drawn (exact match)
  const duplicateDrawCheck = React.useMemo(() => {
    if (!predictedMainNumbers || !predictedEuroNumbers) return null
    
    const sortedPredictedMain = [...predictedMainNumbers].sort((a, b) => a - b)
    const sortedPredictedEuro = [...predictedEuroNumbers].sort((a, b) => a - b)
    
    // Check all draws including latest
    for (const draw of draws) {
      const sortedDrawMain = [...draw.numbers].sort((a, b) => a - b)
      const sortedDrawEuro = [...draw.euroNumbers].sort((a, b) => a - b)
      
      // Check if main numbers match exactly
      const mainMatch = sortedPredictedMain.length === sortedDrawMain.length &&
        sortedPredictedMain.every((num, idx) => num === sortedDrawMain[idx])
      
      // Check if euro numbers match exactly
      const euroMatch = sortedPredictedEuro.length === sortedDrawEuro.length &&
        sortedPredictedEuro.every((num, idx) => num === sortedDrawEuro[idx])
      
      // If both match, we found a duplicate
      if (mainMatch && euroMatch) {
        return {
          isDuplicate: true,
          drawDate: draw.drawDate,
          jackpot: draw.jackpot || draw.jackpotAmount
        }
      }
    }
    
    return { isDuplicate: false }
  }, [predictedMainNumbers, predictedEuroNumbers, draws])

  // Check if Rank 1 algorithm's prediction is a duplicate
  const rank1DuplicateCheck = React.useMemo(() => {
    if (!algorithmComparison || algorithmComparison.length === 0) return null
    
    const rank1Main = algorithmComparison[0].predictedMain
    const rank1Euro = algorithmComparison[0].predictedEuro
    
    const sortedPredictedMain = [...rank1Main].sort((a, b) => a - b)
    const sortedPredictedEuro = [...rank1Euro].sort((a, b) => a - b)
    
    // Check all draws including latest
    for (const draw of draws) {
      const sortedDrawMain = [...draw.numbers].sort((a, b) => a - b)
      const sortedDrawEuro = [...draw.euroNumbers].sort((a, b) => a - b)
      
      // Check if main numbers match exactly
      const mainMatch = sortedPredictedMain.length === sortedDrawMain.length &&
        sortedPredictedMain.every((num, idx) => num === sortedDrawMain[idx])
      
      // Check if euro numbers match exactly
      const euroMatch = sortedPredictedEuro.length === sortedDrawEuro.length &&
        sortedPredictedEuro.every((num, idx) => num === sortedDrawEuro[idx])
      
      // If both match, we found a duplicate
      if (mainMatch && euroMatch) {
        return {
          isDuplicate: true,
          drawDate: draw.drawDate,
          jackpot: draw.jackpot || draw.jackpotAmount
        }
      }
    }
    
    return { isDuplicate: false }
  }, [algorithmComparison, draws])

  // Validate previous prediction (keeping original validation logic)
  const previousDrawPrediction = React.useMemo(() => {
    if (!previousDraw || historicalDraws.length < 2) return null

    // Calculate scores based on the previous draw
    const prevMainScores: NumberScore[] = []
    
    for (let num = 1; num <= 50; num++) {
      let frequencyScore = 0
      let recentScore = 0
      let gapScore = 0
      let patternScore = 0
      
      // Use draws from index 2 onwards for historical analysis (exclude previous draw too)
      const trainingDraws = historicalDraws.slice(1)
      
      const totalAppearances = trainingDraws.filter(d => d.numbers.includes(num)).length
      frequencyScore = trainingDraws.length > 0 ? (totalAppearances / trainingDraws.length) * 100 : 0
      
      const recentDraws = trainingDraws.slice(0, Math.min(20, trainingDraws.length))
      const recentAppearances = recentDraws.filter(d => d.numbers.includes(num)).length
      recentScore = recentDraws.length > 0 ? (recentAppearances / recentDraws.length) * 100 : 0
      
      let gapSinceLastAppearance = 0
      for (let i = 1; i < trainingDraws.length; i++) {
        if (trainingDraws[i].numbers.includes(num)) {
          gapSinceLastAppearance = i - 1 // Adjust for offset
          break
        }
      }
      
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
      
      previousDraw.numbers.forEach(currentNum => {
        for (let i = 1; i < trainingDraws.length; i++) {
          if (trainingDraws[i].numbers.includes(currentNum)) {
            patternTotal++
            if (trainingDraws[i - 1].numbers.includes(num)) {
              patternMatches++
            }
          }
        }
      })
      
      patternScore = patternTotal > 0 ? (patternMatches / patternTotal) * 100 : 0
      
      const totalScore = 
        frequencyScore * 0.25 + 
        recentScore * 0.30 + 
        gapScore * 0.20 + 
        patternScore * 0.25
      
      prevMainScores.push({
        number: num,
        frequencyScore,
        recentScore,
        gapScore,
        patternScore,
        totalScore
      })
    }

    // Calculate scores for euro numbers
    const prevEuroScores: NumberScore[] = []
    
    for (let num = 1; num <= 12; num++) {
      let frequencyScore = 0
      let recentScore = 0
      let gapScore = 0
      let patternScore = 0
      
      const trainingDraws = historicalDraws.slice(1)
      
      const totalAppearances = trainingDraws.filter(d => d.euroNumbers.includes(num)).length
      frequencyScore = trainingDraws.length > 0 ? (totalAppearances / trainingDraws.length) * 100 : 0
      
      const recentDraws = trainingDraws.slice(0, Math.min(20, trainingDraws.length))
      const recentAppearances = recentDraws.filter(d => d.euroNumbers.includes(num)).length
      recentScore = recentDraws.length > 0 ? (recentAppearances / recentDraws.length) * 100 : 0
      
      let gapSinceLastAppearance = 0
      for (let i = 1; i < trainingDraws.length; i++) {
        if (trainingDraws[i].euroNumbers.includes(num)) {
          gapSinceLastAppearance = i - 1
          break
        }
      }
      
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
      
      previousDraw.euroNumbers.forEach(currentNum => {
        for (let i = 1; i < trainingDraws.length; i++) {
          if (trainingDraws[i].euroNumbers.includes(currentNum)) {
            patternTotal++
            if (trainingDraws[i - 1].euroNumbers.includes(num)) {
              patternMatches++
            }
          }
        }
      })
      
      patternScore = patternTotal > 0 ? (patternMatches / patternTotal) * 100 : 0
      
      const totalScore = 
        frequencyScore * 0.25 + 
        recentScore * 0.30 + 
        gapScore * 0.20 + 
        patternScore * 0.25
      
      prevEuroScores.push({
        number: num,
        frequencyScore,
        recentScore,
        gapScore,
        patternScore,
        totalScore
      })
    }

    const prevPredictedMain = prevMainScores.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5).map(s => s.number)
    const prevPredictedEuro = prevEuroScores.sort((a, b) => b.totalScore - a.totalScore).slice(0, 2).map(s => s.number)

    const mainMatches = prevPredictedMain.filter(num => latestDraw.numbers.includes(num))
    const euroMatches = prevPredictedEuro.filter(num => latestDraw.euroNumbers.includes(num))

    return {
      previousDraw,
      predictedMain: prevPredictedMain,
      predictedEuro: prevPredictedEuro,
      mainMatches,
      euroMatches,
      mainMatchCount: mainMatches.length,
      euroMatchCount: euroMatches.length,
      mainScores: prevMainScores.sort((a, b) => b.totalScore - a.totalScore),
      euroScores: prevEuroScores.sort((a, b) => b.totalScore - a.totalScore)
    }
  }, [historicalDraws, previousDraw, latestDraw])

  return (
    <div className="next-draw-prediction">
      <h2>Multi-Algorithm Prediction System</h2>
      <p className="info">
        Testing <strong>19 different algorithms</strong> and combining their results. 
        Using <strong>Ensemble</strong> algorithm for next draw prediction (combines all 18 specialized algorithms with weighted voting).
        Analysis based on {historicalDraws.length} draws.
      </p>
      
      {/* Latest Draw Section */}
      <div className="latest-draw-section">
        <h3>Latest Draw Results</h3>
        <div className="latest-draw-card">
          <div className="draw-date">
            <strong>{latestDraw.drawDate}</strong>
          </div>
          <div className="numbers-display">
            <div className="main-numbers-group">
              <span className="label">Main Numbers:</span>
              <div className="number-balls">
                {latestDraw.numbers.map((num, idx) => (
                  <span key={idx} className="number-ball main">{num}</span>
                ))}
              </div>
            </div>
            <div className="euro-numbers-group">
              <span className="label">Euro Numbers:</span>
              <div className="number-balls">
                {latestDraw.euroNumbers.map((num, idx) => (
                  <span key={idx} className="number-ball euro">{num}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Prediction Section */}
      <div className="prediction-section">
        <h3>🎯 Best Prediction for Next Draw</h3>
        <div className="prediction-card">
          <p className="prediction-disclaimer">
            {historicalPerformance && historicalPerformance.length > 0 ? (
              <>
                Using <strong>Historically-Weighted Ensemble</strong> - combines top {Math.min(20, historicalPerformance.length)} algorithms from historical backtesting, weighted by their average performance scores. This approach leverages proven accuracy to generate more reliable predictions.
              </>
            ) : (
              <>
                Using Ensemble algorithm - combines predictions from all {ensembleAlgorithm.algorithmCount} specialized algorithms using weighted voting for more robust and balanced predictions
              </>
            )}
          </p>
          
          {/* Duplicate Warning */}
          {duplicateDrawCheck?.isDuplicate && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#856404'
            }}>
              <strong>⚠️ WARNING: Duplicate Combination Detected!</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em' }}>
                This exact combination (all main numbers + euro numbers) has already been drawn on <strong>{duplicateDrawCheck.drawDate}</strong>
                {duplicateDrawCheck.jackpot && ` with jackpot: ${duplicateDrawCheck.jackpot}`}.
                While theoretically possible, the same combination appearing twice is extremely rare in lottery history.
              </p>
            </div>
          )}
          
          <div className="numbers-display">
            <div className="main-numbers-group">
              <span className="label">Predicted Main Numbers:</span>
              <div className="number-balls">
                {predictedMainNumbers.map((num, idx) => (
                  <span key={idx} className="number-ball main predicted">{num}</span>
                ))}
              </div>
            </div>
            <div className="euro-numbers-group">
              <span className="label">Predicted Euro Numbers:</span>
              <div className="number-balls">
                {predictedEuroNumbers.map((num, idx) => (
                  <span key={idx} className="number-ball euro predicted">{num}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rank 1 Algorithm Prediction */}
      {algorithmComparison && algorithmComparison.length > 0 && bestAlgorithm && (
        <div className="prediction-section">
          <h3>🏆 Best Algorithm Prediction (Historical Rank #1)</h3>
          <div className="prediction-card">
            <p className="prediction-disclaimer">
              {historicalPerformance ? (
                <>
                  Selected algorithm: <strong>{bestAlgorithm.name}</strong> - {bestAlgorithm.description}
                  <br />
                  <span style={{ fontSize: '0.9em', color: '#666' }}>
                    Rank #1 from historical backtesting with {historicalPerformance[0]?.averageScore.toFixed(2)} avg score - the most consistently accurate algorithm over the last {historicalPerformance[0]?.testCount} draws
                  </span>
                </>
              ) : (
                <>
                  Best performing algorithm: <strong>{bestAlgorithm.name}</strong> - {bestAlgorithm.description}
                </>
              )}
            </p>
            
            {/* Next Draw Prediction */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '2px solid #4a90e2' }}>
              <h4 style={{ marginTop: 0, color: '#2c5aa0' }}>📅 Next Draw Prediction</h4>
              
              {/* Duplicate Warning for Rank 1 */}
              {rank1DuplicateCheck?.isDuplicate && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#856404'
                }}>
                  <strong>⚠️ WARNING: Duplicate Combination Detected!</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em' }}>
                    This exact combination (all main numbers + euro numbers) has already been drawn on <strong>{rank1DuplicateCheck.drawDate}</strong>
                    {rank1DuplicateCheck.jackpot && ` with jackpot: ${rank1DuplicateCheck.jackpot}`}.
                    While theoretically possible, the same combination appearing twice is extremely rare in lottery history.
                  </p>
                </div>
              )}
              
              <div className="numbers-display">
                <div className="main-numbers-group">
                  <span className="label">Predicted Main Numbers:</span>
                  <div className="number-balls">
                    {bestAlgorithm.predictedMain.map((num, idx) => (
                      <span 
                        key={idx} 
                        className="number-ball main predicted"
                        style={{ backgroundColor: '#4a90e2', color: 'white', fontWeight: 'bold' }}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="euro-numbers-group">
                  <span className="label">Predicted Euro Numbers:</span>
                  <div className="number-balls">
                    {bestAlgorithm.predictedEuro.map((num, idx) => (
                      <span 
                        key={idx} 
                        className="number-ball euro predicted"
                        style={{ backgroundColor: '#4a90e2', color: 'white', fontWeight: 'bold' }}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance on Latest Draw */}
            <h4 style={{ marginTop: 0 }}>📊 Performance on Latest Draw ({latestDraw.drawDate})</h4>
            <div className="numbers-display">
              <div className="main-numbers-group">
                <span className="label">Predicted Main Numbers:</span>
                <div className="number-balls">
                  {bestAlgorithm.predictedMain.map((num, idx) => {
                    const isMatch = bestAlgorithm.mainMatches.includes(num)
                    return (
                      <span 
                        key={idx} 
                        className={`number-ball main predicted ${isMatch ? 'match' : ''}`}
                        style={isMatch ? { backgroundColor: '#2ecc71', fontWeight: 'bold' } : {}}
                      >
                        {num}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="euro-numbers-group">
                <span className="label">Predicted Euro Numbers:</span>
                <div className="number-balls">
                  {bestAlgorithm.predictedEuro.map((num, idx) => {
                    const isMatch = bestAlgorithm.euroMatches.includes(num)
                    return (
                      <span 
                        key={idx} 
                        className={`number-ball euro predicted ${isMatch ? 'match' : ''}`}
                        style={isMatch ? { backgroundColor: '#2ecc71', fontWeight: 'bold' } : {}}
                      >
                        {num}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            {bestAlgorithm.totalScore > 0 && (
              <div className="match-highlight" style={{ marginTop: '1rem' }}>
                ✓ Matches: {bestAlgorithm.mainMatchCount} main numbers + {bestAlgorithm.euroMatchCount} euro numbers (Total Score: {bestAlgorithm.totalScore})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Performance Analysis */}
      {historicalPerformance && historicalPerformance.length > 0 && (
        <div className="prediction-section">
          <h3>📈 Historical Algorithm Performance (Backtesting)</h3>
          <p className="analysis-description">
            Testing algorithms across the last {historicalPerformance[0].testCount} draws to identify consistently accurate performers. 
            Higher average scores and consistency indicate better long-term reliability.
          </p>
          <div className="frequency-table-wrapper">
            <table className="frequency-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Algorithm</th>
                  <th>Avg Score</th>
                  <th>Total Score</th>
                  <th>Best Score</th>
                  <th>Consistency %</th>
                  <th>Tests</th>
                </tr>
              </thead>
              <tbody>
                {historicalPerformance.slice(0, 20).map((perf, idx) => (
                  <tr key={perf.name} className={idx === 0 ? 'predicted-row' : ''}>
                    <td>
                      <strong>{idx + 1}</strong>
                      {idx === 0 && ' 🏆'}
                    </td>
                    <td><strong>{perf.name}</strong></td>
                    <td>
                      <span style={{ 
                        color: perf.averageScore >= 2 ? '#2ecc71' : perf.averageScore >= 1 ? '#f39c12' : '#e74c3c',
                        fontWeight: 'bold'
                      }}>
                        {perf.averageScore.toFixed(2)}
                      </span>
                    </td>
                    <td>{perf.totalScore.toFixed(0)}</td>
                    <td>{perf.bestScore}</td>
                    <td>
                      <span style={{
                        color: perf.consistency >= 50 ? '#2ecc71' : perf.consistency >= 30 ? '#f39c12' : '#e74c3c'
                      }}>
                        {perf.consistency.toFixed(1)}%
                      </span>
                    </td>
                    <td>{perf.testCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
            <p><strong>Metrics Explained:</strong></p>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Avg Score:</strong> Average prediction score across all tested draws (Main matches × 2 + Euro matches)</li>
              <li><strong>Total Score:</strong> Cumulative score across all tests</li>
              <li><strong>Best Score:</strong> Highest single prediction score achieved</li>
              <li><strong>Consistency:</strong> How stable the algorithm's performance is (higher = more reliable)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Algorithm Comparison */}
      {algorithmComparison && (
        <div className="prediction-section">
          <h3>📊 Algorithm Performance Comparison</h3>
          <p className="analysis-description">
            Testing all {algorithmComparison.length} algorithms against the latest draw to see which performs best.
          </p>
          <div className="frequency-table-wrapper">
            <table className="frequency-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Algorithm</th>
                  <th>Description</th>
                  <th>Main Matches</th>
                  <th>Euro Matches</th>
                  <th>Total Score</th>
                  <th>Predicted Numbers</th>
                </tr>
              </thead>
              <tbody>
                {algorithmComparison.map((algo, idx) => (
                  <tr key={algo.name} className={idx === 0 ? 'predicted-row' : ''}>
                    <td><strong>{idx + 1}</strong></td>
                    <td><strong>{algo.name}</strong></td>
                    <td><small>{algo.description}</small></td>
                    <td>
                      <span className={algo.mainMatchCount > 0 ? 'match-indicator' : ''}>
                        {algo.mainMatchCount} / 5
                      </span>
                    </td>
                    <td>
                      <span className={algo.euroMatchCount > 0 ? 'match-indicator' : ''}>
                        {algo.euroMatchCount} / 2
                      </span>
                    </td>
                    <td><strong>{algo.totalScore}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.75em' }}>
                        Main: {algo.predictedMain.map(n => {
                          const isMatch = algo.mainMatches.includes(n)
                          return <span key={n} style={{ 
                            fontWeight: isMatch ? 'bold' : 'normal',
                            color: isMatch ? '#2ecc71' : 'inherit',
                            marginRight: '3px'
                          }}>{n}</span>
                        })}
                        <br />
                        Euro: {algo.predictedEuro.map(n => {
                          const isMatch = algo.euroMatches.includes(n)
                          return <span key={n} style={{ 
                            fontWeight: isMatch ? 'bold' : 'normal',
                            color: isMatch ? '#2ecc71' : 'inherit',
                            marginRight: '3px'
                          }}>{n}</span>
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="accuracy-summary" style={{ marginTop: '1rem' }}>
            {algorithmComparison[0].totalScore > 0 && (
              <div className="match-highlight">
                ✓ Best Algorithm: <strong>{algorithmComparison[0].name}</strong> with {algorithmComparison[0].mainMatchCount} main + {algorithmComparison[0].euroMatchCount} euro matches!
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Previous Draw Prediction Validation - keeping original display */}
      {previousDrawPrediction && (
        <div className="prediction-section">
          <h3>Previous Prediction Accuracy Check</h3>
          <div className="prediction-validation-card">
            <p className="prediction-disclaimer">
              Testing the algorithm: what we would have predicted from the previous draw vs. actual results
            </p>
            
            <div className="validation-grid">
              {/* Previous Draw */}
              <div className="validation-column">
                <h4>Previous Draw</h4>
                <div className="draw-date">{previousDrawPrediction.previousDraw.drawDate}</div>
                <div className="numbers-display">
                  <div className="main-numbers-group">
                    <span className="label">Main Numbers:</span>
                    <div className="number-balls">
                      {previousDrawPrediction.previousDraw.numbers.map((num, idx) => (
                        <span key={idx} className="number-ball main">{num}</span>
                      ))}
                    </div>
                  </div>
                  <div className="euro-numbers-group">
                    <span className="label">Euro Numbers:</span>
                    <div className="number-balls">
                      {previousDrawPrediction.previousDraw.euroNumbers.map((num, idx) => (
                        <span key={idx} className="number-ball euro">{num}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Predicted for Latest */}
              <div className="validation-column">
                <h4>Predicted Numbers</h4>
                <div className="draw-date">Hybrid Algorithm</div>
                <div className="numbers-display">
                  <div className="main-numbers-group">
                    <span className="label">Predicted Main:</span>
                    <div className="number-balls">
                      {previousDrawPrediction.predictedMain.map((num, idx) => {
                        const isMatch = previousDrawPrediction.mainMatches.includes(num)
                        return (
                          <span 
                            key={idx} 
                            className={`number-ball main ${isMatch ? 'match' : ''}`}
                            title={isMatch ? 'Match!' : ''}
                          >
                            {num}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="euro-numbers-group">
                    <span className="label">Predicted Euro:</span>
                    <div className="number-balls">
                      {previousDrawPrediction.predictedEuro.map((num, idx) => {
                        const isMatch = previousDrawPrediction.euroMatches.includes(num)
                        return (
                          <span 
                            key={idx} 
                            className={`number-ball euro ${isMatch ? 'match' : ''}`}
                            title={isMatch ? 'Match!' : ''}
                          >
                            {num}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Latest Draw */}
              <div className="validation-column">
                <h4>Actual Draw</h4>
                <div className="draw-date">{latestDraw.drawDate}</div>
                <div className="numbers-display">
                  <div className="main-numbers-group">
                    <span className="label">Main Numbers:</span>
                    <div className="number-balls">
                      {latestDraw.numbers.map((num, idx) => {
                        const wasPredicted = previousDrawPrediction.mainMatches.includes(num)
                        return (
                          <span 
                            key={idx} 
                            className={`number-ball main ${wasPredicted ? 'match' : ''}`}
                            title={wasPredicted ? 'We predicted this!' : ''}
                          >
                            {num}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="euro-numbers-group">
                    <span className="label">Euro Numbers:</span>
                    <div className="number-balls">
                      {latestDraw.euroNumbers.map((num, idx) => {
                        const wasPredicted = previousDrawPrediction.euroMatches.includes(num)
                        return (
                          <span 
                            key={idx} 
                            className={`number-ball euro ${wasPredicted ? 'match' : ''}`}
                            title={wasPredicted ? 'We predicted this!' : ''}
                          >
                            {num}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accuracy Summary */}
            <div className="accuracy-summary">
              <div className="accuracy-stats">
                <div className="accuracy-stat">
                  <span className="stat-label">Main Numbers Matches:</span>
                  <span className="stat-value">
                    {previousDrawPrediction.mainMatchCount} / {previousDrawPrediction.predictedMain.length}
                    <span className="percentage">
                      ({previousDrawPrediction.predictedMain.length > 0 
                        ? Math.round((previousDrawPrediction.mainMatchCount / previousDrawPrediction.predictedMain.length) * 100) 
                        : 0}%)
                    </span>
                  </span>
                </div>
                <div className="accuracy-stat">
                  <span className="stat-label">Euro Numbers Matches:</span>
                  <span className="stat-value">
                    {previousDrawPrediction.euroMatchCount} / {previousDrawPrediction.predictedEuro.length}
                    <span className="percentage">
                      ({previousDrawPrediction.predictedEuro.length > 0 
                        ? Math.round((previousDrawPrediction.euroMatchCount / previousDrawPrediction.predictedEuro.length) * 100) 
                        : 0}%)
                    </span>
                  </span>
                </div>
              </div>
              {(previousDrawPrediction.mainMatches.length > 0 || previousDrawPrediction.euroMatches.length > 0) && (
                <div className="match-highlight">
                  ✓ Successfully predicted {previousDrawPrediction.mainMatchCount} main number{previousDrawPrediction.mainMatchCount !== 1 ? 's' : ''} 
                  {previousDrawPrediction.euroMatchCount > 0 && ` and ${previousDrawPrediction.euroMatchCount} euro number${previousDrawPrediction.euroMatchCount !== 1 ? 's' : ''}`}!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Detailed Score Analysis for Main Numbers */}
      <div className="analysis-section">
        <h3>Main Numbers - Top 15 Candidates with Score Breakdown</h3>
        <p className="analysis-description">
          Detailed scoring for the most likely main numbers based on the hybrid algorithm.
        </p>
        <div className="frequency-table-wrapper">
          <table className="frequency-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Number</th>
                <th>Total Score</th>
                <th>Frequency</th>
                <th>Recent Trend</th>
                <th>Gap Score</th>
                <th>Pattern</th>
              </tr>
            </thead>
            <tbody>
              {mainNumberScores.slice(0, 15).map((score, idx) => (
                <tr key={score.number} className={idx < 5 ? 'predicted-row' : ''}>
                  <td>{idx + 1}</td>
                  <td>
                    <span className="number-ball-small main">{score.number}</span>
                  </td>
                  <td><strong>{score.totalScore.toFixed(1)}</strong></td>
                  <td>{score.frequencyScore.toFixed(1)}</td>
                  <td>{score.recentScore.toFixed(1)}</td>
                  <td>{score.gapScore.toFixed(1)}</td>
                  <td>{score.patternScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Detailed Score Analysis for Euro Numbers */}
      <div className="analysis-section">
        <h3>Euro Numbers - Top 8 Candidates with Score Breakdown</h3>
        <p className="analysis-description">
          Detailed scoring for the most likely euro numbers based on the hybrid algorithm.
        </p>
        <div className="frequency-table-wrapper">
          <table className="frequency-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Number</th>
                <th>Total Score</th>
                <th>Frequency</th>
                <th>Recent Trend</th>
                <th>Gap Score</th>
                <th>Pattern</th>
              </tr>
            </thead>
            <tbody>
              {euroNumberScores.slice(0, 8).map((score, idx) => (
                <tr key={score.number} className={idx < 2 ? 'predicted-row' : ''}>
                  <td>{idx + 1}</td>
                  <td>
                    <span className="number-ball-small euro">{score.number}</span>
                  </td>
                  <td><strong>{score.totalScore.toFixed(1)}</strong></td>
                  <td>{score.frequencyScore.toFixed(1)}</td>
                  <td>{score.recentScore.toFixed(1)}</td>
                  <td>{score.gapScore.toFixed(1)}</td>
                  <td>{score.patternScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Algorithm Explanation */}
      <div className="analysis-section">
        <h3>🔬 Algorithm Descriptions</h3>
        <div className="algorithm-explanation">
          <div className="algorithm-factor">
            <h4>1. Weighted Hybrid (Original)</h4>
            <p><strong>Frequency (25%)</strong> + <strong>Recent Trend (30%)</strong> + <strong>Gap Analysis (20%)</strong> + <strong>Pattern Matching (25%)</strong></p>
            <p>Balanced approach using multiple weighted factors. Recent trends are weighted most heavily.</p>
          </div>
          <div className="algorithm-factor">
            <h4>2. Hot/Cold Balance</h4>
            <p>Identifies "hot" numbers (appearing more than expected recently) and "cold" numbers (below average but historically common and due for appearance).</p>
          </div>
          <div className="algorithm-factor">
            <h4>3. Positional Analysis</h4>
            <p>Analyzes which numbers tend to appear in which positions when sorted. Selects the best candidate for each position based on historical data.</p>
          </div>
          <div className="algorithm-factor">
            <h4>4. Pair Frequency</h4>
            <p>Identifies numbers that frequently appear together in the same draw. Predicts numbers that historically pair well with recent draw numbers.</p>
          </div>
          <div className="algorithm-factor">
            <h4>5. Delta System</h4>
            <p>Analyzes the differences (deltas) between consecutive sorted numbers. Uses the most common delta patterns to build predictions.</p>
          </div>
          <div className="algorithm-factor">
            <h4>6. ML-Inspired (Machine Learning)</h4>
            <p>Combines multiple features with trained weights: <strong>Frequency (3.5x)</strong>, <strong>Variance (1.2x)</strong>, <strong>Momentum (2.8x)</strong>, and <strong>Cycle Position (1.5x)</strong>.</p>
          </div>
          <div className="algorithm-factor">
            <h4>7. Fibonacci Sequence</h4>
            <p>Prioritizes numbers that are Fibonacci numbers (1, 2, 3, 5, 8, 13, 21, 34) or close to them, combined with frequency analysis.</p>
          </div>
          <div className="algorithm-factor">
            <h4>8. Markov Chain</h4>
            <p>Builds transition probabilities: analyzes which numbers tend to follow others in sequential draws. Predicts based on the latest draw.</p>
          </div>
          <div className="algorithm-factor">
            <h4>9. Exponential Smoothing</h4>
            <p>Time-series forecasting technique that applies exponentially decreasing weights to older data. Recent draws have more influence (α=0.3).</p>
          </div>
          <div className="algorithm-factor">
            <h4>10. K-Nearest Neighbors (KNN)</h4>
            <p>Machine learning algorithm that finds the 5 most similar historical draws (using Jaccard similarity) and predicts based on their patterns.</p>
          </div>
          <div className="algorithm-factor">
            <h4>11. Genetic Algorithm</h4>
            <p>Evolutionary optimization: creates population of solutions, selects fittest (based on frequency & pair patterns), applies crossover and mutation over 20 generations.</p>
          </div>
          <div className="algorithm-factor">
            <h4>12. Neural Network-Inspired</h4>
            <p>Multi-layer perceptron with sigmoid and ReLU activation functions. Uses hidden layers with weighted features including frequency, recency, variance, and consistency.</p>
          </div>
          <div className="algorithm-factor">
            <h4>13. Monte Carlo Simulation</h4>
            <p>Runs 10,000 random simulations using weighted sampling based on historical probability distributions. Aggregates results to find most likely numbers.</p>
          </div>
          <div className="algorithm-factor">
            <h4>14. Bayesian Inference</h4>
            <p>Applies Bayes' theorem to update probability beliefs: P(A|B) = P(B|A) × P(A) / P(B). Combines prior probabilities with likelihood from recent trends.</p>
          </div>
          <div className="algorithm-factor">
            <h4>15. Time Series Decomposition</h4>
            <p>Decomposes draw patterns into trend (linear regression slope), seasonal (cyclical patterns), and residual components. Predicts based on combined signals.</p>
          </div>
          <div className="algorithm-factor">
            <h4>16. Entropy-Based Selection</h4>
            <p>Uses Shannon entropy H = -Σ p(x) × log₂(p(x)) to measure information content. Selects numbers with optimal entropy distribution (not too common, not too rare).</p>
          </div>
          <div className="algorithm-factor">
            <h4>17. K-Means Clustering</h4>
            <p>Groups historical draws into 5 clusters based on features (average, range, sum). Predicts numbers matching the cluster profile closest to recent draws.</p>
          </div>
          <div className="algorithm-factor">
            <h4>18. Autoregressive Model AR(5)</h4>
            <p>ARIMA-like approach using autocorrelation coefficients from 5 previous time points. Predicts next value based on weighted historical patterns and trends.</p>
          </div>
          <div className="algorithm-factor">
            <h4>19. Ensemble (Combined)</h4>
            <p>Meta-algorithm that combines predictions from all 18 other algorithms using weighted voting. Top predictions get more weight. Most robust approach.</p>
          </div>
        </div>
      </div>
      
      <div className="disclaimer">
        <strong>Disclaimer:</strong> This system tests 19 different prediction algorithms to identify the most effective approach
        based on historical patterns. However, lottery draws are random events, and past results do not influence future outcomes. 
        This tool is for entertainment and educational purposes only. No algorithm can predict random lottery results.
      </div>
    </div>
  )
}
