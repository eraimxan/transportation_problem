import React, { useState } from 'react'
import './ProblemForm.css'

const ProblemForm = ({ onSubmit, savedProblems, onLoadProblem }) => {
  const [problemName, setProblemName] = useState('')
  const [warehouses, setWarehouses] = useState(3)
  const [customers, setCustomers] = useState(4)
  const [supply, setSupply] = useState([100, 150, 120])
  const [demand, setDemand] = useState([80, 100, 90, 100])
  const [costs, setCosts] = useState([
    [4, 6, 8, 4],
    [5, 4, 3, 7],
    [3, 5, 6, 8]
  ])

  const updateMatrixSize = (newWarehouses, newCustomers) => {
    const newSupply = [...supply]
    const newDemand = [...demand]
    const newCosts = [...costs]

    // Adjust supply
    while (newSupply.length < newWarehouses) {
      newSupply.push(100)
    }
    while (newSupply.length > newWarehouses) {
      newSupply.pop()
    }

    // Adjust demand
    while (newDemand.length < newCustomers) {
      newDemand.push(100)
    }
    while (newDemand.length > newCustomers) {
      newDemand.pop()
    }

    // Adjust costs matrix
    while (newCosts.length < newWarehouses) {
      newCosts.push(Array(newCustomers).fill(1))
    }
    while (newCosts.length > newWarehouses) {
      newCosts.pop()
    }

    for (let i = 0; i < newWarehouses; i++) {
      while (newCosts[i].length < newCustomers) {
        newCosts[i].push(1)
      }
      while (newCosts[i].length > newCustomers) {
        newCosts[i].pop()
      }
    }

    setSupply(newSupply)
    setDemand(newDemand)
    setCosts(newCosts)
    setWarehouses(newWarehouses)
    setCustomers(newCustomers)
  }

  const handleSupplyChange = (index, value) => {
    const newSupply = [...supply]
    newSupply[index] = parseInt(value) || 0
    setSupply(newSupply)
  }

  const handleDemandChange = (index, value) => {
    const newDemand = [...demand]
    newDemand[index] = parseInt(value) || 0
    setDemand(newDemand)
  }

  const handleCostChange = (i, j, value) => {
    const newCosts = [...costs]
    newCosts[i][j] = parseInt(value) || 0
    setCosts(newCosts)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate balanced problem
    const totalSupply = supply.reduce((a, b) => a + b, 0)
    const totalDemand = demand.reduce((a, b) => a + b, 0)
    
    if (totalSupply !== totalDemand) {
      alert(`Problem is not balanced! Supply (${totalSupply}) ≠ Demand (${totalDemand})`)
      return
    }

    onSubmit({
      name: problemName || `Problem_${Date.now()}`,
      supply,
      demand,
      costs
    })
  }

  const loadExample = () => {
    setProblemName('Example Problem')
    setWarehouses(3)
    setCustomers(4)
    setSupply([100, 150, 120])
    setDemand([80, 100, 90, 100])
    setCosts([
      [4, 6, 8, 4],
      [5, 4, 3, 7],
      [3, 5, 6, 8]
    ])
  }

  return (
    <div className="problem-form">
      <div className="form-section">
        <h2>Problem Configuration</h2>
        
        <div className="saved-problems">
          <h3>Saved Problems</h3>
          {savedProblems.length === 0 ? (
            <p>No saved problems yet.</p>
          ) : (
            <div className="problem-list">
              {savedProblems.map(problem => (
                <div key={problem.id} className="problem-item">
                  <span>{problem.name}</span>
                  <button onClick={() => onLoadProblem(problem.id)}>
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Problem Name:</label>
            <input
              type="text"
              value={problemName}
              onChange={(e) => setProblemName(e.target.value)}
              placeholder="Enter problem name"
            />
          </div>
          
          <button type="button" className="example-btn" onClick={loadExample}>
            Load Example
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Number of Warehouses:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={warehouses}
              onChange={(e) => updateMatrixSize(parseInt(e.target.value), customers)}
            />
          </div>
          
          <div className="form-group">
            <label>Number of Customer Zones:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={customers}
              onChange={(e) => updateMatrixSize(warehouses, parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Supply Capacities</h3>
          <div className="supply-grid">
            {supply.map((value, index) => (
              <div key={index} className="input-cell">
                <label>Warehouse {index + 1}:</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => handleSupplyChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Demand Requirements</h3>
          <div className="demand-grid">
            {demand.map((value, index) => (
              <div key={index} className="input-cell">
                <label>Customer {index + 1}:</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => handleDemandChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Transportation Cost Matrix</h3>
          <div className="cost-matrix">
            <div className="matrix-header">
              <div className="corner-cell"></div>
              {demand.map((_, j) => (
                <div key={j} className="header-cell">Customer {j + 1}</div>
              ))}
            </div>
            
            {costs.map((row, i) => (
              <div key={i} className="matrix-row">
                <div className="header-cell">Warehouse {i + 1}</div>
                {row.map((cost, j) => (
                  <div key={j} className="matrix-cell">
                    <input
                      type="number"
                      min="0"
                      value={cost}
                      onChange={(e) => handleCostChange(i, j, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="solve-btn">
            Solve Transportation Problem
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProblemForm