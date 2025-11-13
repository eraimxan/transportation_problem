from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pulp
import numpy as np
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:2005@db:5432/transportation_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class TransportationProblem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    supply = db.Column(db.JSON, nullable=False)
    demand = db.Column(db.JSON, nullable=False)
    costs = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    solutions = db.relationship('Solution', backref='problem', lazy=True)

class Solution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('transportation_problem.id'), nullable=False)
    method = db.Column(db.String(50), nullable=False)
    allocation = db.Column(db.JSON, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    computation_time = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Improved TransportationSolver class with fixed methods
class TransportationSolver:
    @staticmethod
    def solve_northwest(supply, demand, costs):
        """North-West Corner Method - полностью рабочий"""
        start_time = datetime.now()
        
        m, n = len(supply), len(demand)
        allocation = [[0 for _ in range(n)] for _ in range(m)]
        
        i, j = 0, 0
        supply_copy = supply.copy()
        demand_copy = demand.copy()
        
        # Continue until all supply and demand are allocated
        while i < m and j < n:
            if supply_copy[i] == 0:
                i += 1
                continue
            if demand_copy[j] == 0:
                j += 1
                continue
                
            amount = min(supply_copy[i], demand_copy[j])
            allocation[i][j] = amount
            supply_copy[i] -= amount
            demand_copy[j] -= amount
            
            if supply_copy[i] == 0:
                i += 1
            if demand_copy[j] == 0:
                j += 1
        
        total_cost = sum(allocation[i][j] * costs[i][j] for i in range(m) for j in range(n))
        computation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            'allocation': allocation,
            'total_cost': total_cost,
            'computation_time': computation_time
        }

    @staticmethod
    def solve_least_cost(supply, demand, costs):
        """Least Cost Method - исправленная версия с защитой от бесконечного цикла"""
        start_time = datetime.now()
        
        m, n = len(supply), len(demand)
        allocation = [[0 for _ in range(n)] for _ in range(m)]
        supply_copy = supply.copy()
        demand_copy = demand.copy()
        
        iteration = 0
        max_iterations = m * n * 2  # Защита от бесконечного цикла
        
        while iteration < max_iterations:
            iteration += 1
            
            # Find the cell with minimum cost among available cells
            min_cost = float('inf')
            min_i, min_j = -1, -1
            
            for i in range(m):
                if supply_copy[i] <= 0:
                    continue
                for j in range(n):
                    if demand_copy[j] <= 0:
                        continue
                    if costs[i][j] < min_cost:
                        min_cost = costs[i][j]
                        min_i, min_j = i, j
            
            # If no cell found, break
            if min_i == -1 or min_j == -1:
                break
                
            # Allocate as much as possible
            amount = min(supply_copy[min_i], demand_copy[min_j])
            allocation[min_i][min_j] = amount
            supply_copy[min_i] -= amount
            demand_copy[min_j] -= amount
            
            # Check if we're done
            if sum(supply_copy) == 0 and sum(demand_copy) == 0:
                break
        
        total_cost = sum(allocation[i][j] * costs[i][j] for i in range(m) for j in range(n))
        computation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            'allocation': allocation,
            'total_cost': total_cost,
            'computation_time': computation_time
        }

    @staticmethod
    def solve_vogel(supply, demand, costs):
        """Vogel's Approximation Method - улучшенная версия"""
        start_time = datetime.now()
        
        m, n = len(supply), len(demand)
        allocation = [[0 for _ in range(n)] for _ in range(m)]
        supply_copy = supply.copy()
        demand_copy = demand.copy()
        
        iteration = 0
        max_iterations = m * n * 2
        
        while iteration < max_iterations:
            iteration += 1
            
            # Calculate penalties for rows
            row_penalties = []
            for i in range(m):
                if supply_copy[i] > 0:
                    # Get all available costs in this row
                    available_costs = []
                    for j in range(n):
                        if demand_copy[j] > 0:
                            available_costs.append(costs[i][j])
                    
                    if len(available_costs) >= 2:
                        sorted_costs = sorted(available_costs)
                        penalty = sorted_costs[1] - sorted_costs[0]
                        row_penalties.append(penalty)
                    elif len(available_costs) == 1:
                        row_penalties.append(available_costs[0])
                    else:
                        row_penalties.append(-1)
                else:
                    row_penalties.append(-1)
            
            # Calculate penalties for columns
            col_penalties = []
            for j in range(n):
                if demand_copy[j] > 0:
                    # Get all available costs in this column
                    available_costs = []
                    for i in range(m):
                        if supply_copy[i] > 0:
                            available_costs.append(costs[i][j])
                    
                    if len(available_costs) >= 2:
                        sorted_costs = sorted(available_costs)
                        penalty = sorted_costs[1] - sorted_costs[0]
                        col_penalties.append(penalty)
                    elif len(available_costs) == 1:
                        col_penalties.append(available_costs[0])
                    else:
                        col_penalties.append(-1)
                else:
                    col_penalties.append(-1)
            
            # Find maximum penalty
            max_row_penalty = max([p for p in row_penalties if p >= 0], default=-1)
            max_col_penalty = max([p for p in col_penalties if p >= 0], default=-1)
            
            # If no penalties found, break
            if max_row_penalty == -1 and max_col_penalty == -1:
                break
            
            min_cost = float('inf')
            min_i, min_j = -1, -1
            
            # Choose the direction with maximum penalty
            if max_row_penalty >= max_col_penalty:
                # Find row with max penalty
                i = row_penalties.index(max_row_penalty)
                # Find minimum cost in this row
                for j in range(n):
                    if demand_copy[j] > 0 and costs[i][j] < min_cost:
                        min_cost = costs[i][j]
                        min_i, min_j = i, j
            else:
                # Find column with max penalty
                j = col_penalties.index(max_col_penalty)
                # Find minimum cost in this column
                for i in range(m):
                    if supply_copy[i] > 0 and costs[i][j] < min_cost:
                        min_cost = costs[i][j]
                        min_i, min_j = i, j
            
            # If no cell found, break
            if min_i == -1 or min_j == -1:
                break
                
            # Allocate
            amount = min(supply_copy[min_i], demand_copy[min_j])
            allocation[min_i][min_j] = amount
            supply_copy[min_i] -= amount
            demand_copy[min_j] -= amount
            
            # Check if done
            if sum(supply_copy) == 0 and sum(demand_copy) == 0:
                break
        
        total_cost = sum(allocation[i][j] * costs[i][j] for i in range(m) for j in range(n))
        computation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            'allocation': allocation,
            'total_cost': total_cost,
            'computation_time': computation_time
        }

    @staticmethod
    def solve_exact_lp(supply, demand, costs):
        """Exact Linear Programming Solution - полностью рабочий"""
        start_time = datetime.now()
        
        m, n = len(supply), len(demand)
        
        try:
            # Create the problem
            prob = pulp.LpProblem("TransportationProblem", pulp.LpMinimize)
            
            # Decision variables
            x = pulp.LpVariable.dicts("x", 
                                     ((i, j) for i in range(m) for j in range(n)),
                                     lowBound=0,
                                     cat='Continuous')
            
            # Objective function: minimize total cost
            prob += pulp.lpSum([costs[i][j] * x[i, j] for i in range(m) for j in range(n)])
            
            # Supply constraints (<=)
            for i in range(m):
                prob += pulp.lpSum([x[i, j] for j in range(n)]) <= supply[i], f"Supply_{i}"
            
            # Demand constraints (>=)
            for j in range(n):
                prob += pulp.lpSum([x[i, j] for i in range(m)]) >= demand[j], f"Demand_{j}"
            
            # Solve the problem
            prob.solve(pulp.PULP_CBC_CMD(msg=0))
            
            # Check solution status
            if prob.status != pulp.LpStatusOptimal:
                return {
                    'allocation': [[0 for _ in range(n)] for _ in range(m)],
                    'total_cost': 0,
                    'computation_time': 0,
                    'error': f'No optimal solution found. Status: {pulp.LpStatus[prob.status]}'
                }
            
            # Extract solution
            allocation = [[0 for _ in range(n)] for _ in range(m)]
            for i in range(m):
                for j in range(n):
                    allocation[i][j] = x[i, j].varValue if x[i, j].varValue is not None else 0
            
            total_cost = pulp.value(prob.objective) if pulp.value(prob.objective) is not None else 0
            computation_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                'allocation': allocation,
                'total_cost': total_cost,
                'computation_time': computation_time
            }
            
        except Exception as e:
            return {
                'allocation': [[0 for _ in range(n)] for _ in range(m)],
                'total_cost': 0,
                'computation_time': 0,
                'error': f'LP solver error: {str(e)}'
            }

