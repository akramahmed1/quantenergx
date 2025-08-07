-- PostgreSQL initialization script for EU region
-- QuantEnergx Oil & Gas Trading Platform

-- Set timezone for EU region
SET timezone = 'Europe/London';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for US trading operations
CREATE SCHEMA IF NOT EXISTS eu_trading;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA eu_trading GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO quantenergx_eu;
ALTER DEFAULT PRIVILEGES IN SCHEMA eu_trading GRANT USAGE, SELECT ON SEQUENCES TO quantenergx_eu;

-- Create tables for EU region compliance tracking
CREATE TABLE IF NOT EXISTS eu_trading.compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) NOT NULL,
    compliance_type VARCHAR(50) NOT NULL, -- 'GDPR', 'CFTC', etc.
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_logs_transaction_id ON eu_trading.compliance_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at ON eu_trading.compliance_logs(created_at);

-- Insert initial compliance configuration
INSERT INTO eu_trading.compliance_logs (transaction_id, compliance_type, status) 
VALUES ('INIT-001', 'GDPR', 'initialized') 
ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'EU region PostgreSQL initialization completed successfully';
END $$;