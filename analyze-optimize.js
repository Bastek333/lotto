/**
 * Advanced Algorithm Optimization Script
 * 
 * This script analyzes the Eurojackpot data and tests different configurations
 * to find the optimal parameters for the best prediction accuracy.
 */

import fs from 'fs';

// Load the Eurojackpot data
const data = JSON.parse(fs.readFileSync('./src/data/eurojackpot_draws.json', 'utf-8'));

console.log('='.repeat(80));
console.log('ADVANCED ALGORITHM OPTIMIZATION');
console.log('='.repeat(80));
console.log(`Total draws in dataset: ${data.length}`);
console.log(`Date range: ${data[data.length - 1].drawDate} to ${data[0].drawDate}`);
console.log('='.repeat(80));

// Test different configurations
const testConfigurations = [
  { minDraws: 20, shortTerm: 8, mediumTerm: 20, weights: 'v1' },
  { minDraws: 30, shortTerm: 10, mediumTerm: 30, weights: 'v1' },
  { minDraws: 40, shortTerm: 12, mediumTerm: 40, weights: 'v1' },
  { minDraws: 50, shortTerm: 15, mediumTerm: 50, weights: 'v1' },
  { minDraws: 60, shortTerm: 20, mediumTerm: 60, weights: 'v1' },
  { minDraws: 80, shortTerm: 25, mediumTerm: 80, weights: 'v1' },
  { minDraws: 100, shortTerm: 30, mediumTerm: 100, weights: 'v1' },
  // Test with different weight configurations
  { minDraws: 40, shortTerm: 12, mediumTerm: 40, weights: 'v2' },
  { minDraws: 50, shortTerm: 15, mediumTerm: 50, weights: 'v2' },
  { minDraws: 40, shortTerm: 12, mediumTerm: 40, weights: 'v3' },
  { minDraws: 50, shortTerm: 15, mediumTerm: 50, weights: 'v3' },
];

// Weight configurations
const weightConfigs = {
  v1: {
    freqShort: 0.25,
    freqMedium: 0.16,
    freqLong: 0.08,
    momentum: 0.17,
    pattern: 0.13,
    gap: 0.15,
    position: 0.04,
    cluster: 0.02
  },
  v2: {
    freqShort: 0.30,
    freqMedium: 0.15,
    freqLong: 0.05,
    momentum: 0.20,
    pattern: 0.10,
    gap: 0.18,
    position: 0.02,
    cluster: 0.00
  },
  v3: {
    freqShort: 0.22,
    freqMedium: 0.18,
    freqLong: 0.10,
    momentum: 0.15,
    pattern: 0.15,
    gap: 0.15,
    position: 0.03,
    cluster: 0.02
  }
};

// Core prediction algorithm
function predictNumbers(historicalDraws, config) {
  const weights = weightConfigs[config.weights];
  
  // Phase 1: Multi-dimensional Frequency Analysis
  const frequencyData = analyzeFrequencies(historicalDraws, config);
  
  // Phase 2: Momentum & Trend Analysis
  const momentumData = analyzeMomentum(historicalDraws, config);
  
  // Phase 3: Pattern Recognition
  const patternData = analyzePatterns(historicalDraws);
  
  // Phase 4: Gap Analysis
  const gapData = analyzeGaps(historicalDraws);
  
  // Phase 5: Position-based Analysis
  const positionData = analyzePositions(historicalDraws);
  
  // Phase 6: Cluster Analysis
  const clusterData = analyzeClusters(historicalDraws);
  
  // Calculate scores for main numbers
  const mainScores = calculateMainNumberScores(
    frequencyData,
    momentumData,
    patternData,
    gapData,
    positionData,
    clusterData,
    historicalDraws,
    weights
  );
  
  const euroScores = calculateEuroNumberScores(
    historicalDraws,
    frequencyData,
    momentumData,
    gapData,
    config
  );
  
  const predictedNumbers = mainScores
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5)
    .map(s => s.number)
    .sort((a, b) => a - b);
  
  const predictedEuroNumbers = euroScores
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 2)
    .map(s => s.number)
    .sort((a, b) => a - b);
  
  return { numbers: predictedNumbers, euroNumbers: predictedEuroNumbers };
}

function analyzeFrequencies(draws, config) {
  const shortTerm = draws.slice(0, config.shortTerm);
  const mediumTerm = draws.slice(0, config.mediumTerm);
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
  
  const calculateFreqForEuro = (drawSet, max) => {
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
    euroShort: calculateFreqForEuro(shortTerm, 12),
    euroMedium: calculateFreqForEuro(mediumTerm, 12),
    euroLong: calculateFreqForEuro(longTerm, 12)
  };
}