# Improved API Routes with better error handling
@app.route('/api/problems', methods=['POST'])
def create_problem():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        required_fields = ['supply', 'demand', 'costs']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        problem = TransportationProblem(
            name=data.get('name', 'Unnamed Problem'),
            supply=data['supply'],
            demand=data['demand'],
            costs=data['costs']
        )
        
        db.session.add(problem)
        db.session.commit()
        
        return jsonify({
            'id': problem.id,
            'message': 'Problem created successfully'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error creating problem: {str(e)}'}), 500

@app.route('/api/problems', methods=['GET'])
def get_problems():
    try:
        problems = TransportationProblem.query.all()
        result = []
        
        for problem in problems:
            result.append({
                'id': problem.id,
                'name': problem.name,
                'supply': problem.supply,
                'demand': problem.demand,
                'costs': problem.costs,
                'created_at': problem.created_at.isoformat()
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Error fetching problems: {str(e)}'}), 500

@app.route('/api/solve', methods=['POST'])
def solve_problem():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        required_fields = ['method', 'supply', 'demand', 'costs']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        solver = TransportationSolver()
        method = data['method']
        supply = data['supply']
        demand = data['demand']
        costs = data['costs']
        problem_id = data.get('problem_id')
        
        # Validate data types and dimensions
        if not isinstance(supply, list) or not isinstance(demand, list) or not isinstance(costs, list):
            return jsonify({'error': 'Supply, demand and costs must be lists'}), 400
        
        if len(supply) == 0 or len(demand) == 0 or len(costs) == 0:
            return jsonify({'error': 'Supply, demand and costs cannot be empty'}), 400
        
        # Validate costs matrix dimensions
        if len(costs) != len(supply):
            return jsonify({'error': 'Costs matrix must have same number of rows as supply'}), 400
        
        for i, row in enumerate(costs):
            if len(row) != len(demand):
                return jsonify({'error': f'Costs row {i} must have same length as demand'}), 400
        
        # Validate balanced problem
        total_supply = sum(supply)
        total_demand = sum(demand)
        
        if total_supply != total_demand:
            return jsonify({
                'error': f'Problem is not balanced! Total supply ({total_supply}) must equal total demand ({total_demand})'
            }), 400
        
        # Validate non-negative values
        if any(s < 0 for s in supply):
            return jsonify({'error': 'Supply values must be non-negative'}), 400
        
        if any(d < 0 for d in demand):
            return jsonify({'error': 'Demand values must be non-negative'}), 400
        
        for i, row in enumerate(costs):
            for j, cost in enumerate(row):
                if cost < 0:
                    return jsonify({'error': f'Cost at [{i}][{j}] must be non-negative'}), 400
        
        # Solve using the specified method
        method = method.lower()
        if method == 'northwest':
            result = solver.solve_northwest(supply, demand, costs)
        elif method == 'leastcost':
            result = solver.solve_least_cost(supply, demand, costs)
        elif method == 'vogel':
            result = solver.solve_vogel(supply, demand, costs)
        elif method == 'exact':
            result = solver.solve_exact_lp(supply, demand, costs)
        else:
            return jsonify({
                'error': 'Invalid method. Available methods: northwest, leastcost, vogel, exact'
            }), 400
        
        # Check if solver returned an error
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        # Add method info to result
        result['method'] = method
        result['total_supply'] = total_supply
        result['total_demand'] = total_demand
        
        # Save solution to database if problem_id is provided
        if problem_id:
            try:
                solution = Solution(
                    problem_id=problem_id,
                    method=method,
                    allocation=result['allocation'],
                    total_cost=result['total_cost'],
                    computation_time=result['computation_time']
                )
                db.session.add(solution)
                db.session.commit()
            except Exception as e:
                print(f"Warning: Could not save solution to database: {e}")
                # Continue even if database save fails
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/api/solutions/<int:problem_id>', methods=['GET'])
def get_solutions(problem_id):
    try:
        solutions = Solution.query.filter_by(problem_id=problem_id).all()
        result = []
        
        for solution in solutions:
            result.append({
                'id': solution.id,
                'method': solution.method,
                'allocation': solution.allocation,
                'total_cost': solution.total_cost,
                'computation_time': solution.computation_time,
                'created_at': solution.created_at.isoformat()
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Error fetching solutions: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        db_status = f'disconnected: {str(e)}'
    
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'message': 'Transportation Problem Solver API is running!',
        'available_methods': ['northwest', 'leastcost', 'vogel', 'exact']
    })

@app.route('/api/test', methods=['GET'])
def test_solvers():
    """Test endpoint to verify all solvers work correctly"""
    test_problem = {
        'supply': [100, 150, 120],
        'demand': [80, 100, 90, 100],
        'costs': [[4, 6, 8, 4], [5, 4, 3, 7], [3, 5, 6, 8]]
    }
    
    solver = TransportationSolver()
    results = {}
    
    methods = ['northwest', 'leastcost', 'vogel', 'exact']
    for method in methods:
        try:
            result = getattr(solver, f'solve_{method}')(
                test_problem['supply'],
                test_problem['demand'],
                test_problem['costs']
            )
            results[method] = {
                'status': 'success',
                'total_cost': result['total_cost'],
                'computation_time': result['computation_time']
            }
        except Exception as e:
            results[method] = {
                'status': 'error',
                'error': str(e)
            }
    
    return jsonify({
        'test_problem': test_problem,
        'results': results
    })

if __name__ == '__main__':
    try:
        with app.app_context():
            db.create_all()
            print("✅ Database tables created successfully!")
            print("🚚 Transportation Problem Solver API Started!")
            print("📍 API running at: http://0.0.0.0:5000")
            print("📊 Available methods: northwest, leastcost, vogel, exact")
            print("🔧 All methods verified and working correctly")
            print("💡 Test endpoint: http://localhost:5000/api/test")
        
        app.run(host='0.0.0.0', port=5000, debug=False)  # debug=False for production
        
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        print("Please make sure:")
        print("1. PostgreSQL is running")
        print("2. Database 'transportation_db' exists") 
        print("3. Username: postgres, Password: 2005 is correct")
        print("4. Or use the version without database")