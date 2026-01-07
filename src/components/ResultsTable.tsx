import React from 'react'

type Draw = {
  drawDate: string
  numbers: number[]
  euroNumbers: number[]
  jackpot?: string
  jackpotAmount?: string
}

function formatDate(d: string): string {
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString()
  } catch {
    return d
  }
}

export default function ResultsTable({ draws }: { draws: Draw[] }): JSX.Element {
  return (
    <div className="results">
      <table>
        <thead>
          <tr>
            <th>Draw #</th>
            <th>Date</th>
            <th>Main Numbers (5)</th>
            <th>Euro Numbers (2)</th>
          </tr>
        </thead>
        <tbody>
          {draws.map((d, i) => (
            <tr key={i}>
              <td>#{i + 1}</td>
              <td>{formatDate(d.drawDate)}</td>
              <td>
                {d.numbers.length > 0 ? (
                  <span className="numbers">{d.numbers.join(', ')}</span>
                ) : (
                  <span style={{ color: '#999' }}>No data</span>
                )}
              </td>
              <td>
                {d.euroNumbers.length > 0 ? (
                  <span className="euro-numbers">{d.euroNumbers.join(', ')}</span>
                ) : (
                  <span style={{ color: '#999' }}>No data</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {draws.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>No draw results found in the API response.</p>
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>Check the browser console for error details.</p>
        </div>
      )}
    </div>
  )
}
