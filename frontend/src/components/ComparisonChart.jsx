import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './ComparisonChart.css'

const ComparisonChart = ({ solutions }) => {
  const methodNames = {
    northwest: 'North-West Corner',
    leastcost: 'Least Cost Method',
    vogel: "Vogel's Approximation",
    exact: 'Exact LP Solution'
  }

  const chartData = Object.entries(solutions)
    .filter(([_, data]) => !data.error)
    .map(([method, data]) => ({
      method: methodNames[method],
      cost: data.total_cost,
      time: data.computation_time,
      efficiency: data.total_cost ? (solutions.exact.total_cost / data.total_cost * 100) : 0
    }))

  const costSavingData = chartData.map(item => ({
    name: item.method,
    value: item.cost - Math.min(...chartData.map(d => d.cost)),
    savings: Math.max(...chartData.map(d => d.cost)) - item.cost
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  const bestSolution = chartData.reduce((best, current) => 
    current.cost < best.cost ? current : best
  )

  return (
    <div className="comparison-chart">
      <div className="chart-header">
        <h2>Comprehensive Method Comparison</h2>
        <p>Detailed analysis of all solution methods</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card best-method">
          <h3>🏆 Best Method</h3>
          <div className="summary-content">
            <div className="method-name">{bestSolution.method}</div>
            <div className="method-cost">${bestSolution.cost.toFixed(2)}</div>
            <div className="method-time">{bestSolution.time.toFixed(2)} ms</div>
          </div>
        </div>

        <div className="summary-card cost-savings">
          <h3>💰 Maximum Savings</h3>
          <div className="summary-content">
            <div className="savings-amount">
              ${(Math.max(...chartData.map(d => d.cost)) - bestSolution.cost).toFixed(2)}
            </div>
            <div className="savings-percent">
              {((Math.max(...chartData.map(d => d.cost)) - bestSolution.cost) / Math.max(...chartData.map(d => d.cost)) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="summary-card performance">
          <h3>⚡ Fastest Method</h3>
          <div className="summary-content">
            <div className="fastest-method">
              {chartData.reduce((fastest, current) => 
                current.time < fastest.time ? current : fastest
              ).method}
            </div>
            <div className="fastest-time">
              {Math.min(...chartData.map(d => d.time)).toFixed(2)} ms
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Total Cost Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
              <Legend />
              <Bar dataKey="cost" fill="#8884d8" name="Total Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Computation Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} ms`, 'Time']} />
              <Legend />
              <Bar dataKey="time" fill="#82ca9d" name="Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Optimality Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, efficiency }) => `${name}: ${efficiency.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="efficiency"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Efficiency']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Cost Savings Potential</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costSavingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Savings']} />
              <Legend />
              <Bar dataKey="savings" fill="#ffc658" name="Potential Savings ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recommendation-section">
        <h3>🎯 Implementation Recommendations</h3>
        <div className="recommendation-grid">
          <div className="recommendation-card">
            <h4>For Small Problems (&lt; 10×10)</h4>
            <ul>
              <li>Use <strong>Exact LP Solution</strong> for guaranteed optimality</li>
              <li>Computation time is negligible</li>
              <li>Easy to implement and verify</li>
            </ul>
          </div>

          <div className="recommendation-card">
            <h4>For Medium Problems (10×10 to 50×50)</h4>
            <ul>
              <li>Use <strong>Vogel's Approximation</strong> for best balance</li>
              <li>Provides near-optimal solutions quickly</li>
              <li>Good for real-time decision support</li>
            </ul>
          </div>

          <div className="recommendation-card">
            <h4>For Large Problems (&gt; 50×50)</h4>
            <ul>
              <li>Use <strong>Least Cost Method</strong> for initial solution</li>
              <li>Consider heuristic improvements</li>
              <li>Parallel processing recommended</li>
            </ul>
          </div>

          <div className="recommendation-card">
            <h4>Production Systems</h4>
            <ul>
              <li>Combine multiple methods</li>
              <li>Use Vogel's for quick estimates</li>
              <li>Run Exact LP overnight for verification</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="method-details">
        <h3>Method Characteristics</h3>
        <div className="details-table">
          <div className="details-header">
            <div>Method</div>
            <div>Optimality</div>
            <div>Speed</div>
            <div>Complexity</div>
            <div>Best Use Case</div>
          </div>
          
          {chartData.map((item, index) => (
            <div key={item.method} className="details-row">
              <div className="method-name">{item.method}</div>
              <div className="optimality">
                <div className="optimality-bar">
                  <div 
                    className="optimality-fill"
                    style={{ width: `${item.efficiency}%` }}
                  ></div>
                </div>
                <span>{item.efficiency.toFixed(1)}%</span>
              </div>
              <div className="speed">
                <div className="speed-bar">
                  <div 
                    className="speed-fill"
                    style={{ width: `${(1 - item.time / Math.max(...chartData.map(d => d.time))) * 100}%` }}
                  ></div>
                </div>
                <span>{item.time.toFixed(2)} ms</span>
              </div>
              <div className="complexity">
                {item.method.includes('Exact') ? 'High' : 
                 item.method.includes('Vogel') ? 'Medium' : 'Low'}
              </div>
              <div className="use-case">
                {item.method.includes('Exact') ? 'Critical applications' :
                 item.method.includes('Vogel') ? 'Balanced requirements' :
                 item.method.includes('Least') ? 'Large problems' : 'Quick estimates'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ComparisonChart