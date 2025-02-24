--Test tables for a test simulating a user's database. This works in tandem with test_db in docker compose file

-- Table to simulate user queries
CREATE TABLE query_logs (
    id SERIAL PRIMARY KEY,
    query_text TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to simulate application data
CREATE TABLE user_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    amount DECIMAL(10,2),
    status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to generate random timestamps within last hour
CREATE OR REPLACE FUNCTION random_timestamp() 
RETURNS TIMESTAMP AS $$
BEGIN
    RETURN NOW() - (random() * INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Insert sample query logs
INSERT INTO query_logs (query_text, execution_time_ms, created_at)
SELECT 
    'SELECT * FROM large_table WHERE id = ' || (random() * 1000)::int,
    (random() * 500)::int,
    random_timestamp()
FROM generate_series(1, 1000);

-- Insert sample transactions
INSERT INTO user_transactions (user_id, amount, status, created_at)
SELECT 
    (random() * 100)::int,
    (random() * 1000)::decimal(10,2),
    CASE (random() * 3)::int
        WHEN 0 THEN 'completed'
        WHEN 1 THEN 'pending'
        ELSE 'failed'
    END,
    random_timestamp()
FROM generate_series(1, 1000);

-- Create function to simulate ongoing database activity
CREATE OR REPLACE FUNCTION simulate_db_activity() 
RETURNS void AS $$
DECLARE
    random_query TEXT;
    start_time TIMESTAMP;
    query_time INTEGER;
BEGIN
    -- Simulate a slow query
    start_time := clock_timestamp();
    PERFORM pg_sleep(random() * 0.1);
    
    -- Log the query
    query_time := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::INTEGER;
    INSERT INTO query_logs (query_text, execution_time_ms, created_at)
    VALUES ('SELECT * FROM large_table WHERE complex_condition', query_time, NOW());

    -- Simulate some transactions
    INSERT INTO user_transactions (user_id, amount, status)
    VALUES (
        (random() * 100)::int,
        (random() * 1000)::decimal(10,2),
        CASE (random() * 3)::int
            WHEN 0 THEN 'completed'
            WHEN 1 THEN 'pending'
            ELSE 'failed'
        END
    );

    -- Simulate some reads
    PERFORM * FROM user_transactions 
    WHERE user_id = floor(random() * 100);
END;
$$ LANGUAGE plpgsql;

-- Create index to generate index-related metrics
CREATE INDEX idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX idx_query_logs_created_at ON query_logs(created_at);

-- Add some table comments for metadata
COMMENT ON TABLE query_logs IS 'Stores query execution metrics';
COMMENT ON TABLE user_transactions IS 'Simulated user transaction data';

-- Create a view to simulate view-related metrics
CREATE VIEW recent_slow_queries AS
SELECT * FROM query_logs 
WHERE execution_time_ms > 100 
AND created_at > NOW() - INTERVAL '1 hour';