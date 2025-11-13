-- Create database if it doesn't exist
SELECT 'CREATE DATABASE transportation_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'transportation_db')\gexec

-- Connect to database
\c transportation_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS transportation_problem (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    supply JSONB NOT NULL,
    demand JSONB NOT NULL,
    costs JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solution (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES transportation_problem(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,
    allocation JSONB NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    computation_time DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_solution_problem_id ON solution(problem_id);
CREATE INDEX IF NOT EXISTS idx_solution_method ON solution(method);
CREATE INDEX IF NOT EXISTS idx_problem_created_at ON transportation_problem(created_at);

-- Insert sample data
INSERT INTO transportation_problem (name, supply, demand, costs) VALUES (
    'Sample Problem 1',
    '[100, 150, 120]',
    '[80, 100, 90, 100]',
    '[[4, 6, 8, 4], [5, 4, 3, 7], [3, 5, 6, 8]]'
) ON CONFLICT DO NOTHING;

INSERT INTO transportation_problem (name, supply, demand, costs) VALUES (
    'Sample Problem 2',
    '[200, 300]',
    '[150, 200, 150]',
    '[[2, 3, 4], [5, 2, 3]]'
) ON CONFLICT DO NOTHING;