/**
 * BACKTEST FRAMEWORK FOR LOTTERY PREDICTION ALGORITHMS
 * 
 * This module tests different prediction strategies against historical data
 * to measure their actual performance and find what works best.
 */

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
}

type PredictionResult = {
  prediction: { numbers: number[], euroNumbers: number[] }
  actual: { numbers: number[], euroNumbers: number[] }
  mainMatches: number
  euroMatches: number
  score: number
  proximityScore: number
}

type AlgorithmPerformance = {
  name: string
  totalTests: number
  avgMainMatches: number
  avgEuroMatches: number
  avgScore: number
  avgProximityScore: number
  exactMatch5: number  // How many times got all 5 main numbers
  exactMatch4: number  // How many times got 4 main numbers
  exactMatch3: number  // How many times got 3 main numbers
  exactMatch2Euro: number  // How many times got both euro numbers
  bestPrediction: PredictionResult | null
}

/**
 * Calculate proximity score - how close predictions are to actual numbers
 */
function calculateProximity(predicted: number[], actual: number[]): number {
  let proximityScore = 0
  
  predicted.forEach(predNum => {
    const closestActual = actual.reduce((closest, actualNum) => {
      const diff = Math.abs(predNum - actualNum)
      return diff < Math.abs(predNum - closest) ? actualNum : closest
    }, actual[0])
    
    const distance = Math.abs(predNum - closestActual)
    
    // Score based on distance (closer is better)
    if (distance === 0) proximityScore += 10  // Exact match
    else if (distance <= 2) proximityScore += 5
    else if (distance <= 5) proximityScore += 3
    else if (distance <= 10) proximityScore += 1
  })
  
  return proximityScore
}

/**
 * Run backtest for a prediction algorithm
 */
export function backtestAlgorithm(
  data: Draw[],
  predictFn: (historicalDraws: Draw[]) => { numbers: number[], euroNumbers: number[] },
  algorithmName: string,
  testSize: number = 100
): AlgorithmPerformance {
  const results: PredictionResult[] = []
  const testCount = Math.min(testSize, data.length - 30)
  
  // Use data from position 30 onwards for testing
  for (let i = 30; i < 30 + testCount; i++) {
    const historicalData = data.slice(i)  // All draws after position i
    const actualDraw = data[i - 1]  // The draw we're trying to predict
    
    try {
      const prediction = predictFn(historicalData)
      
      const mainMatches = prediction.numbers.filter(n => 
        actualDraw.numbers.includes(n)
      ).length
      
      const euroMatches = prediction.euroNumbers.filter(n => 
        actualDraw.euroNumbers.includes(n)
      ).length
      
      const proximityScore = calculateProximity(
        prediction.numbers, 
        actualDraw.numbers
      )
      
      const score = mainMatches * 10 + euroMatches * 5 + proximityScore * 0.5
      
      results.push({
        prediction,
        actual: {
          numbers: actualDraw.numbers,
          euroNumbers: actualDraw.euroNumbers
        },
        mainMatches,
        euroMatches,
        score,
        proximityScore
      })
    } catch (error) {
      console.error(`Error testing ${algorithmName}:`, error)
    }
  }
  
  // Calculate statistics
  const totalTests = results.length
  const avgMainMatches = results.reduce((sum, r) => sum + r.mainMatches, 0) / totalTests
  const avgEuroMatches = results.reduce((sum, r) => sum + r.euroMatches, 0) / totalTests
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests
  const avgProximityScore = results.reduce((sum, r) => sum + r.proximityScore, 0) / totalTests
  
  const exactMatch5 = results.filter(r => r.mainMatches === 5).length
  const exactMatch4 = results.filter(r => r.mainMatches === 4).length
  const exactMatch3 = results.filter(r => r.mainMatches === 3).length
  const exactMatch2Euro = results.filter(r => r.euroMatches === 2).length
  
  const bestPrediction = results.reduce((best, current) => 
    current.score > (best?.score || 0) ? current : best
  , null as PredictionResult | null)
  
  return {
    name: algorithmName,
    totalTests,
    avgMainMatches,
    avgEuroMatches,
    avgScore,
    avgProximityScore,
    exactMatch5,
    exactMatch4,
    exactMatch3,
    exactMatch2Euro,
    bestPrediction
  }
}

