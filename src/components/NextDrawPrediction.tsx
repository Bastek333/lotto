import React from 'react'
import { analyzeOrderPatterns } from '../utils/orderPatternAnalysis'

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

type NextNumberAnalysis = {
  currentNumber: number
  closestFollowers: { number: number; distance: number; count: number }[]
  mostCommonFollower: number
  followerCount: number
}

type OrderBasedPrediction = {
  number: number
  positionScore: number
  gapScore: number
  sequenceScore: number
  totalScore: number
  preferredPosition?: number
}

export default function NextDrawPrediction({ draws }: Props): JSX.Element {
  // Get latest draw and previous draw
  const latestDraw = draws[0]
  const previousDraw = draws.length > 1 ? draws[1] : null
  
  // ORDER PATTERN ANALYSIS (HIGHEST PRIORITY)
  const orderPatternPrediction = React.useMemo(() => {
    const analysis = analyzeOrderPatterns(draws, 30)
    
    // Get top numbers based on order pattern scores
    const topMainNumbers = analysis.mainNumberScores
      .slice(0, 10) // Consider top 10
      .sort((a, b) => b.totalOrderScore - a.totalOrderScore)
    
    const topEuroNumbers = analysis.euroNumberScores
      .slice(0, 5) // Consider top 5
      .sort((a, b) => b.totalOrderScore - a.totalOrderScore)
    
    // Build ordered predictions considering position preferences
    const orderedMainPredictions: OrderBasedPrediction[] = topMainNumbers.map(score => ({
      number: score.number,
      positionScore: score.positionScore,
      gapScore: score.gapPatternScore,
      sequenceScore: score.sequenceScore,
      totalScore: score.totalOrderScore,
      preferredPosition: score.preferredPosition
    }))
    
    const orderedEuroPredictions: OrderBasedPrediction[] = topEuroNumbers.map(score => ({
      number: score.number,
      positionScore: score.positionScore,
      gapScore: score.gapPatternScore,
      sequenceScore: score.sequenceScore,
      totalScore: score.totalOrderScore,
      preferredPosition: score.preferredPosition
    }))
    
    return {
      mainPredictions: orderedMainPredictions,
      euroPredictions: orderedEuroPredictions,
      patternInsights: analysis.patternInsights
    }
  }, [draws])
  
  // Function to find closest number in an array to a target
  const findClosestNumber = (target: number, numbers: number[]): { number: number; distance: number } | null => {
    if (numbers.length === 0) return null
    
    let closest = numbers[0]
    let minDistance = Math.abs(target - closest)
    
    for (const num of numbers) {
      const distance = Math.abs(target - num)
      if (distance < minDistance) {
        minDistance = distance
        closest = num
      }
    }
    
    return { number: closest, distance: minDistance }
  }
  
  // Analyze main numbers: for each number in latest draw, find which numbers followed it historically
  const mainNumbersAnalysis = React.useMemo(() => {
    const analysis: NextNumberAnalysis[] = []
    
    latestDraw.numbers.forEach(currentNum => {
      const followersMap: { [key: number]: number } = {}
      
      // Go through historical draws (skip the first one as it's the latest)
      for (let i = 1; i < draws.length; i++) {
        const previousDraw = draws[i]
        const nextDraw = draws[i - 1]
        
        // Check if currentNum was in this historical draw
        if (previousDraw.numbers.includes(currentNum)) {
          // Find the closest number in the next draw
          const closest = findClosestNumber(currentNum, nextDraw.numbers)
          if (closest) {
            followersMap[closest.number] = (followersMap[closest.number] || 0) + 1
          }
        }
      }
      
      // Convert to array and sort by frequency
      const followers = Object.entries(followersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          distance: Math.abs(currentNum - parseInt(num)),
          count
        }))
        .sort((a, b) => b.count - a.count)
      
      if (followers.length > 0) {
        analysis.push({
          currentNumber: currentNum,
          closestFollowers: followers.slice(0, 5),
          mostCommonFollower: followers[0].number,
          followerCount: followers[0].count
        })
      }
    })
    
    return analysis
  }, [draws, latestDraw])
  
  // Analyze euro numbers: same logic for euro numbers
  const euroNumbersAnalysis = React.useMemo(() => {
    const analysis: NextNumberAnalysis[] = []
    
    latestDraw.euroNumbers.forEach(currentNum => {
      const followersMap: { [key: number]: number } = {}
      
      // Go through historical draws
      for (let i = 1; i < draws.length; i++) {
        const previousDraw = draws[i]
        const nextDraw = draws[i - 1]
        
        // Check if currentNum was in this historical draw
        if (previousDraw.euroNumbers.includes(currentNum)) {
          // Find the closest number in the next draw
          const closest = findClosestNumber(currentNum, nextDraw.euroNumbers)
          if (closest) {
            followersMap[closest.number] = (followersMap[closest.number] || 0) + 1
          }
        }
      }
      
      // Convert to array and sort by frequency
      const followers = Object.entries(followersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          distance: Math.abs(currentNum - parseInt(num)),
          count
        }))
        .sort((a, b) => b.count - a.count)
      
      if (followers.length > 0) {
        analysis.push({
          currentNumber: currentNum,
          closestFollowers: followers.slice(0, 5),
          mostCommonFollower: followers[0].number,
          followerCount: followers[0].count
        })
      }
    })
    
    return analysis
  }, [draws, latestDraw])
  
  // Generate predictions based on most common followers
  const predictedMainNumbers = React.useMemo(() => {
    const predicted = mainNumbersAnalysis.map(a => a.mostCommonFollower)
    // Remove duplicates and sort
    return [...new Set(predicted)].sort((a, b) => a - b)
  }, [mainNumbersAnalysis])
  
  const predictedEuroNumbers = React.useMemo(() => {
    const predicted = euroNumbersAnalysis.map(a => a.mostCommonFollower)
    // Remove duplicates and sort
    return [...new Set(predicted)].sort((a, b) => a - b)
  }, [euroNumbersAnalysis])

  // Generate predictions based on the PREVIOUS draw (to compare with actual latest draw)
  const previousDrawPrediction = React.useMemo(() => {
    if (!previousDraw || draws.length < 2) return null

    // Analyze main numbers from previous draw
    const prevMainAnalysis: NextNumberAnalysis[] = []
    previousDraw.numbers.forEach(currentNum => {
      const followersMap: { [key: number]: number } = {}
      
      // Go through historical draws starting from index 2 (skip latest and previous)
      for (let i = 2; i < draws.length; i++) {
        const historicalDraw = draws[i]
        const followingDraw = draws[i - 1]
        
        if (historicalDraw.numbers.includes(currentNum)) {
          const closest = findClosestNumber(currentNum, followingDraw.numbers)
          if (closest) {
            followersMap[closest.number] = (followersMap[closest.number] || 0) + 1
          }
        }
      }
      
      const followers = Object.entries(followersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          distance: Math.abs(currentNum - parseInt(num)),
          count
        }))
        .sort((a, b) => b.count - a.count)
      
      if (followers.length > 0) {
        prevMainAnalysis.push({
          currentNumber: currentNum,
          closestFollowers: followers.slice(0, 5),
          mostCommonFollower: followers[0].number,
          followerCount: followers[0].count
        })
      }
    })

    // Analyze euro numbers from previous draw
    const prevEuroAnalysis: NextNumberAnalysis[] = []
    previousDraw.euroNumbers.forEach(currentNum => {
      const followersMap: { [key: number]: number } = {}
      
      for (let i = 2; i < draws.length; i++) {
        const historicalDraw = draws[i]
        const followingDraw = draws[i - 1]
        
        if (historicalDraw.euroNumbers.includes(currentNum)) {
          const closest = findClosestNumber(currentNum, followingDraw.euroNumbers)
          if (closest) {
            followersMap[closest.number] = (followersMap[closest.number] || 0) + 1
          }
        }
      }
      
      const followers = Object.entries(followersMap)
        .map(([num, count]) => ({
          number: parseInt(num),
          distance: Math.abs(currentNum - parseInt(num)),
          count
        }))
        .sort((a, b) => b.count - a.count)
      
      if (followers.length > 0) {
        prevEuroAnalysis.push({
          currentNumber: currentNum,
          closestFollowers: followers.slice(0, 5),
          mostCommonFollower: followers[0].number,
          followerCount: followers[0].count
        })
      }
    })

    const prevPredictedMain = [...new Set(prevMainAnalysis.map(a => a.mostCommonFollower))].sort((a, b) => a - b)
    const prevPredictedEuro = [...new Set(prevEuroAnalysis.map(a => a.mostCommonFollower))].sort((a, b) => a - b)

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
      <h2>Latest Draw & Next Draw Prediction</h2>
      <p className="info">
        Analysis based on {draws.length} draws. Predictions use <strong>ORDER PATTERN ANALYSIS</strong> as the highest priority,
        combined with historical pattern analysis of closest following numbers.
      </p>
      
      {/* ORDER PATTERN PREDICTION (HIGHEST PRIORITY) */}
      <div className="order-pattern-section" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '25px',
        borderRadius: '12px',
        color: 'white',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: 'white', marginBottom: '15px' }}>
          🏆 ORDER PATTERN ANALYSIS (Highest Priority)
        </h3>
        <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '20px' }}>
          Advanced analysis of positional patterns, gap sequences, and number ordering tendencies.
          Avg gap between numbers: {orderPatternPrediction.patternInsights.avgGapBetweenNumbers.toFixed(1)} | 
          Tendency: {orderPatternPrediction.patternInsights.sequenceTendency}
        </p>
        
        <div className="numbers-display" style={{ marginBottom: '20px' }}>
          <div className="main-numbers-group">
            <span className="label" style={{ color: 'white' }}>Predicted Main Numbers (Position-Aware):</span>
            <div className="number-balls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
              {orderPatternPrediction.mainPredictions.slice(0, 5).map((pred, idx) => (
                <div key={pred.number} style={{ textAlign: 'center' }}>
                  <span className="number-ball main" style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    fontWeight: 'bold',
                    border: '3px solid #FFD700',
                    boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)'
                  }}>
                    {pred.number}
                  </span>
                  <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
                    Pos: {pred.preferredPosition} | Score: {pred.totalScore.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="euro-numbers-group" style={{ marginTop: '20px' }}>
            <span className="label" style={{ color: 'white' }}>Predicted Euro Numbers:</span>
            <div className="number-balls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
              {orderPatternPrediction.euroPredictions.slice(0, 2).map((pred, idx) => (
                <div key={pred.number} style={{ textAlign: 'center' }}>
                  <span className="number-ball euro" style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    fontWeight: 'bold',
                    border: '3px solid #FFD700',
                    boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)'
                  }}>
                    {pred.number}
                  </span>
                  <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
                    Score: {pred.totalScore.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Candidates Detail */}
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Top Candidates by Order Pattern Score:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {orderPatternPrediction.mainPredictions.slice(0, 10).map((pred, idx) => (
              <div key={pred.number} style={{
                background: idx < 5 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '13px',
                border: idx < 5 ? '1px solid rgba(255,215,0,0.5)' : 'none'
              }}>
                <strong>#{idx + 1}: {pred.number}</strong> - Score: {pred.totalScore.toFixed(1)}
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '3px' }}>
                  Pos: {pred.positionScore.toFixed(0)} | Gap: {pred.gapScore.toFixed(0)} | Seq: {pred.sequenceScore.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
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
      
      {/* Prediction Section (Traditional Pattern Analysis) */}
      <div className="prediction-section">
        <h3>Traditional Pattern Analysis Prediction</h3>
        <div className="prediction-card">
          <p className="prediction-disclaimer">
            Based on historical pattern analysis of closest following numbers
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
                <div className="draw-date">Based on pattern analysis</div>
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
      
      {/* Main Numbers Analysis Tables */}
      <div className="analysis-section">
        <h3>Main Numbers Pattern Analysis</h3>
        <p className="analysis-description">
          For each number in the latest draw, showing which numbers most commonly appeared closest to it in the next draw historically.
        </p>
        <div className="pattern-tables">
          {mainNumbersAnalysis.map((analysis) => (
            <div key={analysis.currentNumber} className="pattern-table-card">
              <div className="pattern-header">
                <span className="number-ball-small main">{analysis.currentNumber}</span>
                <span className="arrow">→</span>
                <span className="pattern-title">Most Common Follower:</span>
                <span className="number-ball-small main predicted">{analysis.mostCommonFollower}</span>
                <span className="follower-count">({analysis.followerCount} times)</span>
              </div>
              <table className="pattern-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Following Number</th>
                    <th>Distance</th>
                    <th>Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.closestFollowers.map((follower, idx) => (
                    <tr key={follower.number} className={idx === 0 ? 'predicted-row' : ''}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="number-ball-small main">{follower.number}</span>
                      </td>
                      <td>{follower.distance}</td>
                      <td><strong>{follower.count}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
      
      {/* Euro Numbers Analysis Tables */}
      <div className="analysis-section">
        <h3>Euro Numbers Pattern Analysis</h3>
        <p className="analysis-description">
          For each euro number in the latest draw, showing which euro numbers most commonly appeared closest to it in the next draw historically.
        </p>
        <div className="pattern-tables">
          {euroNumbersAnalysis.map((analysis) => (
            <div key={analysis.currentNumber} className="pattern-table-card">
              <div className="pattern-header">
                <span className="number-ball-small euro">{analysis.currentNumber}</span>
                <span className="arrow">→</span>
                <span className="pattern-title">Most Common Follower:</span>
                <span className="number-ball-small euro predicted">{analysis.mostCommonFollower}</span>
                <span className="follower-count">({analysis.followerCount} times)</span>
              </div>
              <table className="pattern-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Following Number</th>
                    <th>Distance</th>
                    <th>Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.closestFollowers.map((follower, idx) => (
                    <tr key={follower.number} className={idx === 0 ? 'predicted-row' : ''}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="number-ball-small euro">{follower.number}</span>
                      </td>
                      <td>{follower.distance}</td>
                      <td><strong>{follower.count}</strong></td>
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
