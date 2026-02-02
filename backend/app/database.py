from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import event
from typing import Optional
from .config import settings


def _prepare_database_url(url: str) -> str:
    """Prepare database URL for asyncpg."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # Clean up parameters that asyncpg doesn't understand
    url = url.replace("&sslmode=require", "").replace("?sslmode=require", "")
    url = url.replace("&channel_binding=require", "")
    return url


# Primary (write) database connection
database_url = _prepare_database_url(settings.DATABASE_URL)

# Connection pool configuration
POOL_CONFIG = {
    "pool_size": int(getattr(settings, 'DB_POOL_SIZE', 20)),
    "max_overflow": int(getattr(settings, 'DB_MAX_OVERFLOW', 40)),
    "pool_timeout": 30,
    "pool_recycle": 1800,  # Recycle every 30 minutes
    "pool_pre_ping": True,
    "connect_args": {
        "server_settings": {
            "application_name": "onerouter_backend",
            "jit": "off"
        }
    }
}

# Primary engine (for writes)
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    **POOL_CONFIG
)

# Read replica engine (optional - for read-heavy queries)
# Set DATABASE_READ_REPLICA_URL in environment to enable
_read_replica_url = getattr(settings, 'DATABASE_READ_REPLICA_URL', None)
read_replica_engine: Optional[object] = None

if _read_replica_url:
    read_replica_engine = create_async_engine(
        _prepare_database_url(_read_replica_url),
        echo=settings.DEBUG,
        **POOL_CONFIG
    )

# Create async session factories
async_session = async_sessionmaker(engine, expire_on_commit=False)

# Read replica session (falls back to primary if no replica configured)
async_read_session = async_sessionmaker(
    read_replica_engine or engine,
    expire_on_commit=False
)


async def get_db():
    """Database session dependency (primary - for writes)."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_read_db():
    """
    Read-only database session (uses replica if available).

    Use this for read-heavy operations like:
    - Analytics queries
    - List/search operations
    - Reports

    Example:
        @router.get("/analytics")
        async def get_analytics(db: AsyncSession = Depends(get_read_db)):
            ...
    """
    async with async_read_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Add connection diagnostics
async def check_connection_health():
    """Check database connection health."""
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            if version:
                print(f"Database connected: {str(version)[:50]}...")
            else:
                print("Database connected (version unknown)")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False


def get_pool_status() -> dict:
    """Get connection pool statistics."""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalidatedcount() if hasattr(pool, 'invalidatedcount') else 0,
    }


async def check_read_replica_health() -> bool:
    """Check read replica connection health."""
    if not read_replica_engine:
        return False
    try:
        from sqlalchemy import text
        async with read_replica_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            return True
    except Exception:
        return False