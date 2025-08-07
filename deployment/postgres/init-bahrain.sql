-- PostgreSQL initialization script for BAHRAIN region
-- QuantEnergx Oil & Gas Trading Platform

-- Set timezone for BAHRAIN region
SET timezone = 'Asia/Bahrain';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for US trading operations
CREATE SCHEMA IF NOT EXISTS bahrain_trading;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA bahrain_trading GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO quantenergx_bahrain;
ALTER DEFAULT PRIVILEGES IN SCHEMA bahrain_trading GRANT USAGE, SELECT ON SEQUENCES TO quantenergx_bahrain;

-- Create tables for BAHRAIN region compliance tracking
CREATE TABLE IF NOT EXISTS bahrain_trading.compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) NOT NULL,
    compliance_type VARCHAR(50) NOT NULL, -- 'CBB', 'CFTC', etc.
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_logs_transaction_id ON bahrain_trading.compliance_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at ON bahrain_trading.compliance_logs(created_at);

-- Insert initial compliance configuration
INSERT INTO bahrain_trading.compliance_logs (transaction_id, compliance_type, status) 
VALUES ('INIT-001', 'CBB', 'initialized') 
ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'BAHRAIN region PostgreSQL initialization completed successfully';
END $$;