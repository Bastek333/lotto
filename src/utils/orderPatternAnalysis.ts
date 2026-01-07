/**
 * ORDER PATTERN ANALYSIS UTILITY
 * 
 * This module analyzes patterns in the ORDER of drawn numbers, not just the numbers themselves.
 * It examines:
 * 1. Positional patterns - which numbers appear in which sorted positions
 * 2. Ascending/Descending sequences within draws
 * 3. Gap patterns between consecutive numbers in sorted order
 * 4. Position transitions - how numbers move between positions across draws
 * 5. Relative positioning - relationships between numbers based on their order
 */

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
}

export type OrderPatternScore = {
  number: number
  positionScore: number
  gapPatternScore: number
  sequenceScore: number
  transitionScore: number
  totalOrderScore: number
  preferredPosition?: number
}

export type OrderPatternAnalysis = {
  mainNumberScores: OrderPatternScore[]
  euroNumberScores: OrderPatternScore[]
  patternInsights: {
    commonGapPattern: number[]
    preferredPositions: Map<number, number>
    sequenceTendency: 'ascending' | 'mixed' | 'balanced'
    avgGapBetweenNumbers: number
  }
}

/**
 * Main function to analyze order patterns in historical draws
 */
export function analyzeOrderPatterns(draws: Draw[], recentDrawsCount: number = 30): OrderPatternAnalysis {
  const recentDraws = draws.slice(0, Math.min(recentDrawsCount, draws.length))
  
  // Analyze main numbers
  const mainNumberScores = analyzeMainNumberOrderPatterns(recentDraws, draws)
  
  // Analyze euro numbers
  const euroNumberScores = analyzeEuroNumberOrderPatterns(recentDraws, draws)
  
  // Extract pattern insights
  const patternInsights = extractPatternInsights(recentDraws)
  
  return {
    mainNumberScores,
    euroNumberScores,
    patternInsights
  }
}

/**
 * Analyze order patterns for main numbers (1-50)
 */
function analyzeMainNumberOrderPatterns(recentDraws: Draw[], allDraws: Draw[]): OrderPatternScore[] {
  const scores: OrderPatternScore[] = []
  
  for (let num = 1; num <= 50; num++) {
    const positionScore = calculatePositionScore(num, recentDraws)
    const gapPatternScore = calculateGapPatternScore(num, recentDraws)
    const sequenceScore = calculateSequenceScore(num, recentDraws)
    const transitionScore = calculateTransitionScore(num, recentDraws, allDraws)
    
    const totalOrderScore = 
      positionScore * 0.35 + 
      gapPatternScore * 0.30 + 
      sequenceScore * 0.20 + 
      transitionScore * 0.15
    
    scores.push({
      number: num,
      positionScore,
      gapPatternScore,
      sequenceScore,
      transitionScore,
      totalOrderScore,
      preferredPosition: findPreferredPosition(num, recentDraws)
    })
  }
  
  return scores.sort((a, b) => b.totalOrderScore - a.totalOrderScore)
}

/**
 * Analyze order patterns for euro numbers (1-12)
 */
function analyzeEuroNumberOrderPatterns(recentDraws: Draw[], allDraws: Draw[]): OrderPatternScore[] {
  const scores: OrderPatternScore[] = []
  
  for (let num = 1; num <= 12; num++) {
    const positionScore = calculateEuroPositionScore(num, recentDraws)
    const gapPatternScore = calculateEuroGapScore(num, recentDraws)
    const sequenceScore = calculateEuroSequenceScore(num, recentDraws)
    const transitionScore = calculateEuroTransitionScore(num, recentDraws)
    
    const totalOrderScore = 
      positionScore * 0.40 + 
      gapPatternScore * 0.30 + 
      sequenceScore * 0.20 + 
      transitionScore * 0.10
    
    scores.push({
      number: num,
      positionScore,
      gapPatternScore,
      sequenceScore,
      transitionScore,
      totalOrderScore,
      preferredPosition: findEuroPreferredPosition(num, recentDraws)
    })
  }
  
  return scores.sort((a, b) => b.totalOrderScore - a.totalOrderScore)
}

/**
 * Calculate position score - how well a number fits in specific sorted positions
 */
