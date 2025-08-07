-- PostgreSQL initialization script for ME region
-- QuantEnergx Oil & Gas Trading Platform

-- Set timezone for ME region
SET timezone = 'Asia/Dubai';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for US trading operations
CREATE SCHEMA IF NOT EXISTS me_trading;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA me_trading GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO quantenergx_me;
ALTER DEFAULT PRIVILEGES IN SCHEMA me_trading GRANT USAGE, SELECT ON SEQUENCES TO quantenergx_me;

-- Create tables for ME region compliance tracking
CREATE TABLE IF NOT EXISTS me_trading.compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) NOT NULL,
    compliance_type VARCHAR(50) NOT NULL, -- 'ADGM', 'CFTC', etc.
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_logs_transaction_id ON me_trading.compliance_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at ON me_trading.compliance_logs(created_at);

-- Insert initial compliance configuration
INSERT INTO me_trading.compliance_logs (transaction_id, compliance_type, status) 
VALUES ('INIT-001', 'ADGM', 'initialized') 
ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'ME region PostgreSQL initialization completed successfully';
END $$;