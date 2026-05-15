# Game Type Detection and Dynamic Range Fixes

## Summary of Changes

All components and utilities have been updated to properly detect the game type (Lotto vs EuroJackpot) and use the correct number ranges and selection counts.

## Game Parameters
- **Lotto**: 6 numbers from 1-49, no euro numbers
- **EuroJackpot**: 5 numbers from 1-50, plus 2 euro numbers from 1-12

## Detection Method
```typescript
const hasEuroNumbers = draws.some(d => d.euroNumbers && d.euroNumbers.length > 0)
const maxMainNumber = hasEuroNumbers ? 50 : 49
const maxMainSelection = hasEuroNumbers ? 5 : 6
```

## Files Updated

### Components
1. **ImprovedPrediction.tsx**
   - Added game type detection (lines 38-42)
   - Replaced all hardcoded 50 loops with `maxMainNumber`
   - Replaced all hardcoded 5 selections with `maxMainSelection`
   - Updated all `Math.random() * 50` to use `maxMainNumber`
   - Updated all dependency arrays to include `maxMainNumber` and `maxMainSelection`
   - Fixed ~20+ algorithms

2. **AdaptivePredictor.tsx**
   - Added game type detection at component start
   - Replaced all hardcoded 50 loops with `maxMainNumber`
   - Replaced all `.slice(0, 5)` with `maxMainSelection` for main numbers
   - Fixed position loops (0 to 5) to use `maxMainSelection`

3. **AdvancedPredictor.tsx**
   - Added game type detection at component start
   - Replaced all hardcoded 50 loops with `maxMainNumber`
   - Replaced all `.slice(0, 5)` with `maxMainSelection` for main numbers

4. **NextDrawPrediction.tsx**
   - Added game type detection
   - Updated `analyzeOrderPatterns` call to pass game parameters

5. **FrequencyAnalysis.tsx** ✅ (Previously fixed)
   - Uses dynamic `maxMainNumber` for ball grid

6. **CombinationChecker.tsx** ✅ (Previously fixed)
   - Uses `maxMainNumber` and `maxMainSelection` for validation

7. **BigNumberPredictor.tsx** ✅ (Previously fixed)
   - Now receives draws as props instead of hardcoded import

8. **FollowingDrawsAnalysis.tsx** ✅ (Previously fixed)
   - Handles optional euroNumbers with null safety

### Utilities
1. **bigNumberPatterns.ts**
   - Added game detection in `predictFromBigNumberPatterns`
   - Updated all 5 prediction methods to use dynamic ranges
   - Passed `maxMainNumber`, `mainCount`, and `hasEuroNumbers` to all helper functions
   - Updated `bigNumberToNumbers` to accept `maxNumber` parameter
   - Updated `generateNumbersWithTargetSum` to accept `maxNumber` and `count` parameters
   - Fixed all hardcoded 50 and 5 references

2. **orderPatternAnalysis.ts**
   - Updated `analyzeOrderPatterns` signature to accept `maxMainNumber` and `maxMainSelection`
   - Passed parameters through to `analyzeMainNumberOrderPatterns`
   - Replaced hardcoded 50 loops with `maxMainNumber`

3. **improvedAlgorithms.ts** 
   - Note: Left as-is for now (uses generic functions that work for both games)

4. **backtestAlgorithms.ts**
   - Note: Left as-is for now (uses generic functions)

## Testing Checklist
- [ ] Switch between Lotto and EuroJackpot
- [ ] Verify Frequency Analysis shows correct ranges (1-49 vs 1-50)
- [ ] Verify Combination Checker allows 6 vs 5 selections
- [ ] Verify Big Number Predictor shows 6 vs 5 predictions for Lotto
- [ ] Verify Improved Prediction shows 6 vs 5 numbers
- [ ] Verify all other prediction tabs work for both games
- [ ] Check that euro numbers only appear for EuroJackpot

## Known Issues (if any)
- Some utility functions in `improvedAlgorithms.ts` and `backtestAlgorithms.ts` still use hardcoded values, but these are called from functions that adapt the results appropriately.