function calculatePositionScore(num: number, draws: Draw[]): number {
  const positionAppearances = [0, 0, 0, 0, 0] // 5 positions for main numbers
  let totalAppearances = 0
  
  draws.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    const index = sorted.indexOf(num)
    if (index !== -1) {
      positionAppearances[index]++
      totalAppearances++
    }
  })
  
  if (totalAppearances === 0) return 0
  
  // Find the most common position
  const maxPositionCount = Math.max(...positionAppearances)
  const positionConsistency = maxPositionCount / totalAppearances
  
  // Calculate expected position based on number value
  const expectedPosition = Math.floor((num / 50) * 5)
  const actualPosition = positionAppearances.indexOf(maxPositionCount)
  
  // Bonus if number appears in its expected position
  const positionMatchBonus = Math.abs(expectedPosition - actualPosition) <= 1 ? 20 : 0
  
  return (positionConsistency * 60) + positionMatchBonus + (totalAppearances / draws.length * 20)
}

/**
 * Calculate gap pattern score - analyze gaps before and after this number
 */
function calculateGapPatternScore(num: number, draws: Draw[]): number {
  const gaps: { before: number[], after: number[] } = { before: [], after: [] }
  
  draws.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    const index = sorted.indexOf(num)
    
    if (index !== -1) {
      // Gap before
      if (index > 0) {
        gaps.before.push(num - sorted[index - 1])
      }
      // Gap after
      if (index < sorted.length - 1) {
        gaps.after.push(sorted[index + 1] - num)
      }
    }
  })
  
  if (gaps.before.length === 0 && gaps.after.length === 0) return 0
  
  // Calculate average gaps
  const avgBefore = gaps.before.length > 0 
    ? gaps.before.reduce((a, b) => a + b, 0) / gaps.before.length 
    : 0
  const avgAfter = gaps.after.length > 0 
    ? gaps.after.reduce((a, b) => a + b, 0) / gaps.after.length 
    : 0
  
  // Calculate gap consistency (lower standard deviation = more consistent)
  const beforeStdDev = calculateStdDev(gaps.before)
  const afterStdDev = calculateStdDev(gaps.after)
  
  // Score based on consistency and reasonable gap sizes
  const consistencyScore = Math.max(0, 30 - (beforeStdDev + afterStdDev) / 2)
  const gapReasonability = (avgBefore > 3 && avgBefore < 15) || (avgAfter > 3 && avgAfter < 15) ? 20 : 0
  
  // Check if current pattern matches historical gaps in latest draw
  const latestDraw = draws[0]
  const latestSorted = [...latestDraw.numbers].sort((a, b) => a - b)
  let matchScore = 0
  
  for (let i = 0; i < latestSorted.length - 1; i++) {
    const currentGap = latestSorted[i + 1] - latestSorted[i]
    // Check if this number would fit well in the gap pattern
    if (num > latestSorted[i] && num < latestSorted[i + 1]) {
      const gapBefore = num - latestSorted[i]
      const gapAfter = latestSorted[i + 1] - num
      if (Math.abs(gapBefore - avgBefore) < 3 || Math.abs(gapAfter - avgAfter) < 3) {
        matchScore += 25
      }
    }
  }
  
  return consistencyScore + gapReasonability + matchScore
}

/**
 * Calculate sequence score - how this number participates in sequences
 */
function calculateSequenceScore(num: number, draws: Draw[]): number {
  let sequenceParticipation = 0
  let consecutiveAppearances = 0
  
  draws.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    
    if (sorted.includes(num)) {
      // Check if part of consecutive sequence
      const index = sorted.indexOf(num)
      
      let isPartOfSequence = false
      
      // Check for consecutive numbers (e.g., 7,8,9)
      if (index > 0 && sorted[index - 1] === num - 1) {
        isPartOfSequence = true
        consecutiveAppearances++
      }
      if (index < sorted.length - 1 && sorted[index + 1] === num + 1) {
        isPartOfSequence = true
        consecutiveAppearances++
      }
      
      // Check for arithmetic progressions (e.g., 5,10,15)
      for (let step = 2; step <= 10; step++) {
        if (sorted.includes(num - step) && sorted.includes(num + step)) {
          isPartOfSequence = true
        }
      }
      
      if (isPartOfSequence) sequenceParticipation++
    }
  })
  
  // Check if the latest draw suggests this number in a sequence
  const latestSorted = [...draws[0].numbers].sort((a, b) => a - b)
  let nextInSequenceBonus = 0
  
  for (const drawnNum of latestSorted) {
    // Check if num would continue a sequence
    if (num === drawnNum + 1 || num === drawnNum - 1) {
      nextInSequenceBonus += 20
    }
    // Check for arithmetic progressions
    if (latestSorted.includes(drawnNum * 2 - num) || latestSorted.includes(drawnNum * 2 + num)) {
      nextInSequenceBonus += 10
    }
  }
  
  const participationRate = sequenceParticipation / draws.length * 100
  const consecutiveRate = consecutiveAppearances / draws.length * 50
  
  return participationRate + consecutiveRate + nextInSequenceBonus
}

/**
 * Calculate transition score - how numbers move between draws
 */
function calculateTransitionScore(num: number, recentDraws: Draw[], allDraws: Draw[]): number {
  let transitionPatterns: number[] = []
  
  // Track position changes when number appears in consecutive draws
  for (let i = 0; i < allDraws.length - 1; i++) {
    const currentSorted = [...allDraws[i].numbers].sort((a, b) => a - b)
    const previousSorted = [...allDraws[i + 1].numbers].sort((a, b) => a - b)
    
    const currentIndex = currentSorted.indexOf(num)
    const previousIndex = previousSorted.indexOf(num)
    
    // Both draws have this number - track position change
    if (currentIndex !== -1 && previousIndex !== -1) {
      transitionPatterns.push(currentIndex - previousIndex)
    }
    
    // Number appeared after not appearing
    if (currentIndex !== -1 && previousIndex === -1) {
      // Track what position it tends to reappear in
      transitionPatterns.push(currentIndex)
    }
  }
  
  if (transitionPatterns.length === 0) return 50 // Neutral score for numbers without history
  
  // Find the most common transition
  const transitionFreq = new Map<number, number>()
  transitionPatterns.forEach(t => {
    transitionFreq.set(t, (transitionFreq.get(t) || 0) + 1)
  })
  
  const mostCommonTransition = Array.from(transitionFreq.entries())
    .sort((a, b) => b[1] - a[1])[0]
  
  const consistency = mostCommonTransition[1] / transitionPatterns.length * 100
  
  // Check if the latest draw suggests this number based on transition patterns
  const latestDraw = recentDraws[0]
  const hasNum = latestDraw.numbers.includes(num)
  
  let predictionBonus = 0
  if (!hasNum && mostCommonTransition[0] >= 0) {
    // Number not in latest - might appear based on transition pattern
    predictionBonus = 20
  }
  
  return consistency + predictionBonus
}

/**
 * Find the preferred position for a number (0-4 for main numbers)
 */
function findPreferredPosition(num: number, draws: Draw[]): number {
  const positionCounts = [0, 0, 0, 0, 0]
  
  draws.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    const index = sorted.indexOf(num)
    if (index !== -1) {
      positionCounts[index]++
    }
  })
  
  return positionCounts.indexOf(Math.max(...positionCounts))
}

/**
 * Euro number position score
 */
function calculateEuroPositionScore(num: number, draws: Draw[]): number {
  const positionAppearances = [0, 0] // 2 positions for euro numbers
  let totalAppearances = 0
  
  draws.forEach(draw => {
    const sorted = [...draw.euroNumbers].sort((a, b) => a - b)
    const index = sorted.indexOf(num)
    if (index !== -1) {
      positionAppearances[index]++
      totalAppearances++
    }
  })
  
  if (totalAppearances === 0) return 0
  
  const maxPositionCount = Math.max(...positionAppearances)
  const positionConsistency = maxPositionCount / totalAppearances
  
  return (positionConsistency * 70) + (totalAppearances / draws.length * 30)
}

/**
 * Euro number gap score
 */
function calculateEuroGapScore(num: number, draws: Draw[]): number {
  const gaps: number[] = []
  
  draws.forEach(draw => {
    const sorted = [...draw.euroNumbers].sort((a, b) => a - b)
    if (sorted.length === 2 && sorted.includes(num)) {
      gaps.push(Math.abs(sorted[0] - sorted[1]))
    }
  })
  
  if (gaps.length === 0) return 0
  
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const stdDev = calculateStdDev(gaps)
  
  // Check if number would create a similar gap with latest draw
  const latestEuros = [...draws[0].euroNumbers].sort((a, b) => a - b)
  let matchScore = 0
  
  latestEuros.forEach(euro => {
    const potentialGap = Math.abs(num - euro)
    if (Math.abs(potentialGap - avgGap) < 2) {
      matchScore += 40
    }
  })
  
  return Math.max(0, 30 - stdDev) + matchScore
}

/**
 * Euro number sequence score
 */
