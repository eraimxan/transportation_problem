import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ProblemForm from './components/ProblemForm'
import SolutionView from './components/SolutionView'
import ComparisonChart from './components/ComparisonChart'
import './App.css'

const API_BASE = 'http://localhost:5000/api'

function App() {
  const [currentView, setCurrentView] = useState('problem')
  const [problem, setProblem] = useState(null)
  const [solutions, setSolutions] = useState({})
  const [loading, setLoading] = useState(false)
  const [savedProblems, setSavedProblems] = useState([])

  useEffect(() => {
    fetchSavedProblems()
  }, [])

  const fetchSavedProblems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/problems`)
      setSavedProblems(response.data)
    } catch (error) {
      console.error('Error fetching problems:', error)
    }
  }

  const handleProblemSubmit = async (problemData) => {
    setLoading(true)
    try {
      // Save problem
      const problemResponse = await axios.post(`${API_BASE}/problems`, problemData)
      const problemId = problemResponse.data.id
      
      setProblem({ ...problemData, id: problemId })
      
      // Solve with all methods
      const methods = ['northwest', 'leastcost', 'vogel', 'exact']
      const results = {}
      
      for (const method of methods) {
        try {
          const solutionResponse = await axios.post(`${API_BASE}/solve`, {
            ...problemData,
            method,
            problem_id: problemId
          })
          results[method] = solutionResponse.data
        } catch (error) {
          console.error(`Error solving with ${method}:`, error)
          results[method] = { error: error.response?.data?.error || 'Unknown error' }
        }
      }
      
      setSolutions(results)
      setCurrentView('solutions')
      await fetchSavedProblems()
    } catch (error) {
      console.error('Error:', error)
      alert('Error solving problem: ' + (error.response?.data?.error || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const loadSavedProblem = async (problemId) => {
    setLoading(true)
    try {
      const problem = savedProblems.find(p => p.id === problemId)
      if (problem) {
        setProblem(problem)
        
        // Fetch solutions for this problem
        const solutionsResponse = await axios.get(`${API_BASE}/solutions/${problemId}`)
        const solutionsData = {}
        solutionsResponse.data.forEach(solution => {
          solutionsData[solution.method] = solution
        })
        
        setSolutions(solutionsData)
        setCurrentView('solutions')
      }
    } catch (error) {
      console.error('Error loading problem:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚚 Transportation Problem Optimizer</h1>
        <p>Optimize your logistics with Linear Programming</p>
      </header>

      <nav className="app-nav">
        <button 
          className={currentView === 'problem' ? 'active' : ''}
          onClick={() => setCurrentView('problem')}
        >
          New Problem
        </button>
        <button 
          className={currentView === 'solutions' ? 'active' : ''}
          onClick={() => solutions && setCurrentView('solutions')}
          disabled={!solutions}
        >
          View Solutions
        </button>
        <button 
          className={currentView === 'comparison' ? 'active' : ''}
          onClick={() => solutions && setCurrentView('comparison')}
          disabled={!solutions}
        >
          Comparison
        </button>
      </nav>

      <main className="app-main">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Solving transportation problem...</p>
          </div>
        )}

        {currentView === 'problem' && (
          <ProblemForm 
            onSubmit={handleProblemSubmit}
            savedProblems={savedProblems}
            onLoadProblem={loadSavedProblem}
          />
        )}

        {currentView === 'solutions' && problem && (
          <SolutionView 
            problem={problem}
            solutions={solutions}
          />
        )}

        {currentView === 'comparison' && solutions && (
          <ComparisonChart solutions={solutions} />
        )}
      </main>

      <footer className="app-footer">
        <p>Linear Programming Project - Transportation Problem Optimization</p>
      </footer>
    </div>
  )
}

export default App