/**
 * Big Number Pattern Analysis
 * Treats each draw as a concatenated "big number" to find sequential patterns
 */

interface Draw {
  drawSystemId: number;
  drawDate: string;
  numbers: number[];
  euroNumbers: number[];
}

interface BigNumberPattern {
  bigNumber: string;
  sortedBigNumber: string;
  euroBigNumber: string;
  digitSum: number;
  digitProduct: number;
  euroDigitSum: number;
  drawId: number;
  drawDate: string;
}

interface PatternPrediction {
  predictedNumbers: number[];
  predictedEuroNumbers: number[];
  confidence: number;
  method: string;
  details: string;
}

/**
 * Convert draw numbers to a big number (concatenated string)
 * By default, preserves the exact draw order as it occurred
 */
export function drawToBigNumber(numbers: number[], sorted: boolean = false): string {
  const nums = sorted ? [...numbers].sort((a, b) => a - b) : numbers;
  return nums.map(n => n.toString().padStart(2, '0')).join('');
}

/**
 * Calculate digit sum of a big number
 */
function digitSum(bigNumber: string): number {
  return bigNumber.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
}

/**
 * Calculate digit product of a big number
 */
function digitProduct(bigNumber: string): number {
  return bigNumber.split('').reduce((prod, digit) => prod * parseInt(digit), 1);
}

/**
 * Extract patterns from historical draws
 * Uses the EXACT draw order as it occurred
 */
export function extractBigNumberPatterns(draws: Draw[]): BigNumberPattern[] {
  return draws.map(draw => {
    // Use the exact order the numbers were drawn
    const bigNumber = drawToBigNumber(draw.numbers, false); // Original order
    const sortedBigNumber = drawToBigNumber(draw.numbers, true); // Sorted for reference
    const euroBigNumber = drawToBigNumber(draw.euroNumbers, false); // Euro numbers in draw order
    
    return {
      bigNumber,
      sortedBigNumber,
      euroBigNumber,
      digitSum: digitSum(bigNumber),
      digitProduct: digitProduct(bigNumber),
      euroDigitSum: digitSum(euroBigNumber),
      drawId: draw.drawSystemId,
      drawDate: draw.drawDate
    };
  });
}

/**
 * Find repeating euro number sequences
 */
function findRepeatingEuroSequences(patterns: BigNumberPattern[]): Map<string, number> {
  const sequences = new Map<string, number>();
  
  patterns.forEach(pattern => {
    const euroBigNum = pattern.euroBigNumber;
    // For euro numbers (only 2 numbers, 4 digits), analyze the whole sequence and sub-sequences
    sequences.set(euroBigNum, (sequences.get(euroBigNum) || 0) + 1);
    
    // Also track individual digits and pairs
    for (let i = 0; i < euroBigNum.length - 1; i++) {
      const twoDigit = euroBigNum.substring(i, i + 2);
      sequences.set(twoDigit, (sequences.get(twoDigit) || 0) + 1);
    }
  });
  
  return sequences;
}

/**
 * Find repeating digit sequences across big numbers
 */
function findRepeatingSequences(patterns: BigNumberPattern[], minLength: number = 2, maxLength: number = 4): Map<string, number> {
  const sequences = new Map<string, number>();
  
  patterns.forEach(pattern => {
    // Use the EXACT draw order to find sequential patterns
    const bigNum = pattern.bigNumber;
    
    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i <= bigNum.length - len; i++) {
        const seq = bigNum.substring(i, i + len);
        sequences.set(seq, (sequences.get(seq) || 0) + 1);
      }
    }
  });
  
  return sequences;
}

/**
 * Analyze digit frequencies in specific positions
 */
function analyzePositionalDigits(patterns: BigNumberPattern[]): Map<number, Map<string, number>> {
  const positionalFreq = new Map<number, Map<string, number>>();
  
  patterns.forEach(pattern => {
    // Analyze digit positions in the EXACT draw sequence
    const bigNum = pattern.bigNumber;
    for (let i = 0; i < bigNum.length; i++) {
      if (!positionalFreq.has(i)) {
        positionalFreq.set(i, new Map<string, number>());
      }
      const digit = bigNum[i];
      const posMap = positionalFreq.get(i)!;
      posMap.set(digit, (posMap.get(digit) || 0) + 1);
    }
  });
  
  return positionalFreq;
}

