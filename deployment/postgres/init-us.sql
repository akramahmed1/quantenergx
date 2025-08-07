-- PostgreSQL initialization script for US region
-- QuantEnergx Oil & Gas Trading Platform

-- Set timezone for US region
SET timezone = 'America/New_York';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for US trading operations
CREATE SCHEMA IF NOT EXISTS us_trading;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA us_trading GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO quantenergx_us;
ALTER DEFAULT PRIVILEGES IN SCHEMA us_trading GRANT USAGE, SELECT ON SEQUENCES TO quantenergx_us;

-- Create tables for US region compliance tracking
CREATE TABLE IF NOT EXISTS us_trading.compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) NOT NULL,
    compliance_type VARCHAR(50) NOT NULL, -- 'SOX', 'CFTC', etc.
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_logs_transaction_id ON us_trading.compliance_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at ON us_trading.compliance_logs(created_at);

-- Insert initial compliance configuration
INSERT INTO us_trading.compliance_logs (transaction_id, compliance_type, status) 
VALUES ('INIT-001', 'SOX', 'initialized') 
ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'US region PostgreSQL initialization completed successfully';
END $$;