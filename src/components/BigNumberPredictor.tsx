import React, { useState, useEffect } from 'react';
import {
  predictFromBigNumberPatterns,
  getBigNumberAnalysisReport,
  drawToBigNumber,
  extractBigNumberPatterns
} from '../utils/bigNumberPatterns';
import drawsData from '../data/eurojackpot_draws.json';

interface Draw {
  drawSystemId: number;
  drawDate: string;
  numbers: number[];
  euroNumbers: number[];
}

export const BigNumberPredictor: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const draws = drawsData as Draw[];

  const runAnalysis = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Get predictions
      const preds = predictFromBigNumberPatterns(draws);
      setPredictions(preds);
      
      // Get detailed analysis
      const report = getBigNumberAnalysisReport(draws);
      setAnalysis(report);
      
      setLoading(false);
    }, 100);
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const formatBigNumber = (bigNum: string) => {
    return bigNum.match(/.{1,2}/g)?.join('-') || bigNum;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '3px solid #3498db', paddingBottom: '10px' }}>
        🔢 Big Number Pattern Predictor
      </h2>
      
      <div style={{ 
        background: '#ecf0f1', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '2px solid #3498db'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>
          💡 Concept: This algorithm treats each draw as a single "big number" using the EXACT order numbers were drawn.
        </p>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#555' }}>
          For example, if the draw order was [12, 22, 28, 30, 31], it becomes "1222283031". This preserves the 
          sequential pattern of how numbers actually appeared, not just their sorted values. We analyze digit sequences,
          transitions, positional frequencies, and mathematical properties to find patterns in the draw sequence.
        </p>        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
          ⚠️ Note: The JSON data file may contain pre-sorted numbers. To get the actual draw order, fetch fresh data
          from the API using the "🔄 Refetch" button in the Results tab.
        </p>      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Analyzing big number patterns...</p>
        </div>
      ) : (
        <>
          {/* Predictions */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2c3e50' }}>🎯 Pattern-Based Predictions</h3>
            {predictions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {predictions.map((pred, index) => (
                  <div 
                    key={index}
                    style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '2px solid #3498db',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                      {pred.method}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Main Numbers:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {pred.predictedNumbers.map((num: number, i: number) => (
                          <div
                            key={i}
                            style={{
                              background: '#3498db',
                              color: 'white',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px'
                            }}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>Euro Numbers:</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {pred.predictedEuroNumbers.map((num: number, i: number) => (
                          <div
                            key={i}
                            style={{
                              background: '#f39c12',
                              color: 'white',
                              width: '35px',
                              height: '35px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                      Confidence: {pred.confidence}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                      {pred.details}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No predictions available</p>
            )}
          </div>

          {/* Analysis Details */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {showDetails ? '▼ Hide' : '▶ Show'} Detailed Analysis
            </button>
          </div>

          {showDetails && analysis && (
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
              {/* Recent Big Numbers */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
                  📊 Recent Draw Big Numbers (Exact Draw Order)
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#3498db', color: 'white' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Draw ID</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Main Big Number</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Euro Big Number</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Digit Sum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.patterns.slice(0, 10).map((pattern: any, index: number) => {
                      // Get the original draw to show the actual numbers
                      const originalDraw = draws.find(d => d.drawSystemId === pattern.drawId);
                      return (
                        <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#ecf0f1' }}>
                          <td style={{ padding: '8px' }}>{pattern.drawId}</td>
                          <td style={{ padding: '8px' }}>{pattern.drawDate}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#e74c3c', marginBottom: '3px' }}>
                              {formatBigNumber(pattern.bigNumber)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              [{originalDraw?.numbers.join(', ')}]
                            </div>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#f39c12', marginBottom: '3px' }}>
                              {pattern.euroBigNumber}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              [{originalDraw?.euroNumbers.join(', ')}]
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <div>{pattern.digitSum}</div>
                            <div style={{ fontSize: '11px', color: '#f39c12' }}>({pattern.euroDigitSum})</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Top Sequences */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
                  🔄 Most Frequent Digit Sequences
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {analysis.topSequences.slice(0, 20).map(([seq, count]: [string, number], index: number) => (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #3498db',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>
                        {seq}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {count} times
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Euro Sequences */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #f39c12', paddingBottom: '5px' }}>
                  ⭐ Most Frequent Euro Number Sequences
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                  {analysis.topEuroSequences.slice(0, 15).map(([seq, count]: [string, number], index: number) => (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #f39c12',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', color: '#f39c12' }}>
                        {seq}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {count} times
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digit Sum Statistics */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
                  ➕ Digit Sum Statistics (Main / Euro)
                </h4>
                <div style={{ background: 'white', padding: '15px', borderRadius: '5px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Min</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
                        {analysis.digitSumStats.min}
                      </div>
                      <div style={{ fontSize: '14px', color: '#f39c12' }}>
                        {analysis.euroDigitSumStats.min}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Max</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
                        {analysis.digitSumStats.max}
                      </div>
                      <div style={{ fontSize: '14px', color: '#f39c12' }}>
                        {analysis.euroDigitSumStats.max}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Average</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3498db' }}>
                        {analysis.digitSumStats.avg.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#f39c12' }}>
                        {analysis.euroDigitSumStats.avg.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Last Draw</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9b59b6' }}>
                        {analysis.digitSumStats.recent[0]}
                      </div>
                      <div style={{ fontSize: '14px', color: '#f39c12' }}>
                        {analysis.euroDigitSumStats.recent[0]}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Last 10 Main Draws:</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                      {analysis.digitSumStats.recent.join(', ')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Last 10 Euro Draws:</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#f39c12' }}>
                      {analysis.euroDigitSumStats.recent.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Digit Transitions */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
                  ➡️ Most Common Digit Transitions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                  {analysis.topTransitions.slice(0, 15).map(([trans, count]: [string, number], index: number) => (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        padding: '8px',
                        borderRadius: '5px',
                        border: '1px solid #3498db',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>
                        {trans}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {count}×
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modulo Distribution */}
              <div>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
                  🔢 Modulo 9 Distribution
                </h4>
                <div style={{ background: 'white', padding: '15px', borderRadius: '5px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '10px' }}>
                    {(Array.from(analysis.moduloDistribution.entries()) as [number, number][])
                      .sort((a, b) => a[0] - b[0])
                      .map(([mod, count]) => (
                        <div key={mod} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
                            {mod}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {count}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              <strong>📌 Note:</strong> This algorithm uses the EXACT sequence in which numbers were drawn (not sorted),
              treating entire draws as concatenated numbers to find sequential and positional patterns. By preserving the
              original draw order, we can detect patterns in how numbers appear sequentially during the actual draw process.
              The predictions combine multiple pattern recognition techniques including sequence frequency, digit transitions,
              and mathematical properties of these "big numbers".
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BigNumberPredictor;
