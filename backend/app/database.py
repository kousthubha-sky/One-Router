from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from .config import settings

# Create engine with psycopg2
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    # Connection pooling configuration for production workloads
    pool_size=20,                   # Number of connections to keep pooled
    max_overflow=40,                # Allow up to 40 additional connections for burst traffic
    pool_timeout=30,                # Wait up to 30 seconds for a connection to become available
    pool_recycle=3600,              # Recycle connections every hour (prevents idle connection drops)
    pool_pre_ping=True,             # Test connections before using them (health check)
    connect_args={
        "application_name": "onerouter_backend",
    }
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_connection_health():
    """Check database connection health"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"Database connected: {version[:50]}...")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False