const { Pool } = require('pg');

/**
 * Database utility with Row Level Security (RLS) support
 * Manages database connections with proper security context
 */
class DatabaseManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    this.roleMapping = {
      'admin': 'admin_users',
      'risk_manager': 'risk_managers',
      'compliance_officer': 'compliance_officers',
      'trader': 'authenticated_users',
      'analyst': 'authenticated_users',
      'viewer': 'authenticated_users',
      'service': 'service_accounts'
    };
  }

  /**
   * Get a database client with user context set
   * @param {string} userId - User ID for RLS
   * @param {string} userRole - User role for RLS
   * @returns {Object} - Database client with context
   */
  async getClientWithContext(userId, userRole = 'viewer') {
    const client = await this.pool.connect();
    
    try {
      // Set user context for RLS
      await client.query('SELECT set_current_user_id($1)', [userId]);
      await client.query('SELECT set_current_user_role($1)', [userRole]);
      
      return {
        client,
        query: client.query.bind(client),
        release: () => {
          // Reset context before releasing
          client.query('SELECT reset_user_context()').finally(() => {
            client.release();
          });
        }
      };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  /**
   * Execute query with user context
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {string} userId - User ID for RLS
   * @param {string} userRole - User role for RLS
   * @returns {Object} - Query result
   */
  async queryWithContext(query, params = [], userId, userRole = 'viewer') {
    const { client, release } = await this.getClientWithContext(userId, userRole);
    
    try {
      return await client.query(query, params);
    } finally {
      release();
    }
  }

  /**
   * Execute transaction with user context
   * @param {Function} callback - Transaction callback
   * @param {string} userId - User ID for RLS
   * @param {string} userRole - User role for RLS
   * @returns {*} - Transaction result
   */
  async transactionWithContext(callback, userId, userRole = 'viewer') {
    const { client, release } = await this.getClientWithContext(userId, userRole);
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      release();
    }
  }

  /**
   * Execute admin-level query (bypasses RLS)
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} - Query result
   */
  async adminQuery(query, params = []) {
    return this.queryWithContext(query, params, null, 'admin');
  }

  /**
   * Execute service-level query (for system operations)
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} - Query result
   */
  async serviceQuery(query, params = []) {
    return this.queryWithContext(query, params, null, 'service');
  }

  /**
   * Initialize database with RLS setup
   */
  async initializeRLS() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Read RLS setup script
      const rlsScript = fs.readFileSync(
        path.join(__dirname, '../database/setup_rls.sql'),
        'utf8'
      );

      // Execute setup script with admin privileges
      await this.adminQuery(rlsScript);
      console.log('RLS setup completed successfully');
    } catch (error) {
      console.error('RLS setup failed:', error);
      throw error;
    }
  }

  /**
   * Check if RLS is enabled on a table
   * @param {string} tableName - Table name to check
   * @returns {boolean} - True if RLS is enabled
   */
  async isRLSEnabled(tableName) {
    const result = await this.adminQuery(
      'SELECT relrowsecurity FROM pg_class WHERE relname = $1',
      [tableName]
    );
    
    return result.rows.length > 0 && result.rows[0].relrowsecurity;
  }

  /**
   * Get RLS policies for a table
   * @param {string} tableName - Table name
   * @returns {Array} - List of policies
   */
  async getRLSPolicies(tableName) {
    const result = await this.adminQuery(`
      SELECT 
        pol.polname as policy_name,
        pol.polcmd as command,
        pol.polroles as roles,
        pol.polqual as using_expression,
        pol.polwithcheck as with_check_expression
      FROM pg_policy pol
      JOIN pg_class pc ON pol.polrelid = pc.oid
      WHERE pc.relname = $1
    `, [tableName]);
    
    return result.rows;
  }

  /**
   * Create secure database schema
   */
  async createSecureSchema() {
    const schema = `
      -- Create tables with proper security constraints
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT true,
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT valid_role CHECK (role IN ('admin', 'trader', 'risk_manager', 'compliance_officer', 'analyst', 'viewer')),
        CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        refresh_token TEXT UNIQUE,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS trading_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
        order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
        quantity DECIMAL(18,8) NOT NULL CHECK (quantity > 0),
        price DECIMAL(18,8) CHECK (price > 0),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        filled_at TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT valid_status CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected'))
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        key_hash TEXT UNIQUE NOT NULL,
        permissions TEXT[] NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_used TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name VARCHAR(100) NOT NULL,
        operation VARCHAR(10) NOT NULL,
        user_id UUID REFERENCES users(id),
        old_values JSONB,
        new_values JSONB,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS market_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(20) NOT NULL,
        price DECIMAL(18,8) NOT NULL,
        volume DECIMAL(18,8),
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(symbol, timestamp, source)
      );

      CREATE TABLE IF NOT EXISTS compliance_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_type VARCHAR(50) NOT NULL,
        subject_user_id UUID REFERENCES users(id),
        created_by UUID NOT NULL REFERENCES users(id),
        report_data JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS risk_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assessment_type VARCHAR(50) NOT NULL,
        risk_score DECIMAL(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
        assessment_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
      CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
      CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_compliance_reports_subject_user_id ON compliance_reports(subject_user_id);
      CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Add updated_at triggers
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_trading_orders_updated_at BEFORE UPDATE ON trading_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    await this.adminQuery(schema);
    console.log('Secure database schema created successfully');
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return {
        healthy: true,
        timestamp: result.rows[0].now,
        poolSize: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Close all database connections
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = new DatabaseManager();