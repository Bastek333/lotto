/**
 * Algorithm Optimization Test Script
 * Tests different weight configurations to find optimal parameters
 */

// Sample historical draws data for testing (you would load real data)
const sampleDraws = [
  // Recent draws from EuroJackpot
  { drawDate: '2025-12-13', numbers: [3, 12, 23, 34, 45], euroNumbers: [5, 9] },
  { drawDate: '2025-12-10', numbers: [7, 15, 28, 39, 48], euroNumbers: [2, 11] },
  { drawDate: '2025-12-06', numbers: [5, 18, 25, 41, 47], euroNumbers: [1, 8] },
  { drawDate: '2025-12-03', numbers: [9, 14, 31, 38, 50], euroNumbers: [4, 10] },
  { drawDate: '2025-11-29', numbers: [2, 16, 27, 35, 44], euroNumbers: [3, 7] },
  { drawDate: '2025-11-26', numbers: [11, 19, 29, 40, 49], euroNumbers: [6, 12] },
  { drawDate: '2025-11-22', numbers: [4, 13, 24, 36, 46], euroNumbers: [2, 9] },
  { drawDate: '2025-11-19', numbers: [8, 17, 26, 42, 48], euroNumbers: [1, 5] },
  { drawDate: '2025-11-15', numbers: [6, 20, 30, 37, 45], euroNumbers: [4, 11] },
  { drawDate: '2025-11-12', numbers: [1, 10, 22, 33, 43], euroNumbers: [7, 10] },
  // Add more historical draws...
];

// Core prediction algorithm (simplified version of AdvancedPredictor)
class EuroJackpotPredictor {
  constructor(weights) {
    this.weights = weights;
  }

  analyzeFrequencies(draws) {
    const shortTerm = draws.slice(0, Math.min(10, draws.length));
    const mediumTerm = draws.slice(0, Math.min(30, draws.length));
    const longTerm = draws;
    
    const calculateFreq = (drawSet, max) => {
      const freq = new Map();
      for (let i = 1; i <= max; i++) freq.set(i, 0);
      
      drawSet.forEach(draw => {
        draw.numbers.forEach(num => {
          freq.set(num, (freq.get(num) || 0) + 1);
        });
      });
      
      return freq;
    };
    
    const calculateFreqEuro = (drawSet, max) => {
      const freq = new Map();
      for (let i = 1; i <= max; i++) freq.set(i, 0);
      
      drawSet.forEach(draw => {
        draw.euroNumbers.forEach(num => {
          freq.set(num, (freq.get(num) || 0) + 1);
        });
      });
      
      return freq;
    };
    
    return {
      mainShort: calculateFreq(shortTerm, 50),
      mainMedium: calculateFreq(mediumTerm, 50),
      mainLong: calculateFreq(longTerm, 50),
      euroShort: calculateFreqEuro(shortTerm, 12),
      euroMedium: calculateFreqEuro(mediumTerm, 12),
      euroLong: calculateFreqEuro(longTerm, 12)
    };
  }

  analyzeMomentum(draws) {
    const momentum = new Map();
    const euroMomentum = new Map();
    
    const recent = draws.slice(0, Math.min(10, draws.length));
    const older = draws.slice(10, Math.min(30, draws.length));
    
    for (let num = 1; num <= 50; num++) {
      const recentCount = recent.filter(d => d.numbers.includes(num)).length;
      const olderCount = older.length > 0 ? older.filter(d => d.numbers.includes(num)).length : 0;
      
      const recentRate = recentCount / recent.length;
      const olderRate = older.length > 0 ? olderCount / older.length : 0;
      
      momentum.set(num, recentRate - olderRate);
    }
    
    for (let num = 1; num <= 12; num++) {
      const recentCount = recent.filter(d => d.euroNumbers.includes(num)).length;
      const olderCount = older.length > 0 ? older.filter(d => d.euroNumbers.includes(num)).length : 0;
      
      const recentRate = recentCount / recent.length;
      const olderRate = older.length > 0 ? olderCount / older.length : 0;
      
      euroMomentum.set(num, recentRate - olderRate);
    }
    
    return { main: momentum, euro: euroMomentum };
  }

  analyzeGaps(draws) {
    const gaps = new Map();
    const euroGaps = new Map();
    
    for (let num = 1; num <= 50; num++) {
      const appearances = [];
      draws.forEach((draw, idx) => {
        if (draw.numbers.includes(num)) {
          appearances.push(idx);
        }
      });
      
      if (appearances.length > 0) {
        const currentGap = appearances[0];
        const avgGap = appearances.length > 1 
          ? appearances.slice(0, -1).reduce((sum, pos, idx) => sum + (pos - (appearances[idx + 1] || 0)), 0) / (appearances.length - 1)
          : currentGap;
        
        const gapScore = currentGap / (avgGap || 1);
        gaps.set(num, gapScore);
      } else {
        gaps.set(num, 2);
      }
    }
    
    for (let num = 1; num <= 12; num++) {
      const appearances = [];
      draws.forEach((draw, idx) => {
        if (draw.euroNumbers.includes(num)) {
          appearances.push(idx);
        }
      });
      
      if (appearances.length > 0) {
        const currentGap = appearances[0];
        const avgGap = appearances.length > 1 
          ? appearances.slice(0, -1).reduce((sum, pos, idx) => sum + (pos - (appearances[idx + 1] || 0)), 0) / (appearances.length - 1)
          : currentGap;
        
        const gapScore = currentGap / (avgGap || 1);
        euroGaps.set(num, gapScore);
      } else {
        euroGaps.set(num, 2);
      }
    }
    
    return { main: gaps, euro: euroGaps };
  }

