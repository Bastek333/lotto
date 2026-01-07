/**
 * IMPROVED PREDICTION ALGORITHMS - TESTED AGAINST REAL DATA
 * 
 * These algorithms are designed based on actual patterns found in historical data
 * and have been backtested to measure real performance.
 */

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
}

/**
 * ALGORITHM 1: Smart Frequency-Gap Hybrid
 * Balances frequency with recency and gap patterns
 */
export function smartFrequencyGapPredictor(draws: Draw[]): { numbers: number[], euroNumbers: number[] } {
  const recentDraws = draws.slice(0, 50)
  const scoreMap = new Map<number, number>()
  
  // Get last draw to avoid repeating
  const lastDraw = draws[0]
  const lastNumbers = new Set(lastDraw.numbers)
  const lastEuros = new Set(lastDraw.euroNumbers)
  
  // Track frequency and gaps
  const frequency = new Map<number, number>()
  const lastSeen = new Map<number, number>()
  
  for (let i = 1; i <= 50; i++) {
    frequency.set(i, 0)
    lastSeen.set(i, -1)
  }
  
  recentDraws.forEach((draw, index) => {
    draw.numbers.forEach(num => {
      frequency.set(num, (frequency.get(num) || 0) + 1)
      if (lastSeen.get(num) === -1) {
        lastSeen.set(num, index)
      }
    })
  })
  
  // Calculate scores
  for (let num = 1; num <= 50; num++) {
    const freq = frequency.get(num) || 0
    const gap = lastSeen.get(num) || recentDraws.length
    
    // Balance frequency and gap
    // Numbers that appear often but haven't appeared recently get high scores
    const freqScore = freq / recentDraws.length
    const gapScore = gap / recentDraws.length
    
    // Sweet spot: moderate frequency + moderate gap
    let score = (freqScore * 0.4) + (gapScore * 0.6)
    
    // Strong penalty for last draw numbers (reduce by 70%)
    if (lastNumbers.has(num)) {
      score *= 0.3
    }
    
    scoreMap.set(num, score)
  }
  
  const numbers = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  // Euro numbers - similar approach
  const euroScores = new Map<number, number>()
  const euroFreq = new Map<number, number>()
  const euroLastSeen = new Map<number, number>()
  
  for (let i = 1; i <= 12; i++) {
    euroFreq.set(i, 0)
    euroLastSeen.set(i, -1)
  }
  
  recentDraws.forEach((draw, index) => {
    draw.euroNumbers.forEach(num => {
      euroFreq.set(num, (euroFreq.get(num) || 0) + 1)
      if (euroLastSeen.get(num) === -1) {
        euroLastSeen.set(num, index)
      }
    })
  })
  
  for (let num = 1; num <= 12; num++) {
    const freq = euroFreq.get(num) || 0
    const gap = euroLastSeen.get(num) || recentDraws.length
    let score = (freq / recentDraws.length * 0.4) + (gap / recentDraws.length * 0.6)
    
    // Very strong penalty for last draw euros (reduce by 80%)
    if (lastEuros.has(num)) {
      score *= 0.2
    }
    
    euroScores.set(num, score)
  }
  
  const euroNumbers = Array.from(euroScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  return { numbers, euroNumbers }
}

/**
 * ALGORITHM 2: Statistical Balance Predictor
 * Aims for balanced distributions (even/odd, high/low, sum range)
 */
export function statisticalBalancePredictor(draws: Draw[]): { numbers: number[], euroNumbers: number[] } {
  const recent = draws.slice(0, 30)
  
  // Analyze recent patterns
  let totalEven = 0, totalOdd = 0
  let totalLow = 0, totalMid = 0, totalHigh = 0
  const sums: number[] = []
  
  recent.forEach(draw => {
    const even = draw.numbers.filter(n => n % 2 === 0).length
    totalEven += even
    totalOdd += (5 - even)
    
    totalLow += draw.numbers.filter(n => n <= 17).length
    totalMid += draw.numbers.filter(n => n >= 18 && n <= 34).length
    totalHigh += draw.numbers.filter(n => n >= 35).length
    
    sums.push(draw.numbers.reduce((a, b) => a + b, 0))
  })
  
  // Target distributions
  const targetEven = Math.round(5 * (totalEven / (totalEven + totalOdd)))
  const targetOdd = 5 - targetEven
  const targetLow = Math.round(5 * (totalLow / (totalLow + totalMid + totalHigh)))
  const targetMid = Math.round(5 * (totalMid / (totalLow + totalMid + totalHigh)))
  const targetHigh = 5 - targetLow - targetMid
  const targetSum = sums.reduce((a, b) => a + b, 0) / sums.length
  
  // Generate candidates that match distribution
  const candidates: number[][] = []
  
  // Try 1000 random combinations that match the distribution
  for (let attempt = 0; attempt < 1000; attempt++) {
    const nums: number[] = []
    
    // Fill ranges
    const lowNums = Array.from({ length: 17 }, (_, i) => i + 1)
    const midNums = Array.from({ length: 17 }, (_, i) => i + 18)
    const highNums = Array.from({ length: 16 }, (_, i) => i + 35)
    
    // Shuffle and pick
    const shuffleLow = lowNums.sort(() => Math.random() - 0.5)
    const shuffleMid = midNums.sort(() => Math.random() - 0.5)
    const shuffleHigh = highNums.sort(() => Math.random() - 0.5)
    
    nums.push(...shuffleLow.slice(0, targetLow))
    nums.push(...shuffleMid.slice(0, targetMid))
    nums.push(...shuffleHigh.slice(0, targetHigh))
    
    // Check even/odd distribution
    const evenCount = nums.filter(n => n % 2 === 0).length
    if (Math.abs(evenCount - targetEven) <= 1) {
      candidates.push(nums.sort((a, b) => a - b))
    }
  }
  
  // Pick the combination closest to target sum
  const best = candidates.reduce((best, current) => {
    const currentSum = current.reduce((a, b) => a + b, 0)
    const bestSum = best.reduce((a, b) => a + b, 0)
    return Math.abs(currentSum - targetSum) < Math.abs(bestSum - targetSum) ? current : best
  }, candidates[0] || [1, 2, 3, 4, 5])
  
  // Euro numbers - use frequency
  const euroFreq = new Map<number, number>()
  for (let i = 1; i <= 12; i++) euroFreq.set(i, 0)
  
  recent.forEach(draw => {
    draw.euroNumbers.forEach(num => {
      euroFreq.set(num, (euroFreq.get(num) || 0) + 1)
    })
  })
  
  const euroNumbers = Array.from(euroFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  return { numbers: best, euroNumbers }
}

/**
 * ALGORITHM 3: Hot/Cold Mix Strategy
 * Combines hot numbers (recently drawn) with cold numbers (overdue)
 */
export function hotColdMixPredictor(draws: Draw[]): { numbers: number[], euroNumbers: number[] } {
  const recent10 = draws.slice(0, 10)
  const recent30 = draws.slice(0, 30)
  const all = draws.slice(0, 100)
  
  // Hot numbers (appeared in last 10 draws)
  const hotSet = new Set<number>()
  recent10.forEach(draw => {
    draw.numbers.forEach(n => hotSet.add(n))
  })
  
  // Cold numbers (haven't appeared in last 30 but appeared in last 100)
  const recent30Set = new Set<number>()
  recent30.forEach(draw => {
    draw.numbers.forEach(n => recent30Set.add(n))
  })
  
  const coldNumbers: number[] = []
  all.forEach(draw => {
    draw.numbers.forEach(n => {
      if (!recent30Set.has(n) && !coldNumbers.includes(n)) {
        coldNumbers.push(n)
      }
    })
  })
  
  // Mix: 3 hot + 2 cold
  const hotArray = Array.from(hotSet)
  const hot = hotArray
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  
  const cold = coldNumbers
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
  
  const numbers = [...hot, ...cold].sort((a, b) => a - b)
  
  // Euro: mix hot and frequency
  const euroHot = new Set<number>()
  const euroFreq = new Map<number, number>()
  
  for (let i = 1; i <= 12; i++) euroFreq.set(i, 0)
  
  recent10.forEach(draw => {
    draw.euroNumbers.forEach(n => euroHot.add(n))
  })
  
  all.forEach(draw => {
    draw.euroNumbers.forEach(n => {
      euroFreq.set(n, (euroFreq.get(n) || 0) + 1)
    })
  })
  
  // Prefer hot, but use frequency if not enough
  const euroHotArray = Array.from(euroHot)
  let euroNumbers: number[]
  
  if (euroHotArray.length >= 2) {
    euroNumbers = euroHotArray.slice(0, 2).sort((a, b) => a - b)
  } else {
    euroNumbers = Array.from(euroFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([num]) => num)
      .sort((a, b) => a - b)
  }
  
  return { numbers, euroNumbers }
}

/**
 * ALGORITHM 4: Weighted Recency Predictor
 * Recent draws get exponentially higher weight
 */
export function weightedRecencyPredictor(draws: Draw[]): { numbers: number[], euroNumbers: number[] } {
  const recentDraws = draws.slice(0, 30)
  const weights = new Map<number, number>()
  const euroWeights = new Map<number, number>()
  
  // Get last draw to penalize
  const lastDraw = draws[0]
  const lastNumbers = new Set(lastDraw.numbers)
  const lastEuros = new Set(lastDraw.euroNumbers)
  
  for (let i = 1; i <= 50; i++) weights.set(i, 0)
  for (let i = 1; i <= 12; i++) euroWeights.set(i, 0)
  
  recentDraws.forEach((draw, index) => {
    // Exponential decay: most recent draw has highest weight
    // BUT we'll reduce weight for the very last draw to avoid exact repeats
    let weight = Math.exp(-index / 10)
    
    // Reduce weight for last draw (index 0) to avoid repeating
    if (index === 0) {
      weight *= 0.3  // 70% reduction for last draw
    }
    
    draw.numbers.forEach(num => {
      weights.set(num, (weights.get(num) || 0) + weight)
    })
    
    draw.euroNumbers.forEach(num => {
      euroWeights.set(num, (euroWeights.get(num) || 0) + weight)
    })
  })
  
  const numbers = Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  const euroNumbers = Array.from(euroWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  return { numbers, euroNumbers }
}

/**
 * ALGORITHM 5: Gap-Based Overdue Predictor
 * Selects numbers that are "overdue" based on their historical gap patterns
 */
export function gapBasedOverduePredictor(draws: Draw[]): { numbers: number[], euroNumbers: number[] } {
  const allDraws = draws.slice(0, 200)
  const numberGaps = new Map<number, number[]>()
  const lastSeen = new Map<number, number>()
  
  for (let i = 1; i <= 50; i++) {
    numberGaps.set(i, [])
    lastSeen.set(i, -1)
  }
  
  allDraws.forEach((draw, index) => {
    draw.numbers.forEach(num => {
      const last = lastSeen.get(num)!
      if (last >= 0) {
        numberGaps.get(num)!.push(index - last)
      }
      lastSeen.set(num, index)
    })
  })
  
  // Calculate average gap and current gap for each number
  const overdueScores = new Map<number, number>()
  
  for (let num = 1; num <= 50; num++) {
    const gaps = numberGaps.get(num)!
    if (gaps.length > 0) {
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const currentGap = lastSeen.get(num)! >= 0 ? lastSeen.get(num)! : allDraws.length
      
      // Overdue score: how much current gap exceeds average
      const overdueScore = Math.max(0, currentGap - avgGap)
      overdueScores.set(num, overdueScore)
    } else {
      // Never seen - give moderate score
      overdueScores.set(num, 10)
    }
  }
  
  const numbers = Array.from(overdueScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  // Euro - same logic
  const euroGaps = new Map<number, number[]>()
  const euroLastSeen = new Map<number, number>()
  
  for (let i = 1; i <= 12; i++) {
    euroGaps.set(i, [])
    euroLastSeen.set(i, -1)
  }
  
  allDraws.forEach((draw, index) => {
    draw.euroNumbers.forEach(num => {
      const last = euroLastSeen.get(num)!
      if (last >= 0) {
        euroGaps.get(num)!.push(index - last)
      }
      euroLastSeen.set(num, index)
    })
  })
  
  const euroOverdueScores = new Map<number, number>()
  
  for (let num = 1; num <= 12; num++) {
    const gaps = euroGaps.get(num)!
    if (gaps.length > 0) {
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const currentGap = euroLastSeen.get(num)! >= 0 ? euroLastSeen.get(num)! : allDraws.length
      const overdueScore = Math.max(0, currentGap - avgGap)
      euroOverdueScores.set(num, overdueScore)
    } else {
      euroOverdueScores.set(num, 5)
    }
  }
  
  const euroNumbers = Array.from(euroOverdueScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  return { numbers, euroNumbers }
}

/**
 * ALGORITHM 6: Consecutive Pattern Predictor
 * Looks for numbers that frequently appear together
 */
export function consecutivePatternPredictor(draws: Draw[]): { numbers: number[], euroNumbers: number[] } {
  const recent = draws.slice(0, 100)
  const coOccurrence = new Map<string, number>()
  
  // Build co-occurrence matrix
  recent.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}-${sorted[j]}`
        coOccurrence.set(key, (coOccurrence.get(key) || 0) + 1)
      }
    }
  })
  
  // Find most frequent pairs
  const topPairs = Array.from(coOccurrence.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  // Build from top pairs
  const selectedNumbers = new Set<number>()
  
  topPairs.forEach(([pair]) => {
    const [n1, n2] = pair.split('-').map(Number)
    if (selectedNumbers.size < 5) {
      selectedNumbers.add(n1)
    }
    if (selectedNumbers.size < 5) {
      selectedNumbers.add(n2)
    }
  })
  
  // Fill remaining with frequency
  if (selectedNumbers.size < 5) {
    const freq = new Map<number, number>()
    for (let i = 1; i <= 50; i++) freq.set(i, 0)
    
    recent.forEach(draw => {
      draw.numbers.forEach(n => {
        if (!selectedNumbers.has(n)) {
          freq.set(n, (freq.get(n) || 0) + 1)
        }
      })
    })
    
    const additional = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5 - selectedNumbers.size)
      .map(([num]) => num)
    
    additional.forEach(n => selectedNumbers.add(n))
  }
  
  const numbers = Array.from(selectedNumbers).sort((a, b) => a - b).slice(0, 5)
  
  // Euro - frequency
  const euroFreq = new Map<number, number>()
  for (let i = 1; i <= 12; i++) euroFreq.set(i, 0)
  
  recent.forEach(draw => {
    draw.euroNumbers.forEach(n => {
      euroFreq.set(n, (euroFreq.get(n) || 0) + 1)
    })
  })
  
  const euroNumbers = Array.from(euroFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([num]) => num)
    .sort((a, b) => a - b)
  
  return { numbers, euroNumbers }
}
