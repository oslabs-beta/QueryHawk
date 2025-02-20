-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS queryhawk;

-- Create extension for monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create basic roles/permissions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'queryhawk_user') THEN
    CREATE ROLE queryhawk_user WITH LOGIN PASSWORD 'development';
    GRANT ALL PRIVILEGES ON DATABASE queryhawk TO queryhawk_user;
  END IF;
END
$$;