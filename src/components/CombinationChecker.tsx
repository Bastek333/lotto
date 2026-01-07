import React, { useState, useMemo } from 'react'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
  jackpot?: string
  jackpotAmount?: string
}

interface CombinationCheckerProps {
  draws: Draw[]
}

interface MatchResult {
  drawDate: string
  mainMatches: number
  euroMatches: number
  matchedMainNumbers: number[]
  matchedEuroNumbers: number[]
  fullMainNumbers: number[]
  fullEuroNumbers: number[]
}

export default function CombinationChecker({ draws }: CombinationCheckerProps): JSX.Element {
  // Use Set for selected numbers instead of strings
  const [selectedMainNumbers, setSelectedMainNumbers] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('checkerMainNumbers')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set()
      }
    }
    return new Set()
  })
  
  const [selectedEuroNumbers, setSelectedEuroNumbers] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('checkerEuroNumbers')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set()
      }
    }
    return new Set()
  })
  
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [error, setError] = useState<string>('')

  // Persist numbers to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('checkerMainNumbers', JSON.stringify([...selectedMainNumbers]))
  }, [selectedMainNumbers])

  React.useEffect(() => {
    localStorage.setItem('checkerEuroNumbers', JSON.stringify([...selectedEuroNumbers]))
  }, [selectedEuroNumbers])

  const toggleMainNumber = (num: number) => {
    setSelectedMainNumbers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(num)) {
        newSet.delete(num)
      } else {
        // Allow up to 5 main numbers
        if (newSet.size < 5) {
          newSet.add(num)
        }
      }
      return newSet
    })
    setError('')
  }

  const toggleEuroNumber = (num: number) => {
    setSelectedEuroNumbers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(num)) {
        newSet.delete(num)
      } else {
        // Allow up to 2 euro numbers
        if (newSet.size < 2) {
          newSet.add(num)
        }
      }
      return newSet
    })
    setError('')
  }

  const handleCheck = () => {
    setError('')
    setResults(null)

    // Validate that at least 1 number is selected
    const totalSelected = selectedMainNumbers.size + selectedEuroNumbers.size
    if (totalSelected === 0) {
      setError('Please select at least 1 number to check.')
      return
    }

    // Allow 1-5 main numbers and 0-2 euro numbers
    if (selectedMainNumbers.size > 5) {
      setError('Please select a maximum of 5 main numbers.')
      return
    }

    if (selectedEuroNumbers.size > 2) {
      setError('Please select a maximum of 2 euro numbers.')
      return
    }

    const mainNums = [...selectedMainNumbers]
    const euroNums = [...selectedEuroNumbers]

    // Check against all draws
    const matches: MatchResult[] = []

    draws.forEach(draw => {
      // For partial searches, check if ALL entered numbers are present in the draw
      let matchedMain: number[] = []
      let matchedEuro: number[] = []
      
      if (mainNums.length > 0) {
        matchedMain = mainNums.filter(n => draw.numbers.includes(n))
      }
      
      if (euroNums.length > 0) {
        matchedEuro = euroNums.filter(n => draw.euroNumbers.includes(n))
      }

      // All entered main numbers must match AND all entered euro numbers must match
      const allMainMatch = mainNums.length === 0 || matchedMain.length === mainNums.length
      const allEuroMatch = euroNums.length === 0 || matchedEuro.length === euroNums.length

      if (allMainMatch && allEuroMatch && (mainNums.length > 0 || euroNums.length > 0)) {
        matches.push({
          drawDate: draw.drawDate,
          mainMatches: matchedMain.length,
          euroMatches: matchedEuro.length,
          matchedMainNumbers: matchedMain.sort((a, b) => a - b),
          matchedEuroNumbers: matchedEuro.sort((a, b) => a - b),
          fullMainNumbers: [...draw.numbers].sort((a, b) => a - b),
          fullEuroNumbers: [...draw.euroNumbers].sort((a, b) => a - b)
        })
      }
    })

    setResults(matches)
  }

  const statistics = useMemo(() => {
    if (!results) return null

    const stats = {
      total: results.length,
      main5: results.filter(r => r.mainMatches === 5).length,
      main4: results.filter(r => r.mainMatches === 4).length,
      main3: results.filter(r => r.mainMatches === 3).length,
      main2: results.filter(r => r.mainMatches === 2).length,
      euro2: results.filter(r => r.euroMatches === 2).length,
      euro1: results.filter(r => r.euroMatches === 1).length,
      main5euro2: results.filter(r => r.mainMatches === 5 && r.euroMatches === 2).length,
      main5euro1: results.filter(r => r.mainMatches === 5 && r.euroMatches === 1).length,
      main4euro2: results.filter(r => r.mainMatches === 4 && r.euroMatches === 2).length,
      main4euro1: results.filter(r => r.mainMatches === 4 && r.euroMatches === 1).length,
      main3euro2: results.filter(r => r.mainMatches === 3 && r.euroMatches === 2).length,
      main3euro1: results.filter(r => r.mainMatches === 3 && r.euroMatches === 1).length,
      main2euro2: results.filter(r => r.mainMatches === 2 && r.euroMatches === 2).length,
    }

    return stats
  }, [results])

  const handleReset = () => {
    setSelectedMainNumbers(new Set())
    setSelectedEuroNumbers(new Set())
    setResults(null)
    setError('')
    localStorage.removeItem('checkerMainNumbers')
    localStorage.removeItem('checkerEuroNumbers')
  }

  return (
    <div className="combination-checker">
      <h2>Check Your Combination</h2>
      <p className="checker-intro">
        Enter 1 to 5 main numbers and/or 1-2 euro numbers to find all historical draws that contain your selected numbers.
      </p>

      <div className="checker-form">
        <div className="ball-selection-group">
          <label>
            <strong>Main Numbers ({selectedMainNumbers.size} selected - select 1-5)</strong>
          </label>
          <div className="ball-grid main-ball-grid">
            {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
              <div
                key={num}
                className={`selectable-ball ${selectedMainNumbers.has(num) ? 'selected' : ''}`}
                onClick={() => toggleMainNumber(num)}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="ball-selection-group">
          <label>
            <strong>Euro Numbers ({selectedEuroNumbers.size} selected - optional)</strong>
          </label>
          <div className="ball-grid euro-ball-grid">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
              <div
                key={num}
                className={`selectable-ball euro-selectable ${selectedEuroNumbers.has(num) ? 'selected' : ''}`}
                onClick={() => toggleEuroNumber(num)}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="checker-error">
            {error}
          </div>
        )}

        <div className="checker-buttons">
          <button onClick={handleCheck} className="btn-primary">
            Check Combination
          </button>
          <button onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="checker-results">
          <h3>Results</h3>
          
          {results.length === 0 ? (
            <div className="no-matches">
              <p>No matches found in {draws.length} historical draws.</p>
              <p className="muted">No draws contain all of your selected numbers.</p>
            </div>
          ) : (
            <>
              <div className="statistics-summary">
                <h4>Match Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-card highlight-card">
                    <div className="stat-label">Total Draws with Matches</div>
                    <div className="stat-value">{statistics?.total}</div>
                  </div>
                  
                  <div className="stat-card jackpot-card">
                    <div className="stat-label">🎉 5+2 (Jackpot!)</div>
                    <div className="stat-value">{statistics?.main5euro2}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">5+1</div>
                    <div className="stat-value">{statistics?.main5euro1}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">5+0</div>
                    <div className="stat-value">{(statistics?.main5 || 0) - (statistics?.main5euro2 || 0) - (statistics?.main5euro1 || 0)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">4+2</div>
                    <div className="stat-value">{statistics?.main4euro2}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">4+1</div>
                    <div className="stat-value">{statistics?.main4euro1}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">4+0</div>
                    <div className="stat-value">{(statistics?.main4 || 0) - (statistics?.main4euro2 || 0) - (statistics?.main4euro1 || 0)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">3+2</div>
                    <div className="stat-value">{statistics?.main3euro2}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">3+1</div>
                    <div className="stat-value">{statistics?.main3euro1}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">3+0</div>
                    <div className="stat-value">{(statistics?.main3 || 0) - (statistics?.main3euro2 || 0) - (statistics?.main3euro1 || 0)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">2+2</div>
                    <div className="stat-value">{statistics?.main2euro2}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">2+1</div>
                    <div className="stat-value">{(statistics?.main2 || 0) - (statistics?.main2euro2 || 0)}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">2+0</div>
                    <div className="stat-value">{results.filter(r => r.mainMatches === 2 && r.euroMatches === 0).length}</div>
                  </div>
                </div>
              </div>

              <div className="matches-table-container">
                <h4>All Matches ({results.length} draws)</h4>
                <table className="matches-table">
                  <thead>
                    <tr>
                      <th>Draw Date</th>
                      <th>Your Matches</th>
                      <th>Full Combination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <tr key={idx} className={result.mainMatches === 5 && result.euroMatches === 2 ? 'jackpot-row' : ''}>
                        <td>{result.drawDate}</td>
                        <td>
                          <div className="matched-numbers-display">
                            {result.matchedMainNumbers.length > 0 && (
                              <div className="matched-group">
                                <span className="match-badge main-badge">
                                  {result.mainMatches} main
                                </span>
                                {result.matchedMainNumbers.map(n => (
                                  <span key={n} className="matched-ball main-ball">{n}</span>
                                ))}
                              </div>
                            )}
                            {result.matchedEuroNumbers.length > 0 && (
                              <div className="matched-group">
                                <span className="match-badge euro-badge">
                                  {result.euroMatches} euro
                                </span>
                                {result.matchedEuroNumbers.map(n => (
                                  <span key={n} className="matched-ball euro-ball-small">{n}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="full-combination-display">
                            <div className="full-numbers-group">
                              {result.fullMainNumbers.map(n => (
                                <span 
                                  key={n} 
                                  className={`combo-ball ${result.matchedMainNumbers.includes(n) ? 'highlighted' : ''}`}
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                            <div className="full-numbers-group">
                              {result.fullEuroNumbers.map(n => (
                                <span 
                                  key={n} 
                                  className={`euro-ball ${result.matchedEuroNumbers.includes(n) ? 'highlighted' : ''}`}
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