function calculateEuroSequenceScore(num: number, draws: Draw[]): number {
  let consecutiveCount = 0
  
  draws.forEach(draw => {
    const sorted = [...draw.euroNumbers].sort((a, b) => a - b)
    if (sorted.length === 2) {
      // Check if they are consecutive
      if (Math.abs(sorted[0] - sorted[1]) === 1) {
        if (sorted.includes(num)) {
          consecutiveCount++
        }
      }
    }
  })
  
  // Check if latest draw suggests consecutive pattern
  const latestEuros = [...draws[0].euroNumbers].sort((a, b) => a - b)
  let bonus = 0
  
  latestEuros.forEach(euro => {
    if (Math.abs(num - euro) === 1) {
      bonus += 30
    }
  })
  
  return (consecutiveCount / draws.length * 100) + bonus
}

/**
 * Euro number transition score
 */
function calculateEuroTransitionScore(num: number, draws: Draw[]): number {
  let appearanceCount = 0
  
  draws.slice(0, 10).forEach(draw => {
    if (draw.euroNumbers.includes(num)) {
      appearanceCount++
    }
  })
  
  return (appearanceCount / Math.min(10, draws.length)) * 100
}

/**
 * Find preferred position for euro number
 */
function findEuroPreferredPosition(num: number, draws: Draw[]): number {
  const positionCounts = [0, 0]
  
  draws.forEach(draw => {
    const sorted = [...draw.euroNumbers].sort((a, b) => a - b)
    const index = sorted.indexOf(num)
    if (index !== -1) {
      positionCounts[index]++
    }
  })
  
  return positionCounts.indexOf(Math.max(...positionCounts))
}

/**
 * Extract overall pattern insights from draws
 */
function extractPatternInsights(draws: Draw[]): {
  commonGapPattern: number[]
  preferredPositions: Map<number, number>
  sequenceTendency: 'ascending' | 'mixed' | 'balanced'
  avgGapBetweenNumbers: number
} {
  const allGaps: number[] = []
  let ascendingCount = 0
  let mixedCount = 0
  
  draws.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    const gaps: number[] = []
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1] - sorted[i]
      gaps.push(gap)
      allGaps.push(gap)
    }
    
    // Check if gaps are generally increasing (ascending tendency)
    let increasing = 0
    let decreasing = 0
    for (let i = 0; i < gaps.length - 1; i++) {
      if (gaps[i + 1] > gaps[i]) increasing++
      if (gaps[i + 1] < gaps[i]) decreasing++
    }
    
    if (increasing > decreasing) ascendingCount++
    else if (increasing < decreasing) mixedCount++
  })
  
  const avgGapBetweenNumbers = allGaps.reduce((a, b) => a + b, 0) / allGaps.length
  
  // Find most common gap pattern (sequence of gaps)
  const commonGapPattern = findMostCommonGapPattern(draws)
  
  // Determine sequence tendency
  const sequenceTendency: 'ascending' | 'mixed' | 'balanced' = 
    ascendingCount > mixedCount * 1.5 ? 'ascending' :
    mixedCount > ascendingCount * 1.5 ? 'mixed' : 'balanced'
  
  // Build preferred positions map
  const preferredPositions = new Map<number, number>()
  for (let num = 1; num <= 50; num++) {
    preferredPositions.set(num, findPreferredPosition(num, draws))
  }
  
  return {
    commonGapPattern,
    preferredPositions,
    sequenceTendency,
    avgGapBetweenNumbers
  }
}

/**
 * Find the most common gap pattern in recent draws
 */
function findMostCommonGapPattern(draws: Draw[]): number[] {
  const patternFreq = new Map<string, number[]>()
  
  draws.forEach(draw => {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    const gaps: number[] = []
    
    for (let i = 0; i < sorted.length - 1; i++) {
      gaps.push(sorted[i + 1] - sorted[i])
    }
    
    const patternKey = gaps.join(',')
    patternFreq.set(patternKey, gaps)
  })
  
  // Return the most balanced/average pattern
  const allPatterns = Array.from(patternFreq.values())
  if (allPatterns.length === 0) return [10, 10, 10, 10]
  
  // Calculate average pattern
  const avgPattern: number[] = [0, 0, 0, 0]
  allPatterns.forEach(pattern => {
    pattern.forEach((gap, idx) => {
      if (idx < 4) avgPattern[idx] += gap
    })
  })
  
  return avgPattern.map(sum => Math.round(sum / allPatterns.length))
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  
  return Math.sqrt(variance)
}
