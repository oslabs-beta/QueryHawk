-- Migration script for QueryHawk Lean Query Analyzer
-- Run this script to create/update required tables

-- Create user_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    uri_string TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);

-- Ensure queries table has required columns
DO $$ 
BEGIN
    -- Add uri_string column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'queries' AND column_name = 'uri_string') THEN
        ALTER TABLE queries ADD COLUMN uri_string TEXT;
    END IF;
    
    -- Add query_hash column if it doesn't exist (for better query identification)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'queries' AND column_name = 'query_hash') THEN
        ALTER TABLE queries ADD COLUMN query_hash TEXT;
        -- Create index on query_hash
        CREATE INDEX IF NOT EXISTS idx_queries_query_hash ON queries(query_hash);
    END IF;
END $$;

-- Update existing queries to have a default uri_string if NULL
UPDATE queries SET uri_string = 'default' WHERE uri_string IS NULL;

-- Ensure metrics table has required columns
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metrics' AND column_name = 'shared_hit_blocks') THEN
        ALTER TABLE metrics ADD COLUMN shared_hit_blocks INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metrics' AND column_name = 'shared_read_blocks') THEN
        ALTER TABLE metrics ADD COLUMN shared_read_blocks INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'metrics' AND column_name = 'cache_hit_ratio') THEN
        ALTER TABLE metrics ADD COLUMN cache_hit_ratio DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- Create a view for easier query analysis
CREATE OR REPLACE VIEW query_analysis_view AS
SELECT 
    q.id,
    q.query_name,
    q.query_text,
    q.created_at,
    m.execution_time,
    m.planning_time,
    m.total_cost,
    m.shared_hit_blocks,
    m.shared_read_blocks,
    m.cache_hit_ratio,
    m.rows_returned,
    m.actual_loops,
    m.startup_cost,
    u.id as user_id
FROM queries q
JOIN metrics m ON q.id = m.query_id
JOIN users u ON q.user_id = u.id;

-- Grant necessary permissions
GRANT SELECT ON query_analysis_view TO PUBLIC;
