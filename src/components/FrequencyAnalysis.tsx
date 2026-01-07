import React, { useMemo } from 'react'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
  jackpot?: string
  jackpotAmount?: string
}

interface FrequencyAnalysisProps {
  draws: Draw[]
}

export default function FrequencyAnalysis({ draws }: FrequencyAnalysisProps): JSX.Element {
  // Calculate frequency for main numbers (1-50)
  const mainNumbersFrequency = useMemo(() => {
    const frequency: Record<number, number> = {}
    
    // Initialize all numbers 1-50 with 0
    for (let i = 1; i <= 50; i++) {
      frequency[i] = 0
    }
    
    // Count occurrences
    draws.forEach(draw => {
      draw.numbers.forEach(num => {
        if (num >= 1 && num <= 50) {
          frequency[num]++
        }
      })
    })
    
    return frequency
  }, [draws])

  // Calculate frequency for euro numbers (1-12)
  const euroNumbersFrequency = useMemo(() => {
    const frequency: Record<number, number> = {}
    
    // Initialize all numbers 1-12 with 0
    for (let i = 1; i <= 12; i++) {
      frequency[i] = 0
    }
    
    // Count occurrences
    draws.forEach(draw => {
      draw.euroNumbers.forEach(num => {
        if (num >= 1 && num <= 12) {
          frequency[num]++
        }
      })
    })
    
    return frequency
  }, [draws])

  // Calculate last draw index for main numbers (0 = most recent)
  const mainNumbersLastDraw = useMemo(() => {
    const lastDraw: Record<number, number> = {}
    
    // Initialize all numbers 1-50 with -1 (never drawn)
    for (let i = 1; i <= 50; i++) {
      lastDraw[i] = -1
    }
    
    // Find last occurrence (iterate from newest to oldest)
    draws.forEach((draw, index) => {
      draw.numbers.forEach(num => {
        if (num >= 1 && num <= 50 && lastDraw[num] === -1) {
          lastDraw[num] = index
        }
      })
    })
    
    return lastDraw
  }, [draws])

  // Calculate last draw index for euro numbers (0 = most recent)
  const euroNumbersLastDraw = useMemo(() => {
    const lastDraw: Record<number, number> = {}
    
    // Initialize all numbers 1-12 with -1 (never drawn)
    for (let i = 1; i <= 12; i++) {
      lastDraw[i] = -1
    }
    
    // Find last occurrence (iterate from newest to oldest)
    draws.forEach((draw, index) => {
      draw.euroNumbers.forEach(num => {
        if (num >= 1 && num <= 12 && lastDraw[num] === -1) {
          lastDraw[num] = index
        }
      })
    })
    
    return lastDraw
  }, [draws])

  // Get min and max frequencies for color scaling
  const mainNumbersStats = useMemo(() => {
    const values = Object.values(mainNumbersFrequency)
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }, [mainNumbersFrequency])

  const euroNumbersStats = useMemo(() => {
    const values = Object.values(euroNumbersFrequency)
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }, [euroNumbersFrequency])

  // Get min and max last draw indices for color scaling
  const mainNumbersLastDrawStats = useMemo(() => {
    const values = Object.values(mainNumbersLastDraw).filter(v => v !== -1)
    if (values.length === 0) return { min: 0, max: 0 }
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }, [mainNumbersLastDraw])

  const euroNumbersLastDrawStats = useMemo(() => {
    const values = Object.values(euroNumbersLastDraw).filter(v => v !== -1)
    if (values.length === 0) return { min: 0, max: 0 }
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }, [euroNumbersLastDraw])

  // Generate yellow shade based on frequency
  const getYellowShade = (frequency: number, min: number, max: number): string => {
    if (max === min) return 'rgb(255, 253, 231)' // Light yellow if all same
    
    // Normalize frequency to 0-1 range
    const normalized = (frequency - min) / (max - min)
    
    // Map to yellow shades (from light to dark yellow)
    // Light yellow: rgb(255, 253, 231)
    // Dark yellow: rgb(234, 179, 8)
    const r = Math.round(255 - normalized * 21)
    const g = Math.round(253 - normalized * 74)
    const b = Math.round(231 - normalized * 223)
    
    return `rgb(${r}, ${g}, ${b})`
  }

  // Generate blue shade based on recency (lower index = more recent = darker)
  const getRecencyShade = (lastDrawIndex: number, min: number, max: number): string => {
    if (lastDrawIndex === -1) return 'rgb(240, 240, 240)' // Gray for never drawn
    if (max === min) return 'rgb(191, 219, 254)' // Light blue if all same
    
    // Normalize to 0-1 range (invert: 0 is most recent, so should be darkest)
    const normalized = 1 - (lastDrawIndex - min) / (max - min)
    
    // Map to blue shades (from light to dark blue)
    // Light blue: rgb(219, 234, 254)
    // Dark blue: rgb(59, 130, 246)
    const r = Math.round(219 - normalized * 160)
    const g = Math.round(234 - normalized * 104)
    const b = Math.round(254 - normalized * 8)
    
    return `rgb(${r}, ${g}, ${b})`
  }

  // Render number cell with color
  const renderNumberCell = (
    num: number,
    frequency: number,
    min: number,
    max: number
  ): JSX.Element => {
    const bgColor = getYellowShade(frequency, min, max)
    
    return (
      <div
        key={num}
        className="frequency-cell"
        style={{ backgroundColor: bgColor }}
        title={`Number ${num}: ${frequency} occurrences`}
      >
        <div className="frequency-number">{num}</div>
        <div className="frequency-count">{frequency}</div>
      </div>
    )
  }

  // Render number cell with recency color
  const renderRecencyCell = (
    num: number,
    lastDrawIndex: number,
    min: number,
    max: number
  ): JSX.Element => {
    const bgColor = getRecencyShade(lastDrawIndex, min, max)
    const drawsAgo = lastDrawIndex === -1 ? 'Never' : lastDrawIndex === 0 ? 'Last draw' : `${lastDrawIndex} draws ago`
    
    return (
      <div
        key={num}
        className="frequency-cell"
        style={{ backgroundColor: bgColor }}
        title={`Number ${num}: ${drawsAgo}`}
      >
        <div className="frequency-number">{num}</div>
        <div className="frequency-count">{lastDrawIndex === -1 ? '-' : lastDrawIndex}</div>
      </div>
    )
  }

  return (
    <div className="frequency-analysis">
      <div className="frequency-section">
        <h2>Main Numbers Frequency (1-50)</h2>
        <p className="frequency-description">
          Total draws analyzed: {draws.length}
        </p>
        <div className="frequency-grid main-numbers-grid">
          {Object.entries(mainNumbersFrequency).map(([num, freq]) =>
            renderNumberCell(
              parseInt(num),
              freq,
              mainNumbersStats.min,
              mainNumbersStats.max
            )
          )}
        </div>
      </div>

      <div className="frequency-section">
        <h2>Euro Numbers Frequency (1-12)</h2>
        <p className="frequency-description">
          Total draws analyzed: {draws.length}
        </p>
        <div className="frequency-grid euro-numbers-grid">
          {Object.entries(euroNumbersFrequency).map(([num, freq]) =>
            renderNumberCell(
              parseInt(num),
              freq,
              euroNumbersStats.min,
              euroNumbersStats.max
            )
          )}
        </div>
      </div>

      <div className="frequency-section">
        <h2>Main Numbers - Last Appearance (1-50)</h2>
        <p className="frequency-description">
          Shows how many draws ago each number was last drawn (0 = most recent draw)
        </p>
        <div className="frequency-grid main-numbers-grid">
          {Object.entries(mainNumbersLastDraw).map(([num, lastDraw]) =>
            renderRecencyCell(
              parseInt(num),
              lastDraw,
              mainNumbersLastDrawStats.min,
              mainNumbersLastDrawStats.max
            )
          )}
        </div>
      </div>

      <div className="frequency-section">
        <h2>Euro Numbers - Last Appearance (1-12)</h2>
        <p className="frequency-description">
          Shows how many draws ago each number was last drawn (0 = most recent draw)
        </p>
        <div className="frequency-grid euro-numbers-grid">
          {Object.entries(euroNumbersLastDraw).map(([num, lastDraw]) =>
            renderRecencyCell(
              parseInt(num),
              lastDraw,
              euroNumbersLastDrawStats.min,
              euroNumbersLastDrawStats.max
            )
          )}
        </div>
      </div>

      <div className="frequency-legend">
        <h3>Color Legend</h3>
        <div className="legend-gradient">
          <span>Less Frequent</span>
          <div className="gradient-bar"></div>
          <span>More Frequent</span>
        </div>
        <div className="legend-gradient" style={{ marginTop: '10px' }}>
          <span>Drawn Long Ago</span>
          <div className="gradient-bar" style={{ background: 'linear-gradient(to right, rgb(219, 234, 254), rgb(59, 130, 246))' }}></div>
          <span>Recently Drawn</span>
        </div>
      </div>
    </div>
  )
}