function analyzeMomentum(draws, config) {
  const momentum = new Map();
  const euroMomentum = new Map();
  
  const recent = draws.slice(0, config.shortTerm);
  const older = draws.slice(config.shortTerm, config.mediumTerm);
  
  for (let num = 1; num <= 50; num++) {
    let recentWeightedCount = 0;
    recent.forEach((d, idx) => {
      if (d.numbers.includes(num)) {
        recentWeightedCount += 1 - (idx * 0.1);
      }
    });
    
    const olderCount = older.length > 0 ? older.filter(d => d.numbers.includes(num)).length : 0;
    
    const recentRate = recentWeightedCount / recent.length;
    const olderRate = older.length > 0 ? olderCount / older.length : 0;
    
    momentum.set(num, recentRate - olderRate * 0.7);
  }
  
  for (let num = 1; num <= 12; num++) {
    let recentWeightedCount = 0;
    recent.forEach((d, idx) => {
      if (d.euroNumbers.includes(num)) {
        recentWeightedCount += 1 - (idx * 0.1);
      }
    });
    
    const olderCount = older.length > 0 ? older.filter(d => d.euroNumbers.includes(num)).length : 0;
    
    const recentRate = recentWeightedCount / recent.length;
    const olderRate = older.length > 0 ? olderCount / older.length : 0;
    
    euroMomentum.set(num, recentRate - olderRate * 0.7);
  }
  
  return { main: momentum, euro: euroMomentum };
}

function analyzePatterns(draws) {
  const patterns = new Map();
  const lastDraw = draws[0];
  
  for (let num = 1; num <= 50; num++) {
    let patternScore = 0;
    
    for (let i = 1; i < draws.length - 1; i++) {
      const similarity = calculateSimilarity(lastDraw.numbers, draws[i].numbers);
      if (similarity >= 2) {
        if (draws[i - 1].numbers.includes(num)) {
          patternScore += similarity * 0.6;
        }
      }
    }
    
    let pairScore = 0;
    for (const lastNum of lastDraw.numbers) {
      let coOccurrences = 0;
      for (const draw of draws.slice(1, Math.min(50, draws.length))) {
        if (draw.numbers.includes(lastNum) && draw.numbers.includes(num)) {
          coOccurrences++;
        }
      }
      pairScore += coOccurrences / Math.min(50, draws.length);
    }
    
    patterns.set(num, patternScore + pairScore * 10);
  }
  
  return patterns;
}

function calculateSimilarity(arr1, arr2) {
  return arr1.filter(n => arr2.includes(n)).length;
}

function analyzeGaps(draws) {
  const gaps = new Map();
  const euroGaps = new Map();
  
  for (let num = 1; num <= 50; num++) {
    const appearances = [];
    draws.forEach((draw, idx) => {
      if (draw.numbers.includes(num)) {
        appearances.push(idx);
      }
    });
    
    if (appearances.length > 1) {
      const currentGap = appearances[0];
      
      const gapsList = [];
      for (let i = 0; i < appearances.length - 1; i++) {
        gapsList.push(appearances[i] - appearances[i + 1]);
      }
      
      const avgGap = gapsList.reduce((sum, g) => sum + g, 0) / gapsList.length;
      const variance = gapsList.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gapsList.length;
      const stdDev = Math.sqrt(variance);
      
      const deviation = (currentGap - avgGap) / (stdDev || 1);
      const gapScore = 1 + Math.max(0, deviation * 0.5);
      
      gaps.set(num, gapScore);
    } else if (appearances.length === 1) {
      gaps.set(num, appearances[0] / 10);
    } else {
      gaps.set(num, 2.5);
    }
  }
  
  for (let num = 1; num <= 12; num++) {
    const appearances = [];
    draws.forEach((draw, idx) => {
      if (draw.euroNumbers.includes(num)) {
        appearances.push(idx);
      }
    });
    
    if (appearances.length > 1) {
      const currentGap = appearances[0];
      
      const gapsList = [];
      for (let i = 0; i < appearances.length - 1; i++) {
        gapsList.push(appearances[i] - appearances[i + 1]);
      }
      
      const avgGap = gapsList.reduce((sum, g) => sum + g, 0) / gapsList.length;
      const variance = gapsList.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gapsList.length;
      const stdDev = Math.sqrt(variance);
      
      const deviation = (currentGap - avgGap) / (stdDev || 1);
      const gapScore = 1 + Math.max(0, deviation * 0.5);
      
      euroGaps.set(num, gapScore);
    } else if (appearances.length === 1) {
      euroGaps.set(num, appearances[0] / 5);
    } else {
      euroGaps.set(num, 2.5);
    }
  }
  
  return { main: gaps, euro: euroGaps };
}

