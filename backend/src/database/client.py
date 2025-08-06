"""Database utilities for QuantEnergx backend with asyncpg."""
import logging
from typing import Optional
import asyncpg
from asyncpg import Pool
from config import settings
from utils.error_handlers import DatabaseException

logger = logging.getLogger(__name__)


class DatabaseClient:
    """Async PostgreSQL client wrapper with connection pooling."""
    
    def __init__(self):
        """Initialize database client."""
        self.pool: Optional[Pool] = None
    
    async def connect(self):
        """Establish database connection pool."""
        try:
            self.pool = await asyncpg.create_pool(
                dsn=settings.database_url,
                min_size=settings.db_min_connections,
                max_size=settings.db_max_connections,
                command_timeout=60,
                server_settings={
                    'jit': 'off',
                    'application_name': 'quantenergx-backend'
                }
            )
            
            # Test the connection
            async with self.pool.acquire() as connection:
                await connection.fetchval('SELECT 1')
            
            logger.info(f"Database connected successfully with pool size {settings.db_min_connections}-{settings.db_max_connections}")
            
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise DatabaseException(f"Database connection failed: {str(e)}")
    
    async def disconnect(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def fetch_one(self, query: str, *args) -> Optional[dict]:
        """Fetch a single record."""
        if not self.pool:
            raise DatabaseException("Database not connected")
        
        try:
            async with self.pool.acquire() as connection:
                row = await connection.fetchrow(query, *args)
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Database fetch_one error: {e}")
            raise DatabaseException(f"Query failed: {str(e)}")
    
    async def fetch_all(self, query: str, *args) -> list[dict]:
        """Fetch all records."""
        if not self.pool:
            raise DatabaseException("Database not connected")
        
        try:
            async with self.pool.acquire() as connection:
                rows = await connection.fetch(query, *args)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Database fetch_all error: {e}")
            raise DatabaseException(f"Query failed: {str(e)}")
    
    async def execute(self, query: str, *args) -> str:
        """Execute a query and return status."""
        if not self.pool:
            raise DatabaseException("Database not connected")
        
        try:
            async with self.pool.acquire() as connection:
                return await connection.execute(query, *args)
        except Exception as e:
            logger.error(f"Database execute error: {e}")
            raise DatabaseException(f"Query execution failed: {str(e)}")
    
    async def execute_many(self, query: str, args_list) -> None:
        """Execute a query with multiple parameter sets."""
        if not self.pool:
            raise DatabaseException("Database not connected")
        
        try:
            async with self.pool.acquire() as connection:
                await connection.executemany(query, args_list)
        except Exception as e:
            logger.error(f"Database execute_many error: {e}")
            raise DatabaseException(f"Batch query execution failed: {str(e)}")
    
    async def transaction(self):
        """Get a database transaction context."""
        if not self.pool:
            raise DatabaseException("Database not connected")
        
        return self.pool.acquire()
    
    async def health_check(self) -> bool:
        """Check database health."""
        try:
            result = await self.fetch_one("SELECT 1 as health")
            return result is not None and result.get("health") == 1
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False


# Global database client instance
db_client = DatabaseClient()