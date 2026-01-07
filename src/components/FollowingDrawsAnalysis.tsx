import React from 'react'

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

type NumberFrequency = {
  number: number
  count: number
  percentage: number
}

export default function FollowingDrawsAnalysis({ draws }: Props): JSX.Element {
  // Get latest draw and previous draw
  const latestDraw = draws[0]
  const previousDraw = draws.length > 1 ? draws[1] : null
  
  // For each number in the latest draw, find all numbers that appeared in following draws historically
  const mainNumbersAnalysis = React.useMemo(() => {
    const analysisResults: {
      currentNumber: number
      followingNumbersFrequency: NumberFrequency[]
      totalFollowingDraws: number
    }[] = []
    
    latestDraw.numbers.forEach(currentNum => {
      const followingNumbersMap: { [key: number]: number } = {}
      let totalFollowingDraws = 0
      
      // Go through historical draws (skip the first one as it's the latest)
      for (let i = 1; i < draws.length; i++) {
        const previousDraw = draws[i]
        
        // Check if currentNum was in this historical draw
        if (previousDraw.numbers.includes(currentNum)) {
          // Count all numbers from the following draw (draw i-1)
          const followingDraw = draws[i - 1]
          totalFollowingDraws++
          
          followingDraw.numbers.forEach(num => {
            followingNumbersMap[num] = (followingNumbersMap[num] || 0) + 1
          })
        }
      }
      
      // Convert to array and sort by frequency
      const followingNumbers = Object.entries(followingNumbersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          count,
          percentage: totalFollowingDraws > 0 ? (count / totalFollowingDraws) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      analysisResults.push({
        currentNumber: currentNum,
        followingNumbersFrequency: followingNumbers,
        totalFollowingDraws
      })
    })
    
    return analysisResults
  }, [draws, latestDraw])
  
  // Same analysis for euro numbers
  const euroNumbersAnalysis = React.useMemo(() => {
    const analysisResults: {
      currentNumber: number
      followingNumbersFrequency: NumberFrequency[]
      totalFollowingDraws: number
    }[] = []
    
    latestDraw.euroNumbers.forEach(currentNum => {
      const followingNumbersMap: { [key: number]: number } = {}
      let totalFollowingDraws = 0
      
      // Go through historical draws
      for (let i = 1; i < draws.length; i++) {
        const previousDraw = draws[i]
        
        // Check if currentNum was in this historical draw
        if (previousDraw.euroNumbers.includes(currentNum)) {
          // Count all numbers from the following draw
          const followingDraw = draws[i - 1]
          totalFollowingDraws++
          
          followingDraw.euroNumbers.forEach(num => {
            followingNumbersMap[num] = (followingNumbersMap[num] || 0) + 1
          })
        }
      }
      
      // Convert to array and sort by frequency
      const followingNumbers = Object.entries(followingNumbersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          count,
          percentage: totalFollowingDraws > 0 ? (count / totalFollowingDraws) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      analysisResults.push({
        currentNumber: currentNum,
        followingNumbersFrequency: followingNumbers,
        totalFollowingDraws
      })
    })
    
    return analysisResults
  }, [draws, latestDraw])
  
  // Aggregate all following numbers from all numbers in latest draw
  const aggregatedMainNumbers = React.useMemo(() => {
    const aggregatedMap: { [key: number]: number } = {}
    let totalOccurrences = 0
    
    mainNumbersAnalysis.forEach(analysis => {
      analysis.followingNumbersFrequency.forEach(freq => {
        aggregatedMap[freq.number] = (aggregatedMap[freq.number] || 0) + freq.count
        totalOccurrences += freq.count
      })
    })
    
    return Object.entries(aggregatedMap)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: totalOccurrences > 0 ? (count / totalOccurrences) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  }, [mainNumbersAnalysis])
  
  const aggregatedEuroNumbers = React.useMemo(() => {
    const aggregatedMap: { [key: number]: number } = {}
    let totalOccurrences = 0
    
    euroNumbersAnalysis.forEach(analysis => {
      analysis.followingNumbersFrequency.forEach(freq => {
        aggregatedMap[freq.number] = (aggregatedMap[freq.number] || 0) + freq.count
        totalOccurrences += freq.count
      })
    })
    
    return Object.entries(aggregatedMap)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: totalOccurrences > 0 ? (count / totalOccurrences) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  }, [euroNumbersAnalysis])
  
  // Generate predictions: top 5 main numbers and top 2 euro numbers
  const predictedMainNumbers = React.useMemo(() => {
    return aggregatedMainNumbers.slice(0, 5).map(n => n.number)
  }, [aggregatedMainNumbers])
  
  const predictedEuroNumbers = React.useMemo(() => {
    return aggregatedEuroNumbers.slice(0, 2).map(n => n.number)
  }, [aggregatedEuroNumbers])

  // Generate predictions based on the PREVIOUS draw (to compare with actual latest draw)
  const previousDrawPrediction = React.useMemo(() => {
    if (!previousDraw || draws.length < 2) return null

    // Analyze main numbers from previous draw
    const prevMainAnalysisResults: {
      currentNumber: number
      followingNumbersFrequency: NumberFrequency[]
      totalFollowingDraws: number
    }[] = []
    
    previousDraw.numbers.forEach(currentNum => {
      const followingNumbersMap: { [key: number]: number } = {}
      let totalFollowingDraws = 0
      
      // Go through historical draws starting from index 2 (skip latest and previous)
      for (let i = 2; i < draws.length; i++) {
        const historicalDraw = draws[i]
        
        if (historicalDraw.numbers.includes(currentNum)) {
          const followingDraw = draws[i - 1]
          totalFollowingDraws++
          
          followingDraw.numbers.forEach(num => {
            followingNumbersMap[num] = (followingNumbersMap[num] || 0) + 1
          })
        }
      }
      
      const followingNumbers = Object.entries(followingNumbersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          count,
          percentage: totalFollowingDraws > 0 ? (count / totalFollowingDraws) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      prevMainAnalysisResults.push({
        currentNumber: currentNum,
        followingNumbersFrequency: followingNumbers,
        totalFollowingDraws
      })
    })

    // Analyze euro numbers from previous draw
    const prevEuroAnalysisResults: {
      currentNumber: number
      followingNumbersFrequency: NumberFrequency[]
      totalFollowingDraws: number
    }[] = []
    
    previousDraw.euroNumbers.forEach(currentNum => {
      const followingNumbersMap: { [key: number]: number } = {}
      let totalFollowingDraws = 0
      
      for (let i = 2; i < draws.length; i++) {
        const historicalDraw = draws[i]
        
        if (historicalDraw.euroNumbers.includes(currentNum)) {
          const followingDraw = draws[i - 1]
          totalFollowingDraws++
          
          followingDraw.euroNumbers.forEach(num => {
            followingNumbersMap[num] = (followingNumbersMap[num] || 0) + 1
          })
        }
      }
      
      const followingNumbers = Object.entries(followingNumbersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          count,
          percentage: totalFollowingDraws > 0 ? (count / totalFollowingDraws) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
      
      prevEuroAnalysisResults.push({
        currentNumber: currentNum,
        followingNumbersFrequency: followingNumbers,
        totalFollowingDraws
      })
    })

    // Aggregate predictions from previous draw
    const prevAggregatedMain: { [key: number]: number } = {}
    let prevMainTotal = 0
    prevMainAnalysisResults.forEach(analysis => {
      analysis.followingNumbersFrequency.forEach(freq => {
        prevAggregatedMain[freq.number] = (prevAggregatedMain[freq.number] || 0) + freq.count
        prevMainTotal += freq.count
      })
    })

    const prevAggregatedEuro: { [key: number]: number } = {}
    let prevEuroTotal = 0
    prevEuroAnalysisResults.forEach(analysis => {
      analysis.followingNumbersFrequency.forEach(freq => {
        prevAggregatedEuro[freq.number] = (prevAggregatedEuro[freq.number] || 0) + freq.count
        prevEuroTotal += freq.count
      })
    })

    const prevMainFrequencies = Object.entries(prevAggregatedMain)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: prevMainTotal > 0 ? (count / prevMainTotal) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    const prevEuroFrequencies = Object.entries(prevAggregatedEuro)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: prevEuroTotal > 0 ? (count / prevEuroTotal) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    const prevPredictedMain = prevMainFrequencies.slice(0, 5).map(n => n.number)
    const prevPredictedEuro = prevEuroFrequencies.slice(0, 2).map(n => n.number)

    // Calculate matches
    const mainMatches = prevPredictedMain.filter(num => latestDraw.numbers.includes(num))
    const euroMatches = prevPredictedEuro.filter(num => latestDraw.euroNumbers.includes(num))

    return {
      previousDraw,
      predictedMain: prevPredictedMain,
      predictedEuro: prevPredictedEuro,
      mainMatches,
      euroMatches,
      mainMatchCount: mainMatches.length,
      euroMatchCount: euroMatches.length
    }
  }, [draws, previousDraw, latestDraw])


  return (
    <div className="next-draw-prediction">
      <h2>Following Draws Analysis</h2>
      <p className="info">
        Analysis based on {draws.length} draws. For each number in the latest draw, we collect ALL numbers 
        that appeared in draws that historically followed when that number was drawn. The most common 
        numbers across all these following draws are our predictions.
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
        <h3>Predicted Numbers for Next Draw</h3>
        <div className="prediction-card">
          <p className="prediction-disclaimer">
            Based on aggregated frequency analysis of all numbers appearing in historical following draws
          </p>
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
      
      {/* Previous Draw Prediction Validation */}
      {previousDrawPrediction && (
        <div className="prediction-section">
          <h3>Previous Prediction Accuracy Check</h3>
          <div className="prediction-validation-card">
            <p className="prediction-disclaimer">
              What we predicted from the previous draw vs. what actually happened in the latest draw
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
                <div className="draw-date">Based on following draws analysis</div>
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
              {previousDrawPrediction.mainMatches.length > 0 && (
                <div className="match-highlight">
                  ✓ Successfully predicted {previousDrawPrediction.mainMatchCount} main number{previousDrawPrediction.mainMatchCount !== 1 ? 's' : ''} 
                  {previousDrawPrediction.euroMatchCount > 0 && ` and ${previousDrawPrediction.euroMatchCount} euro number${previousDrawPrediction.euroMatchCount !== 1 ? 's' : ''}`}!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Aggregated Frequency Tables */}
      <div className="analysis-section">
        <h3>Aggregated Main Numbers Frequency</h3>
        <p className="analysis-description">
          All main numbers that appeared in draws following any occurrence of the numbers in the latest draw, 
          ranked by total frequency.
        </p>
        <div className="frequency-table-wrapper">
          <table className="frequency-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Number</th>
                <th>Total Occurrences</th>
                <th>Frequency %</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedMainNumbers.slice(0, 20).map((freq, idx) => (
                <tr key={freq.number} className={idx < 5 ? 'predicted-row' : ''}>
                  <td>{idx + 1}</td>
                  <td>
                    <span className="number-ball-small main">{freq.number}</span>
                  </td>
                  <td><strong>{freq.count}</strong></td>
                  <td>{freq.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="analysis-section">
        <h3>Aggregated Euro Numbers Frequency</h3>
        <p className="analysis-description">
          All euro numbers that appeared in draws following any occurrence of the euro numbers in the latest draw, 
          ranked by total frequency.
        </p>
        <div className="frequency-table-wrapper">
          <table className="frequency-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Number</th>
                <th>Total Occurrences</th>
                <th>Frequency %</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedEuroNumbers.slice(0, 12).map((freq, idx) => (
                <tr key={freq.number} className={idx < 2 ? 'predicted-row' : ''}>
                  <td>{idx + 1}</td>
                  <td>
                    <span className="number-ball-small euro">{freq.number}</span>
                  </td>
                  <td><strong>{freq.count}</strong></td>
                  <td>{freq.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Detailed Analysis by Number */}
      <div className="analysis-section">
        <h3>Detailed Analysis by Latest Draw Number</h3>
        <p className="analysis-description">
          For each number in the latest draw, showing the top 10 numbers that most commonly appeared 
          in the following draws historically.
        </p>
        <div className="pattern-tables">
          {mainNumbersAnalysis.map((analysis) => (
            <div key={analysis.currentNumber} className="pattern-table-card">
              <div className="pattern-header">
                <span className="number-ball-small main">{analysis.currentNumber}</span>
                <span className="pattern-title">
                  Found in {analysis.totalFollowingDraws} historical draws
                </span>
              </div>
              <table className="pattern-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Following Number</th>
                    <th>Occurrences</th>
                    <th>Frequency %</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.followingNumbersFrequency.slice(0, 10).map((freq, idx) => (
                    <tr key={freq.number}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="number-ball-small main">{freq.number}</span>
                      </td>
                      <td><strong>{freq.count}</strong></td>
                      <td>{freq.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
      
      <div className="analysis-section">
        <h3>Detailed Euro Numbers Analysis</h3>
        <p className="analysis-description">
          For each euro number in the latest draw, showing the top numbers that most commonly appeared 
          in the following draws historically.
        </p>
        <div className="pattern-tables">
          {euroNumbersAnalysis.map((analysis) => (
            <div key={analysis.currentNumber} className="pattern-table-card">
              <div className="pattern-header">
                <span className="number-ball-small euro">{analysis.currentNumber}</span>
                <span className="pattern-title">
                  Found in {analysis.totalFollowingDraws} historical draws
                </span>
              </div>
              <table className="pattern-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Following Number</th>
                    <th>Occurrences</th>
                    <th>Frequency %</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.followingNumbersFrequency.slice(0, 8).map((freq, idx) => (
                    <tr key={freq.number}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="number-ball-small euro">{freq.number}</span>
                      </td>
                      <td><strong>{freq.count}</strong></td>
                      <td>{freq.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
      
      <div className="disclaimer">
        <strong>Disclaimer:</strong> These predictions are based on historical pattern analysis. 
        Lottery draws are random events, and past results do not influence future outcomes. 
        This tool is for entertainment purposes only.
      </div>
    </div>
  )
}
