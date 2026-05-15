import React, { useState, useEffect } from 'react';
import {
  generateEnhancedBigNumberPrediction,
  generateEnhancedAnalysisReport
} from '../utils/enhancedBigNumberPatterns';
import {
  predictFromBigNumberPatterns,
  getBigNumberAnalysisReport
} from '../utils/bigNumberPatterns';

interface Draw {
  drawSystemId?: number;
  drawDate: string;
  numbers: number[];
  euroNumbers?: number[];
}

interface BigNumberPredictorProps {
  draws: Draw[];
}

export const BigNumberPredictor: React.FC<BigNumberPredictorProps> = ({ draws }) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const runAnalysis = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Use enhanced algorithm with digit analysis and recency weighting
      const enhancedPreds = generateEnhancedBigNumberPrediction(draws);
      setPredictions(enhancedPreds);
      
      // Get detailed enhanced analysis
      const enhancedReport = generateEnhancedAnalysisReport(draws);
      setAnalysis(enhancedReport);
      
      setLoading(false);
    }, 100);
  };

  useEffect(() => {
    if (draws && draws.length > 0) {
      runAnalysis();
    }
  }, [draws]);

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
          💡 Enhanced Algorithm: Single Digit + Number Pattern Analysis with Historical Accuracy
        </p>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#555' }}>
          This improved algorithm analyzes:
        </p>
        <ul style={{ margin: '8px 0 0 20px', fontSize: '13px', color: '#555' }}>
          <li><strong>Single Digit Patterns:</strong> Frequency of last digits (0-9) across recent draws with heavy recency weighting</li>
          <li><strong>Digit Pair Transitions:</strong> How consecutive digits appear in the big number sequence</li>
          <li><strong>Historical Accuracy:</strong> Tracks which prediction methods worked best historically</li>
          <li><strong>Recent Draw Focus:</strong> Last 30 draws weighted 85x higher than older draws</li>
          <li><strong>Hybrid Approach:</strong> Combines single digit frequency with whole number analysis</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
          ⚠️ Note: The JSON data file may contain pre-sorted numbers. To get the actual draw order, fetch fresh data
          from the API using the "🔄 Refetch" button in the Results tab.
        </p>      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Analyzing big number patterns...</p>
        </div>
      ) : (
        <>
          {/* Best Prediction for Next Draw - Highlighted */}
          {predictions.length > 0 && (
            <div style={{ 
              marginBottom: '30px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              border: '3px solid #ffd700'
            }}>
              <h3 style={{ 
                color: 'white', 
                margin: '0 0 20px 0',
                fontSize: '24px',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                🌟 BEST PREDICTION FOR NEXT DRAW 🌟
              </h3>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  fontSize: '18px',
                  textAlign: 'center'
                }}>
                  {predictions[0].method}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                    Main Numbers:
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {predictions[0].predictedNumbers.map((num: number, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                          color: 'white',
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '20px',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                          border: '2px solid #fff'
                        }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
                {predictions[0].predictedEuroNumbers && predictions[0].predictedEuroNumbers.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                      Euro Numbers:
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      {predictions[0].predictedEuroNumbers.map((num: number, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                            color: 'white',
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            border: '2px solid #fff'
                          }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ 
                  textAlign: 'center',
                  padding: '15px',
                  background: '#e8f5e9',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: 'bold', marginBottom: '5px' }}>
                    Confidence: {predictions[0].confidence}%
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#555', 
                    fontStyle: 'italic',
                    marginTop: '8px'
                  }}>
                    {predictions[0].details}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Predictions */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2c3e50' }}>🎯 All Pattern-Based Predictions</h3>
            {predictions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {predictions.map((pred, index) => (
                  <div 
                    key={index}
                    style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      border: index === 0 ? '3px solid #ffd700' : '2px solid #3498db',
                      boxShadow: index === 0 ? '0 4px 8px rgba(255, 215, 0, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}
                  >
                    {index === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '10px',
                        background: '#ffd700',
                        color: '#000',
                        padding: '5px 15px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        ⭐ TOP
                      </div>
                    )}
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
                    {pred.predictedEuroNumbers && pred.predictedEuroNumbers.length > 0 && (
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
                    )}
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

          {/* Enhanced Digit Analysis Summary */}
          {analysis && (
            <div style={{
              marginBottom: '25px',
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              padding: '20px',
              borderRadius: '10px',
              border: '2px solid #667eea'
            }}>
              <h3 style={{ color: '#2c3e50', marginTop: 0, marginBottom: '15px' }}>
                📊 Enhanced Digit Analysis (Recent Focus)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontWeight: 'bold' }}>
                    📈 Top Frequent Digits (Last 30 Draws)
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {analysis.topDigits && analysis.topDigits.map((digit: any, i: number) => (
                      <div key={i} style={{
                        background: '#3498db',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontWeight: 'bold' }}>
                    🎯 Top Single Digits (Last Digits)
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {analysis.topSingleDigits && analysis.topSingleDigits.map((digit: any, i: number) => (
                      <div key={i} style={{
                        background: '#f39c12',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontWeight: 'bold' }}>
                  🔗 Top Digit Pair Transitions
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {analysis.topDigitPairs && analysis.topDigitPairs.map((pair: any, i: number) => (
                    <div key={i} style={{
                      background: '#9b59b6',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}>
                      {pair}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                🔍 Method: {analysis.analysisMethod}
              </div>
            </div>
          )}

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
                              [{originalDraw?.euroNumbers?.join(', ') || 'N/A'}]
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