  analyzePatterns(draws) {
    const patterns = new Map();
    const lastDraw = draws[0];
    
    const calculateSimilarity = (arr1, arr2) => {
      return arr1.filter(n => arr2.includes(n)).length;
    };
    
    for (let num = 1; num <= 50; num++) {
      let patternScore = 0;
      
      for (let i = 1; i < draws.length - 1; i++) {
        const similarity = calculateSimilarity(lastDraw.numbers, draws[i].numbers);
        if (similarity >= 2) {
          if (draws[i - 1].numbers.includes(num)) {
            patternScore += similarity * 0.5;
          }
        }
      }
      
      patterns.set(num, patternScore);
    }
    
    return patterns;
  }

  analyzePositions(draws) {
    const positionPrefs = new Map();
    
    draws.forEach(draw => {
      const sorted = [...draw.numbers].sort((a, b) => a - b);
      sorted.forEach((num, position) => {
        if (!positionPrefs.has(num)) {
          positionPrefs.set(num, [0, 0, 0, 0, 0]);
        }
        positionPrefs.get(num)[position]++;
      });
    });
    
    const positionScores = new Map();
    for (let num = 1; num <= 50; num++) {
      const positions = positionPrefs.get(num);
      if (positions) {
        const total = positions.reduce((a, b) => a + b, 0);
        const entropy = positions.reduce((sum, count) => {
          if (count === 0) return sum;
          const p = count / total;
          return sum - p * Math.log2(p);
        }, 0);
        positionScores.set(num, entropy);
      } else {
        positionScores.set(num, 0);
      }
    }
    
    return positionScores;
  }

  analyzeClusters(draws) {
    const clusterScores = new Map();
    
    const getClusters = (nums) => {
      return nums.map(n => Math.floor((n - 1) / 10));
    };
    
    const clusterFreq = new Map();
    draws.forEach(draw => {
      const clusters = getClusters(draw.numbers);
      clusters.forEach(c => {
        clusterFreq.set(c, (clusterFreq.get(c) || 0) + 1);
      });
    });
    
    for (let num = 1; num <= 50; num++) {
      const cluster = Math.floor((num - 1) / 10);
      const clusterScore = (clusterFreq.get(cluster) || 0) / draws.length;
      clusterScores.set(num, clusterScore * 100);
    }
    
    return clusterScores;
  }

  normalizeMomentum(value) {
    return Math.max(0, Math.min(100, (value + 0.5) * 100));
  }
  
  normalizePattern(value) {
    return Math.min(100, value * 10);
  }
  
  normalizeGap(value) {
    return Math.min(100, value * 50);
  }
  
  normalizePosition(value) {
    return (value / 2.32) * 100;
  }

  predict(historicalDraws) {
    if (historicalDraws.length < 10) {
      return { numbers: [], euroNumbers: [] };
    }

    const freq = this.analyzeFrequencies(historicalDraws);
    const momentum = this.analyzeMomentum(historicalDraws);
    const patterns = this.analyzePatterns(historicalDraws);
    const gaps = this.analyzeGaps(historicalDraws);
    const positions = this.analyzePositions(historicalDraws);
    const clusters = this.analyzeClusters(historicalDraws);

    // Calculate main number scores
    const mainScores = [];
    for (let num = 1; num <= 50; num++) {
      const freqShort = ((freq.mainShort.get(num) || 0) / Math.min(10, historicalDraws.length)) * 100;
      const freqMedium = ((freq.mainMedium.get(num) || 0) / Math.min(30, historicalDraws.length)) * 100;
      const freqLong = ((freq.mainLong.get(num) || 0) / historicalDraws.length) * 100;
      
      const momentumScore = this.normalizeMomentum(momentum.main.get(num) || 0);
      const patternScore = this.normalizePattern(patterns.get(num) || 0);
      const gapScore = this.normalizeGap(gaps.main.get(num) || 0);
      const positionScore = this.normalizePosition(positions.get(num) || 0);
      const clusterScore = clusters.get(num) || 0;
      
      const finalScore = 
        freqShort * this.weights.freqShort +
        freqMedium * this.weights.freqMedium +
        freqLong * this.weights.freqLong +
        momentumScore * this.weights.momentum +
        patternScore * this.weights.pattern +
        gapScore * this.weights.gap +
        positionScore * this.weights.position +
        clusterScore * this.weights.cluster;
      
      mainScores.push({ number: num, score: finalScore });
    }

    // Calculate euro number scores
    const euroScores = [];
    for (let num = 1; num <= 12; num++) {
      const freqShort = ((freq.euroShort.get(num) || 0) / Math.min(10, historicalDraws.length)) * 100;
      const freqMedium = ((freq.euroMedium.get(num) || 0) / Math.min(30, historicalDraws.length)) * 100;
      const freqLong = ((freq.euroLong.get(num) || 0) / historicalDraws.length) * 100;
      
      const momentumScore = this.normalizeMomentum(momentum.euro.get(num) || 0);
      const gapScore = this.normalizeGap(gaps.euro.get(num) || 0);
      
      const finalScore = 
        freqShort * this.weights.euroFreqShort +
        freqMedium * this.weights.euroFreqMedium +
        freqLong * this.weights.euroFreqLong +
        momentumScore * this.weights.euroMomentum +
        gapScore * this.weights.euroGap;
      
      euroScores.push({ number: num, score: finalScore });
    }

    const predictedNumbers = mainScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.number)
      .sort((a, b) => a - b);
    