/**
 * Statistical Analysis of Historical Draws
 */
export function analyzeHistoricalPatterns(data: Draw[]): {
  numberFrequency: Map<number, number>
  euroFrequency: Map<number, number>
  numberGaps: Map<number, number[]>  // Gap since last appearance
  avgGap: Map<number, number>
  consecutivePairs: Map<string, number>
  sumRanges: { min: number, max: number, avg: number }
  rangePatterns: { low: number, mid: number, high: number }[]  // Distribution in ranges 1-17, 18-34, 35-50
  hotNumbers: number[]  // Appeared in last 10 draws
  coldNumbers: number[]  // Haven't appeared in last 20 draws
  evenOddRatio: number  // Average ratio of even to odd numbers
} {
  const numberFrequency = new Map<number, number>()
  const euroFrequency = new Map<number, number>()
  const numberGaps = new Map<number, number[]>()
  const lastSeen = new Map<number, number>()
  const consecutivePairs = new Map<string, number>()
  const sums: number[] = []
  const rangePatterns: { low: number, mid: number, high: number }[] = []
  let totalEven = 0
  let totalOdd = 0
  
  // Initialize
  for (let i = 1; i <= 50; i++) {
    numberFrequency.set(i, 0)
    numberGaps.set(i, [])
    lastSeen.set(i, -1)
  }
  for (let i = 1; i <= 12; i++) {
    euroFrequency.set(i, 0)
  }
  
  // Analyze each draw
  data.forEach((draw, index) => {
    // Main numbers
    const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)
    
    // Sum analysis
    const sum = sortedNumbers.reduce((a, b) => a + b, 0)
    sums.push(sum)
    
    // Range distribution
    const low = sortedNumbers.filter(n => n <= 17).length
    const mid = sortedNumbers.filter(n => n >= 18 && n <= 34).length
    const high = sortedNumbers.filter(n => n >= 35).length
    rangePatterns.push({ low, mid, high })
    
    // Even/Odd
    const evenCount = sortedNumbers.filter(n => n % 2 === 0).length
    totalEven += evenCount
    totalOdd += (5 - evenCount)
    
    sortedNumbers.forEach((num, i) => {
      // Frequency
      numberFrequency.set(num, (numberFrequency.get(num) || 0) + 1)
      
      // Gaps
      const last = lastSeen.get(num) || 0
      if (last >= 0) {
        const gap = index - last
        numberGaps.get(num)!.push(gap)
      }
      lastSeen.set(num, index)
      
      // Consecutive pairs
      if (i < sortedNumbers.length - 1) {
        const pair = `${num}-${sortedNumbers[i + 1]}`
        consecutivePairs.set(pair, (consecutivePairs.get(pair) || 0) + 1)
      }
    })
    
    // Euro numbers
    draw.euroNumbers.forEach(num => {
      euroFrequency.set(num, (euroFrequency.get(num) || 0) + 1)
    })
  })
  
  // Calculate average gaps
  const avgGap = new Map<number, number>()
  numberGaps.forEach((gaps, num) => {
    if (gaps.length > 0) {
      avgGap.set(num, gaps.reduce((a, b) => a + b, 0) / gaps.length)
    }
  })
  
  // Find hot and cold numbers
  const recent10 = data.slice(0, 10)
  const recent20 = data.slice(0, 20)
  
  const hotNumbersSet = new Set<number>()
  recent10.forEach(draw => {
    draw.numbers.forEach(n => hotNumbersSet.add(n))
  })
  
  const coldNumbers: number[] = []
  for (let i = 1; i <= 50; i++) {
    const appearedRecently = recent20.some(draw => draw.numbers.includes(i))
    if (!appearedRecently) {
      coldNumbers.push(i)
    }
  }
  
  return {
    numberFrequency,
    euroFrequency,
    numberGaps,
    avgGap,
    consecutivePairs,
    sumRanges: {
      min: Math.min(...sums),
      max: Math.max(...sums),
      avg: sums.reduce((a, b) => a + b, 0) / sums.length
    },
    rangePatterns,
    hotNumbers: Array.from(hotNumbersSet),
    coldNumbers,
    evenOddRatio: totalEven / (totalEven + totalOdd)
  }
}
