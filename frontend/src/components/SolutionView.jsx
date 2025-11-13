import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './SolutionView.css'

const SolutionView = ({ problem, solutions }) => {
  const [selectedMethod, setSelectedMethod] = useState('exact')

  const methodNames = {
    northwest: 'North-West Corner',
    leastcost: 'Least Cost Method',
    vogel: "Vogel's Approximation",
    exact: 'Exact LP Solution'
  }

  const formatAllocationTable = (allocation, costs) => {
    const rows = allocation.length
    const cols = allocation[0].length
    
    return (
      <div className="allocation-table">
        <div className="table-header">
          <div className="corner-cell">From/To</div>
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} className="header-cell">Customer {j + 1}</div>
          ))}
          <div className="header-cell">Supply</div>
        </div>
        
        {allocation.map((row, i) => (
          <div key={i} className="table-row">
            <div className="header-cell">Warehouse {i + 1}</div>
            {row.map((value, j) => (
              <div key={j} className="data-cell">
                <div className="value">{value}</div>
                <div className="cost">@ ${costs[i][j]}</div>
                <div className="total">${(value * costs[i][j]).toFixed(0)}</div>
              </div>
            ))}
            <div className="supply-cell">
              {problem.supply[i]}
            </div>
          </div>
        ))}
        
        <div className="table-footer">
          <div className="header-cell">Demand</div>
          {problem.demand.map((d, j) => (
            <div key={j} className="demand-cell">{d}</div>
          ))}
          <div className="total-cell">
            ∑ = {problem.supply.reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>
    )
  }

  const solutionData = Object.entries(solutions).map(([method, data]) => ({
    method: methodNames[method],
    cost: data.total_cost || 0,
    time: data.computation_time || 0,
    efficiency: data.total_cost ? (solutions.exact.total_cost / data.total_cost * 100) : 0
  }))

  const selectedSolution = solutions[selectedMethod]

  return (
    <div className="solution-view">
      <div className="solution-header">
        <h2>Solution Results</h2>
        <p>Problem: {problem.name}</p>
      </div>

      <div className="solution-controls">
        <label>Select Solution Method:</label>
        <select 
          value={selectedMethod} 
          onChange={(e) => setSelectedMethod(e.target.value)}
        >
          {Object.entries(methodNames).map(([key, name]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>

      {selectedSolution && !selectedSolution.error ? (
        <div className="solution-details">
          <div className="solution-card">
            <h3>{methodNames[selectedMethod]}</h3>
            <div className="solution-metrics">
              <div className="metric">
                <span className="metric-label">Total Cost:</span>
                <span className="metric-value">${selectedSolution.total_cost.toFixed(2)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Computation Time:</span>
                <span className="metric-value">{selectedSolution.computation_time.toFixed(2)} ms</span>
              </div>
              <div className="metric">
                <span className="metric-label">Optimality:</span>
                <span className="metric-value">
                  {selectedMethod === 'exact' ? '100%' : 
                   `${(solutions.exact.total_cost / selectedSolution.total_cost * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>

            <div className="allocation-section">
              <h4>Optimal Allocation</h4>
              {formatAllocationTable(selectedSolution.allocation, problem.costs)}
            </div>
          </div>
        </div>
      ) : (
        <div className="error-message">
          <p>Error in {methodNames[selectedMethod]}: {selectedSolution?.error}</p>
        </div>
      )}

      <div className="comparison-section">
        <h3>Method Comparison</h3>
        <div className="charts-container">
          <div className="chart">
            <h4>Total Cost Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={solutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
                <Legend />
                <Bar dataKey="cost" fill="#8884d8" name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart">
            <h4>Computation Time (ms)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={solutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="time" fill="#82ca9d" name="Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>🏆 Best Method</h4>
            <p>Exact LP guarantees optimal solution but may take longer for large problems</p>
          </div>
          <div className="insight-card">
            <h4>⚡ Fastest Method</h4>
            <p>North-West Corner is fastest but may not provide optimal solutions</p>
          </div>
          <div className="insight-card">
            <h4>💰 Cost Savings</h4>
            <p>Optimal solution can save {((solutions.northwest.total_cost - solutions.exact.total_cost) / solutions.northwest.total_cost * 100).toFixed(1)}% compared to naive allocation</p>
          </div>
          <div className="insight-card">
            <h4>🎯 Recommended</h4>
            <p>Vogel's method provides excellent balance of speed and accuracy ({(solutions.exact.total_cost / solutions.vogel.total_cost * 100).toFixed(1)}% of optimal)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SolutionView