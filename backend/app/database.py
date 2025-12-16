from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from .config import settings

# Create async engine
# Convert the connection string for asyncpg
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean up parameters that asyncpg doesn't understand
database_url = database_url.replace("&sslmode=require", "").replace("?sslmode=require", "")
database_url = database_url.replace("&channel_binding=require", "")

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,  # Recycle connections every 30 minutes
    pool_pre_ping=True,  # Test connections before use
)

# Create async session factory
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    """Database session dependency"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Add connection diagnostics
async def check_connection_health():
    """Check database connection health"""
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"Database connected: {version[:50]}...")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False