function analyzePositions(draws) {
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

function analyzeClusters(draws) {
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

function calculateMainNumberScores(freq, momentum, patterns, gaps, positions, clusters, draws, weights) {
  const scores = [];
  
  for (let num = 1; num <= 50; num++) {
    const freqShort = ((freq.mainShort.get(num) || 0) / Math.min(draws.length, 10)) * 100;
    const freqMedium = ((freq.mainMedium.get(num) || 0) / Math.min(draws.length, 30)) * 100;
    const freqLong = ((freq.mainLong.get(num) || 0) / draws.length) * 100;
    
    const momentumScore = Math.max(0, Math.min(100, ((momentum.main.get(num) || 0) + 0.5) * 100));
    const patternScore = Math.min(100, (patterns.get(num) || 0) * 10);
    const gapScore = Math.min(100, Math.pow((gaps.main.get(num) || 0), 1.3) * 40);
    const positionScore = ((positions.get(num) || 0) / 2.32) * 100;
    const clusterScore = clusters.get(num) || 0;
    
    const finalScore = 
      freqShort * weights.freqShort +
      freqMedium * weights.freqMedium +
      freqLong * weights.freqLong +
      momentumScore * weights.momentum +
      patternScore * weights.pattern +
      gapScore * weights.gap +
      positionScore * weights.position +
      clusterScore * weights.cluster;
    
    scores.push({ number: num, finalScore });
  }
  
  return scores;
}

function calculateEuroNumberScores(draws, freq, momentum, gaps, config) {
  const scores = [];
  
  const weights = {
    freqShort: 0.32,
    freqMedium: 0.18,
    freqLong: 0.10,
    momentum: 0.18,
    gap: 0.22
  };
  
  for (let num = 1; num <= 12; num++) {
    const freqShort = ((freq.euroShort.get(num) || 0) / Math.min(config.shortTerm, draws.length)) * 100;
    const freqMedium = ((freq.euroMedium.get(num) || 0) / Math.min(config.mediumTerm, draws.length)) * 100;
    const freqLong = ((freq.euroLong.get(num) || 0) / draws.length) * 100;
    
    const momentumScore = Math.max(0, Math.min(100, ((momentum.euro.get(num) || 0) + 0.5) * 100));
    const gapScore = Math.min(100, Math.pow((gaps.euro.get(num) || 0), 1.3) * 40);
    
    const finalScore = 
      freqShort * weights.freqShort +
      freqMedium * weights.freqMedium +
      freqLong * weights.freqLong +
      momentumScore * weights.momentum +
      gapScore * weights.gap;
    
    scores.push({ number: num, finalScore });
  }
  
  return scores;
}

// Run backtest for a configuration
function runBacktest(config) {
  const results = [];
  
  for (let i = config.minDraws; i < Math.min(data.length, config.minDraws + 200); i++) {
    const historicalDraws = data.slice(i);
    const targetDraw = data[i - 1];
    
    const prediction = predictNumbers(historicalDraws, config);
    
    const mainMatches = prediction.numbers.filter(n => targetDraw.numbers.includes(n)).length;
    const euroMatches = prediction.euroNumbers.filter(n => targetDraw.euroNumbers.includes(n)).length;
    
    const score = mainMatches * 10 + euroMatches * 5;
    
    results.push({
      drawDate: targetDraw.drawDate,
      mainMatches,
      euroMatches,
      score
    });
  }
  
  return results;
}

// Analyze results
function analyzeResults(results, config) {
  const totalTests = results.length;
  const avgMainMatches = results.reduce((sum, r) => sum + r.mainMatches, 0) / totalTests;
  const avgEuroMatches = results.reduce((sum, r) => sum + r.euroMatches, 0) / totalTests;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests;
  
  const perfect5 = results.filter(r => r.mainMatches === 5).length;
  const fourOrMore = results.filter(r => r.mainMatches >= 4).length;
  const threeOrMore = results.filter(r => r.mainMatches >= 3).length;
  const twoOrMore = results.filter(r => r.mainMatches >= 2).length;
  const perfectEuro = results.filter(r => r.euroMatches === 2).length;
  const oneEuro = results.filter(r => r.euroMatches >= 1).length;
  
  return {
    config,
    totalTests,
    avgMainMatches,
    avgEuroMatches,
    avgScore,
    perfect5,
    perfect5Pct: (perfect5 / totalTests * 100).toFixed(2),
    fourOrMore,
    fourOrMorePct: (fourOrMore / totalTests * 100).toFixed(2),
    threeOrMore,
    threeOrMorePct: (threeOrMore / totalTests * 100).toFixed(2),
    twoOrMore,
    twoOrMorePct: (twoOrMore / totalTests * 100).toFixed(2),
    perfectEuro,
    perfectEuroPct: (perfectEuro / totalTests * 100).toFixed(2),
    oneEuro,
    oneEuroPct: (oneEuro / totalTests * 100).toFixed(2)
  };
}

// Run all tests
console.log('\nRunning backtests for all configurations...\n');

const allResults = [];

testConfigurations.forEach((config, idx) => {
  console.log(`Testing configuration ${idx + 1}/${testConfigurations.length}...`);
  const backtestResults = runBacktest(config);
  const analysis = analyzeResults(backtestResults, config);
  allResults.push(analysis);
});

// Sort by average score
allResults.sort((a, b) => b.avgScore - a.avgScore);

console.log('\n' + '='.repeat(80));
console.log('RESULTS SUMMARY (Sorted by Average Score)');
console.log('='.repeat(80));

allResults.forEach((result, idx) => {
  console.log(`\n${idx + 1}. Configuration:`);
  console.log(`   Min Draws: ${result.config.minDraws}, Short Term: ${result.config.shortTerm}, Medium Term: ${result.config.mediumTerm}, Weights: ${result.config.weights}`);
  console.log(`   Total Tests: ${result.totalTests}`);
  console.log(`   Avg Main Matches: ${result.avgMainMatches.toFixed(3)} / 5 (${(result.avgMainMatches / 5 * 100).toFixed(1)}%)`);
  console.log(`   Avg Euro Matches: ${result.avgEuroMatches.toFixed(3)} / 2 (${(result.avgEuroMatches / 2 * 100).toFixed(1)}%)`);
  console.log(`   Avg Score: ${result.avgScore.toFixed(2)}`);
  console.log(`   5/5 Main: ${result.perfect5} (${result.perfect5Pct}%)`);
  console.log(`   4+ Main: ${result.fourOrMore} (${result.fourOrMorePct}%)`);
  console.log(`   3+ Main: ${result.threeOrMore} (${result.threeOrMorePct}%)`);
  console.log(`   2+ Main: ${result.twoOrMore} (${result.twoOrMorePct}%)`);
  console.log(`   2/2 Euro: ${result.perfectEuro} (${result.perfectEuroPct}%)`);
  console.log(`   1+ Euro: ${result.oneEuro} (${result.oneEuroPct}%)`);
});

// Best configuration
const bestConfig = allResults[0];
console.log('\n' + '='.repeat(80));
console.log('🏆 BEST CONFIGURATION FOUND');
console.log('='.repeat(80));
console.log(`Min Draws: ${bestConfig.config.minDraws}`);
console.log(`Short Term Window: ${bestConfig.config.shortTerm}`);
console.log(`Medium Term Window: ${bestConfig.config.mediumTerm}`);
console.log(`Weight Profile: ${bestConfig.config.weights}`);
console.log(`\nPerformance:`);
console.log(`  Avg Main Matches: ${bestConfig.avgMainMatches.toFixed(3)} / 5`);
console.log(`  Avg Euro Matches: ${bestConfig.avgEuroMatches.toFixed(3)} / 2`);
console.log(`  Avg Score: ${bestConfig.avgScore.toFixed(2)}`);
console.log(`  3+ Main Matches: ${bestConfig.threeOrMorePct}% of tests`);
console.log('='.repeat(80));

// Generate prediction with best configuration
console.log('\n🔮 GENERATING PREDICTION WITH BEST CONFIGURATION...\n');
const finalPrediction = predictNumbers(data, bestConfig.config);
console.log('NEXT DRAW PREDICTION:');
console.log(`Main Numbers: ${finalPrediction.numbers.join(', ')}`);
console.log(`Euro Numbers: ${finalPrediction.euroNumbers.join(', ')}`);
console.log('\n' + '='.repeat(80));

// Save optimal configuration
const optimalConfig = {
  minDraws: bestConfig.config.minDraws,
  shortTerm: bestConfig.config.shortTerm,
  mediumTerm: bestConfig.config.mediumTerm,
  weights: bestConfig.config.weights,
  weightValues: weightConfigs[bestConfig.config.weights],
  performance: {
    avgMainMatches: bestConfig.avgMainMatches,
    avgEuroMatches: bestConfig.avgEuroMatches,
    avgScore: bestConfig.avgScore,
    threeOrMorePct: bestConfig.threeOrMorePct
  },
  nextPrediction: finalPrediction
};

fs.writeFileSync('./optimal-config.json', JSON.stringify(optimalConfig, null, 2));
console.log('\n✅ Optimal configuration saved to optimal-config.json');
console.log('='.repeat(80));