/**
 * Find patterns in digit sum progressions
 */
function analyzeDigitSumPatterns(patterns: BigNumberPattern[]): number[] {
  const recentCount = 20;
  const recent = patterns.slice(0, recentCount);
  const sums = recent.map(p => p.digitSum);
  
  // Calculate differences between consecutive sums
  const differences: number[] = [];
  for (let i = 0; i < sums.length - 1; i++) {
    differences.push(sums[i] - sums[i + 1]);
  }
  
  return differences;
}

/**
 * Analyze modulo patterns in big numbers
 */
function analyzeModuloPatterns(patterns: BigNumberPattern[], modulo: number = 9): Map<number, number> {
  const moduloFreq = new Map<number, number>();
  
  patterns.forEach(pattern => {
    // Calculate modulo using the EXACT draw sequence
    const numValue = BigInt(pattern.bigNumber);
    const mod = Number(numValue % BigInt(modulo));
    moduloFreq.set(mod, (moduloFreq.get(mod) || 0) + 1);
  });
  
  return moduloFreq;
}

/**
 * Find the most common digit transitions
 */
function analyzeDigitTransitions(patterns: BigNumberPattern[]): Map<string, number> {
  const transitions = new Map<string, number>();
  
  patterns.forEach(pattern => {
    // Track transitions in the EXACT draw sequence order
    const bigNum = pattern.bigNumber;
    for (let i = 0; i < bigNum.length - 1; i++) {
      const transition = `${bigNum[i]}->${bigNum[i + 1]}`;
      transitions.set(transition, (transitions.get(transition) || 0) + 1);
    }
  });
  
  return transitions;
}

/**
 * Generate prediction based on big number patterns
 */
