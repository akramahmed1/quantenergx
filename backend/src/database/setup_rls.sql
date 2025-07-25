-- PostgreSQL Row Level Security (RLS) Implementation
-- This script sets up comprehensive RLS policies for the quantenergx database

-- Enable RLS on sensitive tables
-- Note: Tables must exist before running this script

-- ============================================================================
-- USERS TABLE RLS
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY user_own_data ON users
  FOR ALL
  TO authenticated_users
  USING (id = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can see all users
CREATE POLICY admin_all_users ON users
  FOR ALL
  TO admin_users
  USING (true);

-- Policy: Service accounts can access all users (for system operations)
CREATE POLICY service_all_users ON users
  FOR ALL
  TO service_accounts
  USING (true);

-- ============================================================================
-- TRADING ORDERS TABLE RLS
-- ============================================================================

-- Enable RLS on trading_orders table
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own orders
CREATE POLICY user_own_orders ON trading_orders
  FOR ALL
  TO authenticated_users
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Risk managers can see all orders
CREATE POLICY risk_manager_all_orders ON trading_orders
  FOR ALL
  TO risk_managers
  USING (true);

-- Policy: Compliance officers can see all orders
CREATE POLICY compliance_all_orders ON trading_orders
  FOR ALL
  TO compliance_officers
  USING (true);

-- Policy: Admins can see all orders
CREATE POLICY admin_all_orders ON trading_orders
  FOR ALL
  TO admin_users
  USING (true);

-- ============================================================================
-- USER SESSIONS TABLE RLS
-- ============================================================================

-- Enable RLS on user_sessions table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY user_own_sessions ON user_sessions
  FOR ALL
  TO authenticated_users
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can see all sessions
CREATE POLICY admin_all_sessions ON user_sessions
  FOR ALL
  TO admin_users
  USING (true);

-- ============================================================================
-- AUDIT LOGS TABLE RLS
-- ============================================================================

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own audit logs
CREATE POLICY user_own_audit ON audit_logs
  FOR SELECT
  TO authenticated_users
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Compliance officers can see all audit logs
CREATE POLICY compliance_all_audit ON audit_logs
  FOR ALL
  TO compliance_officers
  USING (true);

-- Policy: Admins can see all audit logs
CREATE POLICY admin_all_audit ON audit_logs
  FOR ALL
  TO admin_users
  USING (true);

-- Policy: Service accounts can insert audit logs
CREATE POLICY service_insert_audit ON audit_logs
  FOR INSERT
  TO service_accounts
  WITH CHECK (true);

-- ============================================================================
-- API KEYS TABLE RLS
-- ============================================================================

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own API keys
CREATE POLICY user_own_api_keys ON api_keys
  FOR ALL
  TO authenticated_users
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can see all API keys
CREATE POLICY admin_all_api_keys ON api_keys
  FOR ALL
  TO admin_users
  USING (true);

-- ============================================================================
-- MARKET DATA TABLE RLS
-- ============================================================================

-- Enable RLS on market_data table
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read market data
CREATE POLICY all_users_read_market_data ON market_data
  FOR SELECT
  TO authenticated_users
  USING (true);

-- Policy: Only service accounts can insert/update market data
CREATE POLICY service_write_market_data ON market_data
  FOR INSERT
  TO service_accounts
  WITH CHECK (true);

CREATE POLICY service_update_market_data ON market_data
  FOR UPDATE
  TO service_accounts
  USING (true);

-- ============================================================================
-- COMPLIANCE REPORTS TABLE RLS
-- ============================================================================

-- Enable RLS on compliance_reports table
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see reports they created or are subject of
CREATE POLICY user_relevant_compliance ON compliance_reports
  FOR SELECT
  TO authenticated_users
  USING (
    created_by = current_setting('app.current_user_id')::uuid OR
    subject_user_id = current_setting('app.current_user_id')::uuid
  );

-- Policy: Compliance officers can see all reports
CREATE POLICY compliance_all_reports ON compliance_reports
  FOR ALL
  TO compliance_officers
  USING (true);

-- Policy: Risk managers can see all reports
CREATE POLICY risk_manager_all_reports ON compliance_reports
  FOR ALL
  TO risk_managers
  USING (true);

-- Policy: Admins can see all reports
CREATE POLICY admin_all_reports ON compliance_reports
  FOR ALL
  TO admin_users
  USING (true);

-- ============================================================================
-- RISK ASSESSMENTS TABLE RLS
-- ============================================================================

-- Enable RLS on risk_assessments table
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own risk assessments
CREATE POLICY user_own_risk_assessments ON risk_assessments
  FOR SELECT
  TO authenticated_users
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Risk managers can see all assessments
CREATE POLICY risk_manager_all_assessments ON risk_assessments
  FOR ALL
  TO risk_managers
  USING (true);

-- Policy: Admins can see all assessments
CREATE POLICY admin_all_assessments ON risk_assessments
  FOR ALL
  TO admin_users
  USING (true);

-- ============================================================================
-- FUNCTIONS TO SET CURRENT USER CONTEXT
-- ============================================================================

-- Function to set current user ID for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set current user role for RLS
CREATE OR REPLACE FUNCTION set_current_user_role(user_role TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_role', user_role, true);
  
  -- Set the database role based on application role
  CASE user_role
    WHEN 'admin' THEN
      SET ROLE admin_users;
    WHEN 'risk_manager' THEN
      SET ROLE risk_managers;
    WHEN 'compliance_officer' THEN
      SET ROLE compliance_officers;
    WHEN 'service' THEN
      SET ROLE service_accounts;
    ELSE
      SET ROLE authenticated_users;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset to default role
CREATE OR REPLACE FUNCTION reset_user_context()
RETURNS VOID AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('app.current_user_id', '', true);
  PERFORM set_config('app.current_user_role', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATABASE ROLES SETUP
-- ============================================================================

-- Create database roles for RLS
CREATE ROLE authenticated_users;
CREATE ROLE admin_users;
CREATE ROLE risk_managers;
CREATE ROLE compliance_officers;
CREATE ROLE service_accounts;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO authenticated_users;
GRANT USAGE ON SCHEMA public TO admin_users;
GRANT USAGE ON SCHEMA public TO risk_managers;
GRANT USAGE ON SCHEMA public TO compliance_officers;
GRANT USAGE ON SCHEMA public TO service_accounts;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated_users;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_users;
GRANT ALL ON ALL TABLES IN SCHEMA public TO risk_managers;
GRANT ALL ON ALL TABLES IN SCHEMA public TO compliance_officers;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_accounts;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated_users;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_users;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO risk_managers;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO compliance_officers;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_accounts;

-- ============================================================================
-- SECURITY VIEWS
-- ============================================================================

-- Create a secure view for user profiles (excluding sensitive data)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  role,
  created_at,
  last_login,
  is_active,
  mfa_enabled
FROM users
WHERE is_active = true;

-- Enable RLS on the view
ALTER VIEW user_profiles SET (security_barrier = true);

-- Create a view for trading summaries
CREATE OR REPLACE VIEW trading_summaries AS
SELECT 
  user_id,
  DATE(created_at) as trade_date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status = 'filled' THEN quantity * price ELSE 0 END) as total_volume,
  AVG(CASE WHEN status = 'filled' THEN price ELSE NULL END) as avg_price
FROM trading_orders
GROUP BY user_id, DATE(created_at);

-- Enable RLS on the view
ALTER VIEW trading_summaries SET (security_barrier = true);

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Function to log all changes to sensitive tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, operation, user_id, old_values, new_values, changed_at
    ) VALUES (
      TG_TABLE_NAME, TG_OP, 
      current_setting('app.current_user_id', true)::uuid,
      NULL, row_to_json(NEW), NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name, operation, user_id, old_values, new_values, changed_at
    ) VALUES (
      TG_TABLE_NAME, TG_OP,
      current_setting('app.current_user_id', true)::uuid,
      row_to_json(OLD), row_to_json(NEW), NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, operation, user_id, old_values, new_values, changed_at
    ) VALUES (
      TG_TABLE_NAME, TG_OP,
      current_setting('app.current_user_id', true)::uuid,
      row_to_json(OLD), NULL, NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers on sensitive tables
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trading_orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trading_orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER api_keys_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION set_current_user_id IS 'Sets the current user ID for RLS policies';
COMMENT ON FUNCTION set_current_user_role IS 'Sets the current user role and switches database role';
COMMENT ON FUNCTION reset_user_context IS 'Resets user context and role to default';
COMMENT ON FUNCTION audit_trigger_function IS 'Automatically logs all changes to audited tables';

COMMENT ON POLICY user_own_data ON users IS 'Users can only access their own user data';
COMMENT ON POLICY user_own_orders ON trading_orders IS 'Users can only access their own trading orders';
COMMENT ON POLICY user_own_sessions ON user_sessions IS 'Users can only access their own sessions';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

/*
IMPORTANT SECURITY NOTES:

1. These RLS policies must be applied AFTER creating the database tables
2. Application code must call set_current_user_id() and set_current_user_role() 
   at the beginning of each database session
3. Connection pooling should reset user context between requests
4. Sensitive operations should be performed with elevated privileges only when necessary
5. Regular security audits should review and test these policies
6. All database users should have minimal required permissions
7. Consider using connection-level security labels for additional protection
8. Monitor audit logs regularly for suspicious activity
9. Backup and restore procedures must preserve RLS policies
10. Test RLS policies thoroughly in development environment

USAGE EXAMPLE IN APPLICATION:

```javascript
// Set user context before database operations
await db.query('SELECT set_current_user_id($1)', [userId]);
await db.query('SELECT set_current_user_role($1)', [userRole]);

// Perform database operations (RLS will be enforced)
const orders = await db.query('SELECT * FROM trading_orders');

// Reset context when done (or use connection pooling reset)
await db.query('SELECT reset_user_context()');
```
*/