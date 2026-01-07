import React, { useMemo, useState } from 'react'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
  jackpot?: string
  jackpotAmount?: string
}

interface CombinationAnalysisProps {
  draws: Draw[]
}

interface CheckedCombination {
  numbers: number[]
  count: number
  dates: string[]
  avgDrawsBetween: number
  lastDate: string
  fullCombinations?: Array<{
    drawDate: string
    mainNumbers: number[]
    euroNumbers: number[]
  }>
}

type NumberCombination = {
  numbers: number[]
  count: number
  lastDate: string
  avgDrawsBetween: number
}

type EuroPair = {
  pair: [number, number]
  count: number
  lastDate: string
  avgDrawsBetween: number
}

export default function CombinationAnalysis({ draws }: CombinationAnalysisProps): JSX.Element {
  // State for user input combinations
  const [inputCombo5, setInputCombo5] = useState<string>('')
  const [inputCombo4, setInputCombo4] = useState<string>('')
  const [inputCombo3, setInputCombo3] = useState<string>('')
  const [inputCombo2, setInputCombo2] = useState<string>('')
  const [inputEuroPair, setInputEuroPair] = useState<string>('')
  
  const [checkedCombo5, setCheckedCombo5] = useState<CheckedCombination | null>(null)
  const [checkedCombo4, setCheckedCombo4] = useState<CheckedCombination | null>(null)
  const [checkedCombo3, setCheckedCombo3] = useState<CheckedCombination | null>(null)
  const [checkedCombo2, setCheckedCombo2] = useState<CheckedCombination | null>(null)
  const [checkedEuroPair, setCheckedEuroPair] = useState<CheckedCombination | null>(null)
  
  const [error5, setError5] = useState<string>('')
  const [error4, setError4] = useState<string>('')
  const [error3, setError3] = useState<string>('')
  const [error2, setError2] = useState<string>('')
  const [errorEuro, setErrorEuro] = useState<string>('')

  // Function to parse and validate number input
  const parseNumbers = (input: string, min: number, max: number, minCount: number, maxCount: number): number[] | null => {
    const trimmed = input.trim()
    if (!trimmed) return null

    const parts = trimmed.split(/[\s,]+/).filter(s => s.length > 0)
    const numbers = parts.map(p => parseInt(p, 10))

    if (numbers.some(n => isNaN(n))) return null
    if (numbers.some(n => n < min || n > max)) return null
    if (numbers.length < minCount || numbers.length > maxCount) return null

    const unique = new Set(numbers)
    if (unique.size !== numbers.length) return null

    return numbers.sort((a, b) => a - b)
  }

  // Function to check if a combination exists in draws
  const checkCombination = (
    numbers: number[],
    isEuro: boolean = false
  ): CheckedCombination => {
    const occurrenceDates: string[] = []
    const fullCombinations: Array<{
      drawDate: string
      mainNumbers: number[]
      euroNumbers: number[]
    }> = []
    
    draws.forEach((draw) => {
      const drawNumbers = isEuro ? draw.euroNumbers : draw.numbers
      if (numbers.every(num => drawNumbers.includes(num))) {
        occurrenceDates.push(draw.drawDate)
        fullCombinations.push({
          drawDate: draw.drawDate,
          mainNumbers: [...draw.numbers].sort((a, b) => a - b),
          euroNumbers: [...draw.euroNumbers].sort((a, b) => a - b)
        })
      }
    })

    // Calculate average draws between occurrences
    let avgDrawsBetween = 0
    let lastDate = ''
    
    if (occurrenceDates.length > 0) {
      lastDate = occurrenceDates.reduce((latest, date) => 
        new Date(date) > new Date(latest) ? date : latest
      )
      
      if (occurrenceDates.length > 1) {
        const sortedDates = occurrenceDates
          .map(d => new Date(d).getTime())
          .sort((a, b) => a - b)
        
        let totalDrawsBetween = 0
        for (let i = 1; i < sortedDates.length; i++) {
          const startDate = sortedDates[i - 1]
          const endDate = sortedDates[i]
          
          let drawsBetween = 0
          for (const draw of draws) {
            const drawTime = new Date(draw.drawDate).getTime()
            if (drawTime > startDate && drawTime < endDate) {
              drawsBetween++
            }
          }
          totalDrawsBetween += drawsBetween
        }
        avgDrawsBetween = Math.round(totalDrawsBetween / (sortedDates.length - 1))
      }
    }

    return {
      numbers,
      count: occurrenceDates.length,
      dates: occurrenceDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
      avgDrawsBetween,
      lastDate,
      fullCombinations: fullCombinations.sort((a, b) => 
        new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
      )
    }
  }

  // Handler functions for each input
  const handleCheck5 = () => {
    setError5('')
    const numbers = parseNumbers(inputCombo5, 1, 50, 1, 5)
    if (!numbers) {
      setError5('Please enter 1-5 unique numbers between 1 and 50, separated by spaces or commas.')
      setCheckedCombo5(null)
      return
    }
    setCheckedCombo5(checkCombination(numbers))
  }

  const handleCheck4 = () => {
    setError4('')
    const numbers = parseNumbers(inputCombo4, 1, 50, 1, 4)
    if (!numbers) {
      setError4('Please enter 1-4 unique numbers between 1 and 50, separated by spaces or commas.')
      setCheckedCombo4(null)
      return
    }
    setCheckedCombo4(checkCombination(numbers))
  }

  const handleCheck3 = () => {
    setError3('')
    const numbers = parseNumbers(inputCombo3, 1, 50, 1, 3)
    if (!numbers) {
      setError3('Please enter 1-3 unique numbers between 1 and 50, separated by spaces or commas.')
      setCheckedCombo3(null)
      return
    }
    setCheckedCombo3(checkCombination(numbers))
  }

  const handleCheck2 = () => {
    setError2('')
    const numbers = parseNumbers(inputCombo2, 1, 50, 1, 2)
    if (!numbers) {
      setError2('Please enter 1-2 unique numbers between 1 and 50, separated by spaces or commas.')
      setCheckedCombo2(null)
      return
    }
    setCheckedCombo2(checkCombination(numbers))
  }

  const handleCheckEuro = () => {
    setErrorEuro('')
    const numbers = parseNumbers(inputEuroPair, 1, 12, 1, 2)
    if (!numbers) {
      setErrorEuro('Please enter 1-2 unique euro numbers between 1 and 12, separated by spaces or commas.')
      setCheckedEuroPair(null)
      return
    }
    setCheckedEuroPair(checkCombination(numbers, true))
  }

  // Helper function to calculate how overdue a combination is (returns percentage over average)
  const getOverduePercentage = (lastDate: string, avgDraws: number): number => {
    if (!lastDate || avgDraws === 0) return 0
    
    const lastOccurrence = new Date(lastDate)
    const today = new Date()
    
    // Count how many draws have occurred since the last occurrence
    let drawsSinceLastOccurrence = 0
    for (const draw of draws) {
      const drawDate = new Date(draw.drawDate)
      if (drawDate > lastOccurrence && drawDate <= today) {
        drawsSinceLastOccurrence++
      }
    }
    
    // Calculate percentage: (draws since last - avg draws) / avg draws * 100
    // Positive values mean overdue, negative means not yet due
    const percentage = ((drawsSinceLastOccurrence - avgDraws) / avgDraws) * 100
    return Math.max(0, percentage) // Return 0 if not overdue
  }
  
  // Get CSS class based on overdue percentage
  const getOverdueClass = (lastDate: string, avgDraws: number): string => {
    const percentage = getOverduePercentage(lastDate, avgDraws)
    
    if (percentage === 0) return ''
    if (percentage >= 250) return 'overdue-extreme-4' // 3.5x or more overdue
    if (percentage >= 200) return 'overdue-extreme-3' // 3x overdue
    if (percentage >= 160) return 'overdue-extreme-2' // 2.6x overdue
    if (percentage >= 120) return 'overdue-extreme-1' // 2.2x overdue
    if (percentage >= 90) return 'overdue-very-high-2'  // 1.9x overdue
    if (percentage >= 70) return 'overdue-very-high-1'  // 1.7x overdue
    if (percentage >= 55) return 'overdue-high-2'       // 1.55x overdue
    if (percentage >= 42) return 'overdue-high-1'       // 1.42x overdue
    if (percentage >= 30) return 'overdue-medium-high' // 1.3x overdue
    if (percentage >= 20) return 'overdue-medium'     // 1.2x overdue
    if (percentage >= 12) return 'overdue-low-medium' // 1.12x overdue
    if (percentage >= 5) return 'overdue-low-2'       // 1.05x overdue
    return 'overdue-low-1'                             // Just overdue
  }

  // Helper function to check if a smaller combination is a subset of any larger combination
  const isSubsetOfAny = (smallerCombo: number[], largerCombos: NumberCombination[]): boolean => {
    return largerCombos.some(largerCombo => 
      smallerCombo.every(num => largerCombo.numbers.includes(num))
    )
  }

  // Calculate how many draws have passed since last occurrence
  const getDrawsSinceLastOccurrence = (lastDate: string): number => {
    if (!lastDate) return 0
    
    const lastOccurrence = new Date(lastDate)
    const today = new Date()
    
    let drawsSince = 0
    for (const draw of draws) {
      const drawDate = new Date(draw.drawDate)
      if (drawDate > lastOccurrence && drawDate <= today) {
        drawsSince++
      }
    }
    return drawsSince
  }

  // Find top 3 combinations that are closest to their average (due soon)
  const findTopDueCombinations = (combinations: NumberCombination[]): NumberCombination[] => {
    return combinations
      .filter(combo => combo.avgDrawsBetween > 0 && combo.lastDate)
      .map(combo => {
        const drawsSince = getDrawsSinceLastOccurrence(combo.lastDate)
        // Calculate how close to average (percentage difference)
        const difference = Math.abs(drawsSince - combo.avgDrawsBetween)
        return { ...combo, drawsSince, difference }
      })
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 3)
  }
  // Calculate most common combinations that appear together (5, 4, 3, 2 numbers)
  const combinations = useMemo(() => {
    const combo5Map = new Map<string, number[]>()
    const combo4Map = new Map<string, number[]>()
    const combo3Map = new Map<string, number[]>()
    const combo2Map = new Map<string, number[]>()

    // For each draw, check all combinations
    draws.forEach((draw) => {
      const nums = [...draw.numbers].sort((a, b) => a - b)
      
      // Compare with all other draws to find matching combinations
      draws.forEach((otherDraw) => {
        if (draw.drawDate === otherDraw.drawDate) return
        
        const otherNums = [...otherDraw.numbers].sort((a, b) => a - b)
        const matching = nums.filter(n => otherNums.includes(n))
        
        if (matching.length >= 5) {
          // Find all 5-number combinations
          for (let i = 0; i < matching.length - 4; i++) {
            for (let j = i + 1; j < matching.length - 3; j++) {
              for (let k = j + 1; k < matching.length - 2; k++) {
                for (let l = k + 1; l < matching.length - 1; l++) {
                  for (let m = l + 1; m < matching.length; m++) {
                    const combo = [matching[i], matching[j], matching[k], matching[l], matching[m]]
                    const key = combo.join(',')
                    combo5Map.set(key, combo)
                  }
                }
              }
            }
          }
        }
        
        if (matching.length >= 4) {
          // Find all 4-number combinations
          for (let i = 0; i < matching.length - 3; i++) {
            for (let j = i + 1; j < matching.length - 2; j++) {
              for (let k = j + 1; k < matching.length - 1; k++) {
                for (let l = k + 1; l < matching.length; l++) {
                  const combo = [matching[i], matching[j], matching[k], matching[l]]
                  const key = combo.join(',')
                  combo4Map.set(key, combo)
                }
              }
            }
          }
        }
        
        if (matching.length >= 3) {
          // Find all 3-number combinations
          for (let i = 0; i < matching.length - 2; i++) {
            for (let j = i + 1; j < matching.length - 1; j++) {
              for (let k = j + 1; k < matching.length; k++) {
                const combo = [matching[i], matching[j], matching[k]]
                const key = combo.join(',')
                combo3Map.set(key, combo)
              }
            }
          }
        }
        
        if (matching.length >= 2) {
          // Find all 2-number combinations
          for (let i = 0; i < matching.length - 1; i++) {
            for (let j = i + 1; j < matching.length; j++) {
              const combo = [matching[i], matching[j]]
              const key = combo.join(',')
              combo2Map.set(key, combo)
            }
          }
        }
      })
    })

    // Count occurrences for each combination across all draws
    const countOccurrences = (comboMap: Map<string, number[]>) => {
      const counts = new Map<string, { count: number; lastDate: string; dates: string[] }>()
      
      comboMap.forEach((combo, key) => {
        let count = 0
        let lastDate = ''
        const occurrenceDates: string[] = []
        draws.forEach((draw) => {
          if (combo.every(num => draw.numbers.includes(num))) {
            count++
            occurrenceDates.push(draw.drawDate)
            if (!lastDate || new Date(draw.drawDate) > new Date(lastDate)) {
              lastDate = draw.drawDate
            }
          }
        })
        counts.set(key, { count, lastDate, dates: occurrenceDates })
      })
      
      const allCombos = Array.from(counts.entries())
        .map(([key, data]) => {
          // Calculate average draws between occurrences
          let avgDrawsBetween = 0
          if (data.dates.length > 1) {
            const sortedDates = data.dates
              .map(d => new Date(d).getTime())
              .sort((a, b) => a - b)
            
            // Count draws between each occurrence
            let totalDrawsBetween = 0
            for (let i = 1; i < sortedDates.length; i++) {
              const startDate = sortedDates[i - 1]
              const endDate = sortedDates[i]
              
              // Count draws between these two dates
              let drawsBetween = 0
              for (const draw of draws) {
                const drawTime = new Date(draw.drawDate).getTime()
                if (drawTime > startDate && drawTime < endDate) {
                  drawsBetween++
                }
              }
              totalDrawsBetween += drawsBetween
            }
            avgDrawsBetween = Math.round(totalDrawsBetween / (sortedDates.length - 1))
          }
          
          return {
            numbers: key.split(',').map(Number),
            count: data.count,
            lastDate: data.lastDate,
            avgDrawsBetween
          }
        })
      
      const sortedByFrequency = [...allCombos].sort((a, b) => b.count - a.count)
      
      return {
        top10: sortedByFrequency.slice(0, 10),
        all: allCombos
      }
    }

    const combo5Data = countOccurrences(combo5Map)
    const combo4Data = countOccurrences(combo4Map)
    const combo3Data = countOccurrences(combo3Map)
    const combo2Data = countOccurrences(combo2Map)

    return {
      combo5: combo5Data.top10,
      combo5All: combo5Data.all,
      combo4: combo4Data.top10,
      combo4All: combo4Data.all,
      combo3: combo3Data.top10,
      combo3All: combo3Data.all,
      combo2: combo2Data.top10,
      combo2All: combo2Data.all
    }
  }, [draws])

  // Calculate most common euro number pairs
  const euroPairs = useMemo(() => {
    const pairMap = new Map<string, { count: number; lastDate: string; dates: string[] }>()

    draws.forEach((draw) => {
      if (draw.euroNumbers.length < 2) return
      
      const [num1, num2] = [...draw.euroNumbers].sort((a, b) => a - b)
      const key = `${num1},${num2}`
      const existing = pairMap.get(key)
      
      if (existing) {
        pairMap.set(key, {
          count: existing.count + 1,
          lastDate: new Date(draw.drawDate) > new Date(existing.lastDate) ? draw.drawDate : existing.lastDate,
          dates: [...existing.dates, draw.drawDate]
        })
      } else {
        pairMap.set(key, { count: 1, lastDate: draw.drawDate, dates: [draw.drawDate] })
      }
    })

    const allPairs = Array.from(pairMap.entries())
      .map(([key, data]) => {
        // Calculate average draws between occurrences
        let avgDrawsBetween = 0
        if (data.dates.length > 1) {
          const sortedDates = data.dates
            .map(d => new Date(d).getTime())
            .sort((a, b) => a - b)
          
          // Count draws between each occurrence
          let totalDrawsBetween = 0
          for (let i = 1; i < sortedDates.length; i++) {
            const startDate = sortedDates[i - 1]
            const endDate = sortedDates[i]
            
            // Count draws between these two dates
            let drawsBetween = 0
            for (const draw of draws) {
              const drawTime = new Date(draw.drawDate).getTime()
              if (drawTime > startDate && drawTime < endDate) {
                drawsBetween++
              }
            }
            totalDrawsBetween += drawsBetween
          }
          avgDrawsBetween = Math.round(totalDrawsBetween / (sortedDates.length - 1))
        }
        
        return {
          pair: key.split(',').map(Number) as [number, number],
          count: data.count,
          lastDate: data.lastDate,
          avgDrawsBetween
        }
      })
    
    const sortedByFrequency = [...allPairs].sort((a, b) => b.count - a.count)
    
    return {
      top10: sortedByFrequency.slice(0, 10),
      all: allPairs
    }
  }, [draws])

  const renderCombinationTable = (
    title: string,
    combinations: NumberCombination[],
    allCombinations: NumberCombination[],
    description: string,
    inputValue: string,
    setInputValue: (value: string) => void,
    onCheck: () => void,
    error: string,
    checkedResult: CheckedCombination | null,
    placeholder: string,
    largerCombinations: NumberCombination[] = []
  ) => {
    if (combinations.length === 0) {
      return (
        <div className="combination-section">
          <h3>{title}</h3>
          <p className="combination-description">{description}</p>
          
          {/* User Input Section */}
          <div className="combo-checker-box">
            <div className="combo-input-group">
              <label><strong>Check Your Combination:</strong></label>
              <input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="combo-input"
              />
              {error && <div className="combo-error">{error}</div>}
              <button onClick={onCheck} className="btn-check">Check</button>
            </div>
            
            {checkedResult && (
              <div className="combo-result">
                <div className="combo-result-numbers">
                  {checkedResult.numbers.map(num => (
                    <span key={num} className="combo-ball">{num}</span>
                  ))}
                </div>
                <div className="combo-result-stats">
                  <div className="combo-stat">
                    <span className="combo-stat-label">Times Drawn:</span>
                    <span className="combo-stat-value">{checkedResult.count}</span>
                  </div>
                  {checkedResult.count > 0 && (
                    <>
                      <div className="combo-stat">
                        <span className="combo-stat-label">Last Occurrence:</span>
                        <span className="combo-stat-value">{checkedResult.lastDate}</span>
                      </div>
                      {checkedResult.avgDrawsBetween > 0 && (
                        <div className="combo-stat">
                          <span className="combo-stat-label">Avg Draws Between:</span>
                          <span className="combo-stat-value">{checkedResult.avgDrawsBetween} draws</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {checkedResult.count === 0 && (
                  <p className="combo-never-drawn">This combination has never been drawn together.</p>
                )}
                {checkedResult.count > 0 && checkedResult.fullCombinations && checkedResult.fullCombinations.length > 0 && (
                  <div className="full-combinations-list">
                    <h4>Full Combinations Containing Your Numbers ({checkedResult.count} draws):</h4>
                    <div className="full-combos-scroll">
                      {checkedResult.fullCombinations.map((combo, idx) => (
                        <div key={idx} className="full-combo-item">
                          <div className="full-combo-date">{combo.drawDate}</div>
                          <div className="full-combo-numbers">
                            <div className="main-numbers-row">
                              {combo.mainNumbers.map(n => (
                                <span 
                                  key={n} 
                                  className={`combo-ball ${checkedResult.numbers.includes(n) ? 'highlighted' : ''}`}
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                            <div className="euro-numbers-row">
                              {combo.euroNumbers.map(n => (
                                <span 
                                  key={n} 
                                  className={`euro-ball ${checkedResult.numbers.includes(n) ? 'highlighted' : ''}`}
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="no-data">No combinations found with sufficient occurrences</div>
        </div>
      )
    }

    return (
      <div className="combination-section">
        <h3>{title}</h3>
        <p className="combination-description">{description}</p>
        
        {/* User Input Section */}
        <div className="combo-checker-box">
          <div className="combo-input-group">
            <label><strong>Check Your Combination:</strong></label>
            <input
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="combo-input"
            />
            {error && <div className="combo-error">{error}</div>}
            <button onClick={onCheck} className="btn-check">Check</button>
          </div>
          
          {checkedResult && (
            <div className="combo-result">
              <div className="combo-result-numbers">
                {checkedResult.numbers.map(num => (
                  <span key={num} className="combo-ball">{num}</span>
                ))}
              </div>
              <div className="combo-result-stats">
                <div className="combo-stat">
                  <span className="combo-stat-label">Times Drawn:</span>
                  <span className="combo-stat-value">{checkedResult.count}</span>
                </div>
                {checkedResult.count > 0 && (
                  <>
                    <div className="combo-stat">
                      <span className="combo-stat-label">Last Occurrence:</span>
                      <span className="combo-stat-value">{checkedResult.lastDate}</span>
                    </div>
                    {checkedResult.avgDrawsBetween > 0 && (
                      <div className="combo-stat">
                        <span className="combo-stat-label">Avg Draws Between:</span>
                        <span className="combo-stat-value">{checkedResult.avgDrawsBetween} draws</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {checkedResult.count === 0 && (
                <p className="combo-never-drawn">This combination has never been drawn together.</p>
              )}
              {checkedResult.count > 0 && checkedResult.fullCombinations && checkedResult.fullCombinations.length > 0 && (
                <div className="full-combinations-list">
                  <h4>Full Combinations Containing Your Numbers ({checkedResult.count} draws):</h4>
                  <div className="full-combos-scroll">
                    {checkedResult.fullCombinations.map((combo, idx) => (
                      <div key={idx} className="full-combo-item">
                        <div className="full-combo-date">{combo.drawDate}</div>
                        <div className="full-combo-numbers">
                          <div className="main-numbers-row">
                            {combo.mainNumbers.map(n => (
                              <span 
                                key={n} 
                                className={`combo-ball ${checkedResult.numbers.includes(n) ? 'highlighted' : ''}`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                          <div className="euro-numbers-row">
                            {combo.euroNumbers.map(n => (
                              <span 
                                key={n} 
                                className={`euro-ball ${checkedResult.numbers.includes(n) ? 'highlighted' : ''}`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <table className="combination-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Numbers</th>
              <th>Occurrences</th>
              <th>Last Occurrence</th>
              <th>Draws Since Last</th>
              <th>Avg Draws Between</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Filter special "due" combinations to exclude subsets of larger combinations
              const filteredAllCombosForDue = allCombinations.filter(combo => 
                !isSubsetOfAny(combo.numbers, largerCombinations)
              )
              
              const dueCombos = findTopDueCombinations(filteredAllCombosForDue)
              // Create a set of due combo keys to filter them out from the frequency list
              const dueComboKeys = new Set(dueCombos.map(c => c.numbers.join(',')))
              // Filter out combinations that are already shown in the due section
              const frequencyCombos = combinations.filter(combo => !dueComboKeys.has(combo.numbers.join(',')))
              
              return (
                <>
                  {/* Top 2 Due Combinations */}
                  {dueCombos.length > 0 && (
                    <>
                      <tr className="section-header-row">
                        <td colSpan={6} className="section-header">
                          🎯 Top Combinations Due (Closest to Average Pattern)
                        </td>
                      </tr>
                      {dueCombos.map((combo, index) => {
                        const drawsSince = getDrawsSinceLastOccurrence(combo.lastDate)
                        return (
                          <tr key={`due-${combo.numbers.join(',')}`} className="due-combination-row">
                            <td>⭐ {index + 1}</td>
                            <td>
                              <div className="combination-numbers">
                                {combo.numbers.map((num) => (
                                  <span key={num} className="combo-ball">
                                    {num}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="occurrence-count">{combo.count}</td>
                            <td className="last-date">{combo.lastDate}</td>
                            <td className="draws-since">{drawsSince > 0 ? drawsSince : '-'}</td>
                            <td className="avg-days">{combo.avgDrawsBetween > 0 ? `${combo.avgDrawsBetween} draws` : '-'}</td>
                          </tr>
                        )
                      })}
                      <tr className="section-divider-row">
                        <td colSpan={6} className="section-divider"></td>
                      </tr>
                    </>
                  )}
                  
                  {/* Regular Top 10 by Frequency */}
                  <tr className="section-header-row">
                    <td colSpan={6} className="section-header">
                      📊 Most Frequent Combinations
                    </td>
                  </tr>
                  {frequencyCombos.map((combo, index) => {
                    const drawsSince = getDrawsSinceLastOccurrence(combo.lastDate)
                    return (
                      <tr key={combo.numbers.join(',')} className={getOverdueClass(combo.lastDate, combo.avgDrawsBetween)}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="combination-numbers">
                            {combo.numbers.map((num) => (
                              <span key={num} className="combo-ball">
                                {num}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="occurrence-count">{combo.count}</td>
                        <td className="last-date">{combo.lastDate}</td>
                        <td className="draws-since">{drawsSince > 0 ? drawsSince : '-'}</td>
                        <td className="avg-days">{combo.avgDrawsBetween > 0 ? `${combo.avgDrawsBetween} draws` : '-'}</td>
                      </tr>
                    )
                  })}
                </>
              )
            })()}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="combination-analysis">
      <h2>Number Combination Analysis</h2>
      <p className="analysis-intro">
        Analysis of the most common combinations that appear together across {draws.length} draws.
        Shows the top 10 most frequent combinations for each group size.
      </p>

      <div className="combinations-grid">
        {renderCombinationTable(
          'Most Common 5-Number Combinations',
          combinations.combo5,
          combinations.combo5All,
          'Enter 1-5 numbers to find all draws containing them',
          inputCombo5,
          setInputCombo5,
          handleCheck5,
          error5,
          checkedCombo5,
          'e.g., 5 12 (or up to 5 numbers)',
          [] // No larger combinations to filter against
        )}
        
        {renderCombinationTable(
          'Most Common 4-Number Combinations',
          combinations.combo4,
          combinations.combo4All,
          'Enter 1-4 numbers to find all draws containing them',
          inputCombo4,
          setInputCombo4,
          handleCheck4,
          error4,
          checkedCombo4,
          'e.g., 5 12 (or up to 4 numbers)',
          combinations.combo5All // Filter out subsets of 5-number combos
        )}
        
        {renderCombinationTable(
          'Most Common 3-Number Combinations',
          combinations.combo3,
          combinations.combo3All,
          'Enter 1-3 numbers to find all draws containing them',
          inputCombo3,
          setInputCombo3,
          handleCheck3,
          error3,
          checkedCombo3,
          'e.g., 5 12 (or up to 3 numbers)',
          [...combinations.combo5All, ...combinations.combo4All] // Filter out subsets of 5 and 4-number combos
        )}
        
        {renderCombinationTable(
          'Most Common 2-Number Combinations',
          combinations.combo2,
          combinations.combo2All,
          'Enter 1-2 numbers to find all draws containing them',
          inputCombo2,
          setInputCombo2,
          handleCheck2,
          error2,
          checkedCombo2,
          'e.g., 5 or 5 12',
          [...combinations.combo5All, ...combinations.combo4All, ...combinations.combo3All] // Filter out subsets of 5, 4, and 3-number combos
        )}
      </div>

      <div className="euro-pairs-section">
        <h2>Euro Number Pairs</h2>
        <p className="analysis-intro">
          The top 10 most common pairs of Euro numbers that appear together across all draws.
        </p>
        
        {/* User Input Section for Euro Pairs */}
        <div className="combo-checker-box">
          <div className="combo-input-group">
            <label><strong>Check Your Euro Numbers:</strong></label>
            <input
              type="text"
              placeholder="e.g., 3 or 3 8"
              value={inputEuroPair}
              onChange={(e) => setInputEuroPair(e.target.value)}
              className="combo-input"
            />
            {errorEuro && <div className="combo-error">{errorEuro}</div>}
            <button onClick={handleCheckEuro} className="btn-check">Check</button>
          </div>
          
          {checkedEuroPair && (
            <div className="combo-result">
              <div className="combo-result-numbers">
                {checkedEuroPair.numbers.map(num => (
                  <span key={num} className="euro-ball">{num}</span>
                ))}
              </div>
              <div className="combo-result-stats">
                <div className="combo-stat">
                  <span className="combo-stat-label">Times Drawn:</span>
                  <span className="combo-stat-value">{checkedEuroPair.count}</span>
                </div>
                {checkedEuroPair.count > 0 && (
                  <>
                    <div className="combo-stat">
                      <span className="combo-stat-label">Last Occurrence:</span>
                      <span className="combo-stat-value">{checkedEuroPair.lastDate}</span>
                    </div>
                    {checkedEuroPair.avgDrawsBetween > 0 && (
                      <div className="combo-stat">
                        <span className="combo-stat-label">Avg Draws Between:</span>
                        <span className="combo-stat-value">{checkedEuroPair.avgDrawsBetween} draws</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {checkedEuroPair.count === 0 && (
                <p className="combo-never-drawn">This euro pair has never been drawn together.</p>
              )}
              {checkedEuroPair.count > 0 && checkedEuroPair.fullCombinations && checkedEuroPair.fullCombinations.length > 0 && (
                <div className="full-combinations-list">
                  <h4>Full Combinations Containing Your Euro Numbers ({checkedEuroPair.count} draws):</h4>
                  <div className="full-combos-scroll">
                    {checkedEuroPair.fullCombinations.map((combo, idx) => (
                      <div key={idx} className="full-combo-item">
                        <div className="full-combo-date">{combo.drawDate}</div>
                        <div className="full-combo-numbers">
                          <div className="main-numbers-row">
                            {combo.mainNumbers.map(n => (
                              <span key={n} className="combo-ball">
                                {n}
                              </span>
                            ))}
                          </div>
                          <div className="euro-numbers-row">
                            {combo.euroNumbers.map(n => (
                              <span 
                                key={n} 
                                className={`euro-ball ${checkedEuroPair.numbers.includes(n) ? 'highlighted' : ''}`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <table className="combination-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Euro Pair</th>
              <th>Occurrences</th>
              <th>Last Occurrence</th>
              <th>Draws Since Last</th>
              <th>Avg Draws Between</th>
            </tr>
          </thead>
          <tbody>
            {euroPairs.top10.length > 0 ? (
              (() => {
                const duePairs = euroPairs.all
                  .filter(pair => pair.avgDrawsBetween > 0 && pair.lastDate)
                  .map(pair => {
                    const drawsSince = getDrawsSinceLastOccurrence(pair.lastDate)
                    const difference = Math.abs(drawsSince - pair.avgDrawsBetween)
                    return { ...pair, drawsSince, difference }
                  })
                  .sort((a, b) => a.difference - b.difference)
                  .slice(0, 3)
                
                // Create a set of due pair keys to filter them out from the frequency list
                const duePairKeys = new Set(duePairs.map(p => p.pair.join(',')))
                // Filter out pairs that are already shown in the due section
                const frequencyPairs = euroPairs.top10.filter(pair => !duePairKeys.has(pair.pair.join(',')))
                
                return (
                  <>
                    {/* Top 2 Due Euro Pairs */}
                    {duePairs.length > 0 && (
                      <>
                        <tr className="section-header-row">
                          <td colSpan={6} className="section-header">
                            🎯 Top Euro Pairs Due (Closest to Average Pattern)
                          </td>
                        </tr>
                        {duePairs.map((pair, index) => {
                          const drawsSince = getDrawsSinceLastOccurrence(pair.lastDate)
                          return (
                            <tr key={`due-${pair.pair.join(',')}`} className="due-combination-row">
                              <td>⭐ {index + 1}</td>
                              <td>
                                <div className="combination-numbers">
                                  <span className="euro-ball">{pair.pair[0]}</span>
                                  <span className="euro-ball">{pair.pair[1]}</span>
                                </div>
                              </td>
                              <td className="occurrence-count">{pair.count}</td>
                              <td className="last-date">{pair.lastDate}</td>
                              <td className="draws-since">{drawsSince > 0 ? drawsSince : '-'}</td>
                              <td className="avg-days">{pair.avgDrawsBetween > 0 ? `${pair.avgDrawsBetween} draws` : '-'}</td>
                            </tr>
                          )
                        })}
                        <tr className="section-divider-row">
                          <td colSpan={6} className="section-divider"></td>
                        </tr>
                      </>
                    )}
                    
                    {/* Regular Top 10 by Frequency */}
                    <tr className="section-header-row">
                      <td colSpan={6} className="section-header">
                        📊 Most Frequent Euro Pairs
                      </td>
                    </tr>
                    {frequencyPairs.map((pairData, index) => {
                      const drawsSince = getDrawsSinceLastOccurrence(pairData.lastDate)
                      return (
                        <tr key={pairData.pair.join(',')} className={getOverdueClass(pairData.lastDate, pairData.avgDrawsBetween)}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="combination-numbers">
                              <span className="euro-ball">{pairData.pair[0]}</span>
                              <span className="euro-ball">{pairData.pair[1]}</span>
                            </div>
                          </td>
                          <td className="occurrence-count">{pairData.count}</td>
                          <td className="last-date">{pairData.lastDate}</td>
                          <td className="draws-since">{drawsSince > 0 ? drawsSince : '-'}</td>
                          <td className="avg-days">{pairData.avgDrawsBetween > 0 ? `${pairData.avgDrawsBetween} draws` : '-'}</td>
                        </tr>
                      )
                    })}
                  </>
                )
              })()
            ) : (
              <tr>
                <td colSpan={6} className="no-data">
                  No euro pairs data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