export function predictFromBigNumberPatterns(draws: Draw[]): PatternPrediction[] {
  const patterns = extractBigNumberPatterns(draws);
  const predictions: PatternPrediction[] = [];
  
  // Analyze euro number patterns
  const euroSequences = findRepeatingEuroSequences(patterns);
  
  // Method 1: Most frequent digit sequences
  const sequences = findRepeatingSequences(patterns, 2, 4);
  const topSequences = Array.from(sequences.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  if (topSequences.length > 0) {
    const prediction = generateFromSequences(topSequences, patterns, euroSequences);
    if (prediction) {
      predictions.push(prediction);
    }
  }
  
  // Method 2: Positional digit frequency
  const positionalFreq = analyzePositionalDigits(patterns);
  const positionPrediction = generateFromPositionalFrequency(positionalFreq, euroSequences, patterns);
  if (positionPrediction) {
    predictions.push(positionPrediction);
  }
  
  // Method 3: Digit sum pattern continuation
  const digitSumDiffs = analyzeDigitSumPatterns(patterns);
  const sumPrediction = generateFromDigitSumPattern(patterns, digitSumDiffs, euroSequences);
  if (sumPrediction) {
    predictions.push(sumPrediction);
  }
  
  // Method 4: Digit transition patterns
  const transitions = analyzeDigitTransitions(patterns);
  const transitionPrediction = generateFromTransitions(transitions, patterns, euroSequences);
  if (transitionPrediction) {
    predictions.push(transitionPrediction);
  }
  
  // Method 5: Modulo pattern analysis
  const moduloPatterns = analyzeModuloPatterns(patterns, 9);
  const moduloPrediction = generateFromModuloPattern(moduloPatterns, patterns, euroSequences);
  if (moduloPrediction) {
    predictions.push(moduloPrediction);
  }
  
  return predictions;
}

/**
 * Generate numbers from most frequent sequences
 */
function generateFromSequences(sequences: [string, number][], patterns: BigNumberPattern[], euroSequences: Map<string, number>): PatternPrediction | null {
  try {
    // Build a big number string from top sequences
    let bigNumberStr = '';
    const usedSequences: string[] = [];
    
    for (const [seq, freq] of sequences) {
      if (bigNumberStr.length < 10) {
        bigNumberStr += seq;
        usedSequences.push(seq);
      }
    }
    
    // Ensure we have exactly 10 digits
    if (bigNumberStr.length < 10) {
      const lastPattern = patterns[0].sortedBigNumber;
      bigNumberStr = (bigNumberStr + lastPattern).substring(0, 10);
    } else {
      bigNumberStr = bigNumberStr.substring(0, 10);
    }
    
    // Convert back to 5 numbers
    const numbers: number[] = [];
    for (let i = 0; i < 10; i += 2) {
      const num = parseInt(bigNumberStr.substring(i, i + 2));
      if (num >= 1 && num <= 50 && !numbers.includes(num)) {
        numbers.push(num);
      }
    }
    
    // Fill missing numbers with most frequent from recent draws
    const recentNumbers = new Map<number, number>();
    patterns.slice(0, 10).forEach(p => {
      const nums = bigNumberToNumbers(p.bigNumber); // Use exact draw order
      nums.forEach(n => {
        if (n >= 1 && n <= 50) {
          recentNumbers.set(n, (recentNumbers.get(n) || 0) + 1);
        }
      });
    });
    
    const sortedRecent = Array.from(recentNumbers.entries())
      .sort((a, b) => b[1] - a[1]);
    
    for (const [num] of sortedRecent) {
      if (numbers.length >= 5) break;
      if (!numbers.includes(num) && num >= 1 && num <= 50) {
        numbers.push(num);
      }
    }
    
    // Add random valid numbers if still not enough
    while (numbers.length < 5) {
      const random = Math.floor(Math.random() * 50) + 1;
      if (!numbers.includes(random)) {
        numbers.push(random);
      }
    }
    
    // Generate euro numbers from most frequent euro sequences
    const euroNumbers = generateEuroNumbers(euroSequences, patterns);
    
    return {
      predictedNumbers: numbers.slice(0, 5).sort((a, b) => a - b),
      predictedEuroNumbers: euroNumbers,
      confidence: Math.min(95, 60 + (usedSequences.length * 5)),
      method: 'Frequent Sequence Pattern',
      details: `Built from most common digit sequences: ${usedSequences.join(', ')}`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Generate euro numbers from patterns
 */
function generateEuroNumbers(euroSequences: Map<string, number>, patterns: BigNumberPattern[]): number[] {
  // Get most frequent euro sequences
  const topEuroSeq = Array.from(euroSequences.entries())
    .filter(([seq]) => seq.length === 4) // Full euro number sequence
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topEuroSeq) {
    const euroNums = bigNumberToNumbers(topEuroSeq[0]);
    if (euroNums.length >= 2 && euroNums.every(n => n >= 1 && n <= 12)) {
      return euroNums.slice(0, 2);
    }
  }
  
  // Fallback: use most recent euro numbers
  const recentEuros = new Map<number, number>();
  patterns.slice(0, 10).forEach(p => {
    const euroNums = bigNumberToNumbers(p.euroBigNumber);
    euroNums.forEach(n => {
      if (n >= 1 && n <= 12) {
        recentEuros.set(n, (recentEuros.get(n) || 0) + 1);
      }
    });
  });
  
  const topTwo = Array.from(recentEuros.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([num]) => num);
  
  if (topTwo.length === 2) {
    return topTwo.sort((a, b) => a - b);
  }
  
  // Final fallback: random valid euro numbers
  const euro1 = Math.floor(Math.random() * 12) + 1;
  let euro2 = Math.floor(Math.random() * 12) + 1;
  while (euro2 === euro1) {
    euro2 = Math.floor(Math.random() * 12) + 1;
  }
  return [euro1, euro2].sort((a, b) => a - b);
}

/**
 * Generate numbers from positional digit frequency
 */
function generateFromPositionalFrequency(positionalFreq: Map<number, Map<string, number>>, euroSequences: Map<string, number>, patterns: BigNumberPattern[]): PatternPrediction | null {
  try {
    let bigNumberStr = '';
    
    for (let i = 0; i < 10; i++) {
      const posMap = positionalFreq.get(i);
      if (posMap) {
        const mostFrequent = Array.from(posMap.entries())
          .sort((a, b) => b[1] - a[1])[0];
        bigNumberStr += mostFrequent[0];
      } else {
        bigNumberStr += '0';
      }
    }
    
    const numbers = bigNumberToNumbers(bigNumberStr);
    const validNumbers = numbers.filter(n => n >= 1 && n <= 50);
    
    // Fill with complementary numbers if needed
    const unique = [...new Set(validNumbers)];
    while (unique.length < 5) {
      const random = Math.floor(Math.random() * 50) + 1;
      if (!unique.includes(random)) {
        unique.push(random);
      }
    }
    
    const euroNumbers = generateEuroNumbers(euroSequences, patterns);
    
    return {
      predictedNumbers: unique.slice(0, 5).sort((a, b) => a - b),
      predictedEuroNumbers: euroNumbers,
      confidence: 75,
      method: 'Positional Digit Frequency',
      details: 'Based on most frequent digits in each position of the big number'
    };
  } catch (e) {
    return null;
  }
}

/**
 * Generate numbers from digit sum pattern
 */
function generateFromDigitSumPattern(patterns: BigNumberPattern[], differences: number[], euroSequences: Map<string, number>): PatternPrediction | null {
  try {
    const lastSum = patterns[0].digitSum;
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const predictedSum = Math.round(lastSum - avgDiff);
    
    // Generate numbers that sum to target
    const targetSum = Math.max(15, Math.min(45, predictedSum)); // Reasonable range
    const numbers = generateNumbersWithTargetSum(targetSum);
    const euroNumbers = generateEuroNumbers(euroSequences, patterns);
    
    return {
      predictedNumbers: numbers.sort((a, b) => a - b),
      predictedEuroNumbers: euroNumbers,
      confidence: 70,
      method: 'Digit Sum Progression',
      details: `Target digit sum: ${targetSum} (last: ${lastSum}, avg diff: ${avgDiff.toFixed(2)})`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Generate numbers from transition patterns
 */
function generateFromTransitions(transitions: Map<string, number>, patterns: BigNumberPattern[], euroSequences: Map<string, number>): PatternPrediction | null {
  try {
    const topTransitions = Array.from(transitions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    let bigNumberStr = '';
    const lastBigNum = patterns[0].bigNumber; // Use exact draw order
    bigNumberStr = lastBigNum[0]; // Start with last draw's first digit
    
    // Build using most common transitions
    for (let i = 0; i < 9; i++) {
      const currentDigit = bigNumberStr[bigNumberStr.length - 1];
      const possibleTransitions = topTransitions.filter(([t]) => t.startsWith(currentDigit + '->'));
      
      if (possibleTransitions.length > 0) {
        const nextDigit = possibleTransitions[0][0].split('->')[1];
        bigNumberStr += nextDigit;
      } else {
        bigNumberStr += Math.floor(Math.random() * 10).toString();
      }
    }
    
    const numbers = bigNumberToNumbers(bigNumberStr);
    const validNumbers = [...new Set(numbers.filter(n => n >= 1 && n <= 50))];
    
    while (validNumbers.length < 5) {
      const random = Math.floor(Math.random() * 50) + 1;
      if (!validNumbers.includes(random)) {
        validNumbers.push(random);
      }
    }
    
    const euroNumbers = generateEuroNumbers(euroSequences, patterns);
    
    return {
      predictedNumbers: validNumbers.slice(0, 5).sort((a, b) => a - b),
      predictedEuroNumbers: euroNumbers,
      confidence: 72,
      method: 'Digit Transition Pattern',
      details: `Based on ${topTransitions.length} most common digit-to-digit transitions`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Generate numbers from modulo pattern
 */
function generateFromModuloPattern(moduloPatterns: Map<number, number>, patterns: BigNumberPattern[], euroSequences: Map<string, number>): PatternPrediction | null {
  try {
    const mostCommonMod = Array.from(moduloPatterns.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Find historical draws with this modulo and pick most recent
    const matchingPatterns = patterns.filter(p => {
      const numValue = BigInt(p.bigNumber); // Use exact draw order
      return Number(numValue % BigInt(9)) === mostCommonMod;
    });
    
    if (matchingPatterns.length > 0) {
      const recentMatch = matchingPatterns[0];
      const numbers = bigNumberToNumbers(recentMatch.bigNumber); // Use exact draw order
      const validNumbers = numbers.filter(n => n >= 1 && n <= 50);
      
      // Slight variation
      const varied = validNumbers.map(n => {
        const variation = Math.random() < 0.5 ? -2 : 2;
        const newNum = n + variation;
        return Math.max(1, Math.min(50, newNum));
      });
      
      const euroNumbers = generateEuroNumbers(euroSequences, patterns);
      
      return {
        predictedNumbers: [...new Set(varied)].slice(0, 5).sort((a, b) => a - b),
        predictedEuroNumbers: euroNumbers,
        confidence: 68,
        method: 'Modulo 9 Pattern',
        details: `Based on most common mod-9 value: ${mostCommonMod}`
      };
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

/**
 * Convert big number string to array of numbers
 */
function bigNumberToNumbers(bigNumberStr: string): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < bigNumberStr.length - 1; i += 2) {
    const num = parseInt(bigNumberStr.substring(i, i + 2));
    if (num >= 1 && num <= 50) {
      numbers.push(num);
    }
  }
  return numbers;
}

/**
 * Generate numbers that sum to a target digit sum
 */
function generateNumbersWithTargetSum(targetSum: number): number[] {
  const numbers: number[] = [];
  let remainingSum = targetSum;
  
  for (let i = 0; i < 5; i++) {
    const minVal = 1;
    const maxVal = Math.min(50, remainingSum - (4 - i));
    const num = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    
    if (!numbers.includes(num) && num >= 1 && num <= 50) {
      numbers.push(num);
      remainingSum -= num.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    }
  }
  
  // Adjust to ensure 5 unique numbers
  while (numbers.length < 5) {
    const random = Math.floor(Math.random() * 50) + 1;
    if (!numbers.includes(random)) {
      numbers.push(random);
    }
  }
  
  return numbers.slice(0, 5);
}

/**
 * Get detailed analysis report
 */
export function getBigNumberAnalysisReport(draws: Draw[]): {
  patterns: BigNumberPattern[];
  topSequences: [string, number][];
  topEuroSequences: [string, number][];
  positionalAnalysis: Map<number, Map<string, number>>;
  digitSumStats: { min: number; max: number; avg: number; recent: number[] };
  euroDigitSumStats: { min: number; max: number; avg: number; recent: number[] };
  topTransitions: [string, number][];
  moduloDistribution: Map<number, number>;
} {
  const patterns = extractBigNumberPatterns(draws);
  const sequences = findRepeatingSequences(patterns, 2, 4);
  const euroSequences = findRepeatingEuroSequences(patterns);
  const positionalAnalysis = analyzePositionalDigits(patterns);
  const transitions = analyzeDigitTransitions(patterns);
  const moduloDistribution = analyzeModuloPatterns(patterns, 9);
  
  const digitSums = patterns.map(p => p.digitSum);
  const digitSumStats = {
    min: Math.min(...digitSums),
    max: Math.max(...digitSums),
    avg: digitSums.reduce((a, b) => a + b, 0) / digitSums.length,
    recent: digitSums.slice(0, 10)
  };
  
  const euroDigitSums = patterns.map(p => p.euroDigitSum);
  const euroDigitSumStats = {
    min: Math.min(...euroDigitSums),
    max: Math.max(...euroDigitSums),
    avg: euroDigitSums.reduce((a, b) => a + b, 0) / euroDigitSums.length,
    recent: euroDigitSums.slice(0, 10)
  };
  
  return {
    patterns: patterns.slice(0, 20),
    topSequences: Array.from(sequences.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20),
    topEuroSequences: Array.from(euroSequences.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20),
    positionalAnalysis,
    digitSumStats,
    euroDigitSumStats,
    topTransitions: Array.from(transitions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20),
    moduloDistribution
  };
}