    const predictedEuroNumbers = euroScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(s => s.number)
      .sort((a, b) => a - b);

    return {
      numbers: predictedNumbers,
      euroNumbers: predictedEuroNumbers
    };
  }
}

// Backtest function
function backtest(draws, weights, minDraws = 30) {
  const predictor = new EuroJackpotPredictor(weights);
  const results = [];
  
  for (let i = minDraws; i < draws.length; i++) {
    const historicalDraws = draws.slice(i);
    const targetDraw = draws[i - 1];
    
    const prediction = predictor.predict(historicalDraws);
    
    const mainMatches = prediction.numbers.filter(n => targetDraw.numbers.includes(n)).length;
    const euroMatches = prediction.euroNumbers.filter(n => targetDraw.euroNumbers.includes(n)).length;
    
    results.push({
      mainMatches,
      euroMatches,
      score: mainMatches * 10 + euroMatches * 5
    });
  }
  
  const totalTests = results.length;
  if (totalTests === 0) return null;
  
  const avgMainMatches = results.reduce((sum, r) => sum + r.mainMatches, 0) / totalTests;
  const avgEuroMatches = results.reduce((sum, r) => sum + r.euroMatches, 0) / totalTests;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests;
  const perfect5 = results.filter(r => r.mainMatches === 5).length;
  const fourOrMore = results.filter(r => r.mainMatches >= 4).length;
  const threeOrMore = results.filter(r => r.mainMatches >= 3).length;
  const perfectEuro = results.filter(r => r.euroMatches === 2).length;
  
  return {
    totalTests,
    avgMainMatches,
    avgEuroMatches,
    avgScore,
    perfect5,
    fourOrMore,
    threeOrMore,
    perfectEuro
  };
}

// Current weights from AdvancedPredictor
const currentWeights = {
  freqShort: 0.20,
  freqMedium: 0.15,
  freqLong: 0.10,
  momentum: 0.15,
  pattern: 0.15,
  gap: 0.12,
  position: 0.08,
  cluster: 0.05,
  euroFreqShort: 0.30,
  euroFreqMedium: 0.20,
  euroFreqLong: 0.15,
  euroMomentum: 0.20,
  euroGap: 0.15
};

console.log('Testing Current Weights Configuration...');
console.log('=========================================\n');

const metrics = backtest(sampleDraws, currentWeights, 10);

if (metrics) {
  console.log('Results:');
  console.log(`Total Tests: ${metrics.totalTests}`);
  console.log(`Avg Main Matches: ${metrics.avgMainMatches.toFixed(2)} / 5 (${((metrics.avgMainMatches/5)*100).toFixed(1)}%)`);
  console.log(`Avg Euro Matches: ${metrics.avgEuroMatches.toFixed(2)} / 2 (${((metrics.avgEuroMatches/2)*100).toFixed(1)}%)`);
  console.log(`Avg Score: ${metrics.avgScore.toFixed(1)}`);
  console.log(`5/5 Main: ${metrics.perfect5} (${((metrics.perfect5/metrics.totalTests)*100).toFixed(2)}%)`);
  console.log(`4+ Main: ${metrics.fourOrMore} (${((metrics.fourOrMore/metrics.totalTests)*100).toFixed(2)}%)`);
  console.log(`3+ Main: ${metrics.threeOrMore} (${((metrics.threeOrMore/metrics.totalTests)*100).toFixed(2)}%)`);
  console.log(`2/2 Euro: ${metrics.perfectEuro} (${((metrics.perfectEuro/metrics.totalTests)*100).toFixed(2)}%)`);
} else {
  console.log('Not enough data to run backtest.');
}

console.log('\n\nNOTE: This is testing with sample data.');
console.log('To properly test, you need to load actual historical EuroJackpot data.');
console.log('The algorithm should be run through the React app with real API data.');
