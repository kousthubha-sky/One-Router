from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import os
import uuid
from datetime import datetime, timezone
from auth import get_current_user, get_api_user, api_key_auth, clerk_auth
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from models import Base, User

# Load environment variables
load_dotenv()

# Security configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Validate required environment variables
CLERK_SECRET = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET:
    if ENVIRONMENT == "production":
        raise ValueError(
            "CRITICAL: CLERK_SECRET_KEY must be set to a valid production key. "
            "Check your environment variables."
        )
    else:
        print("WARNING: CLERK_SECRET_KEY not set. Set it in your .env file for proper Clerk integration.")

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if ENVIRONMENT == "production":
        raise ValueError("CRITICAL: DATABASE_URL must be set in production.")
    else:
        print("WARNING: DATABASE_URL not set. Using in-memory storage for development.")

# SQLAlchemy setup
if DATABASE_URL:
    # Convert to asyncpg URL
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Remove non-asyncpg parameters and rebuild URL properly
    base_url = DATABASE_URL.split("?")[0]  # Get URL without query string
    async_database_url = base_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # Add asyncpg-compatible SSL parameter (Neon requires it)
    async_database_url = f"{async_database_url}?ssl=require"
    
    engine = create_async_engine(
        async_database_url,
        echo=DEBUG,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def init_db():
        """Initialize database tables on startup"""
        from models import Base
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                print("Database tables initialized successfully")
        except Exception as e:
            print(f"Database initialization error: {e}")
            raise

    async def get_db() -> AsyncSession:
        async with async_session() as session:
            try:
                yield session
            except Exception as e:
                await session.rollback()
                raise
            finally:
                await session.close()
else:
    async def get_db():
        raise NotImplementedError("Database not configured")
    
    async def init_db():
        pass
# Configure CORS based on environment
if ENVIRONMENT == "production":
    allowed_origins = [FRONTEND_URL]
    allowed_hosts = [FRONTEND_URL.replace("http://", "").replace("https://", "")]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:8000",
    ]
    allowed_hosts = [
        "localhost:3000",
        "localhost:3002",
        "localhost:8000",
        "127.0.0.1:3000",
        "127.0.0.1:3002",
        "127.0.0.1:8000",
        "localhost",
        "127.0.0.1",
    ]

# Create FastAPI app
app = FastAPI(
    title="OneRouter API",
    description="Backend API for OneRouter",
    version="0.1.0",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()

# Add security middleware (only in production)
if ENVIRONMENT == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Add security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to OneRouter API",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "API is running"
    }


# Example endpoint
@app.get("/api/example")
async def example():
    return {
        "data": "This is example data from the backend",
        "timestamp": "2025-12-14"
    }


# Protected endpoint example
@app.get("/api/user/profile")
async def get_user_profile(user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user's profile (protected route)"""
    clerk_id = user.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=400, detail="Invalid user token")

    # Check if user exists in database
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_id))
    db_user = result.scalar_one_or_none()

    if not db_user:
        # Fetch full user profile from Clerk API
        try:
            profile = await clerk_auth.get_user_profile(clerk_id)
            email = profile.get("email") or f"{clerk_id}@clerk.local"
            name = profile.get("name") or f"User {clerk_id[-8:]}"
        except Exception as e:
            print(f"⚠️  Failed to fetch profile from Clerk API: {e}")
            email = f"{clerk_id}@clerk.local"
            name = f"User {clerk_id[-8:]}"

        # Create user - let DB handle timestamps
        now = datetime.now(timezone.utc).replace(tzinfo=None)  # Remove timezone for naive timestamp column
        new_user = User(
            id=uuid.uuid4(),
            clerk_user_id=clerk_id,
            email=email,
            name=name,
            created_at=now,
            updated_at=now
        )
        db.add(new_user)
        
        try:
            await db.commit()
            await db.refresh(new_user)
            print(f"✅ Created new user: {new_user.id} ({email})")
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating user: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        db_user = new_user

    return {
        "id": str(db_user.id),
        "clerk_user_id": db_user.clerk_user_id,
        "email": db_user.email,
        "name": db_user.name,
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None
    }

# Add these debug endpoints to main.py (after line 180)

@app.get("/api/debug/clerk-test")
async def test_clerk_api():
    """Test Clerk API authentication"""
    try:
        # Test with a known user ID format
        test_user_id = "user_36pFlLcnxw3zwMnSuWXEihjpMFZ"  # Use the user's actual ID
        profile = await clerk_auth.get_user_profile(test_user_id)

        if profile:
            return {
                "status": "success",
                "message": "Clerk API is working",
                "profile": profile
            }
        else:
            return {
                "status": "failed",
                "message": "Clerk API returned empty profile",
                "secret_key_type": "test" if clerk_auth.secret_key and clerk_auth.secret_key.startswith("sk_test_") else "production"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "secret_key_type": "test" if clerk_auth.secret_key and clerk_auth.secret_key.startswith("sk_test_") else "production"
        }

@app.get("/api/debug/db")
async def debug_database():
    """Debug database connection and data"""
    if not DATABASE_URL:
        return {"error": "DATABASE_URL not set"}
    
    try:
        async with engine.begin() as conn:
            # Test connection
            await conn.execute(text("SELECT 1"))
            
            # Get table list
            tables = await conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            table_list = [row[0] for row in tables.fetchall()]
            
            # Get user count
            user_count_result = await conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = user_count_result.scalar()
            
            # Get all users (for debugging)
            users_result = await conn.execute(text("""
                SELECT id, clerk_user_id, email, name, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 5
            """))
            users = []
            for row in users_result.fetchall():
                users.append({
                    "id": str(row[0]),
                    "clerk_user_id": row[1],
                    "email": row[2],
                    "full_name": row[3],
                    "created_at": row[4].isoformat() if row[4] else None
                })
            
            return {
                "status": "connected",
                "tables": table_list,
                "user_count": user_count,
                "recent_users": users,
                "database_url": DATABASE_URL.split("@")[1] if "@" in DATABASE_URL else "hidden"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "database_url": DATABASE_URL.split("@")[1] if "@" in DATABASE_URL else "hidden"
        }


@app.get("/api/debug/auth")
async def debug_auth(user = Depends(get_current_user)):
    """Debug authentication - requires valid JWT"""
    return {
        "status": "authenticated",
        "user_data": user,
        "clerk_id": user.get("sub"),
        "message": "Authentication is working!"
    }


@app.post("/api/debug/create-test-user")
async def create_test_user(db: AsyncSession = Depends(get_db)):
    """Create a test user directly (no auth required) - FOR TESTING ONLY"""
    import uuid
    
    test_clerk_id = f"test_user_{uuid.uuid4().hex[:8]}"
    
    try:
        # Check if test user already exists
        result = await db.execute(
            select(User).where(User.clerk_user_id == test_clerk_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return {
                "status": "exists",
                "user_id": str(existing.id),
                "clerk_user_id": existing.clerk_user_id
            }
        
        # Create test user
        test_user = User(
            id=uuid.uuid4(),
            clerk_user_id=test_clerk_id,
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            name="Test User",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(test_user)
        await db.commit()
        await db.refresh(test_user)
        
        return {
            "status": "created",
            "user_id": str(test_user.id),
            "clerk_user_id": test_user.clerk_user_id,
            "email": test_user.email,
            "created_at": test_user.created_at.isoformat() if test_user.created_at else None,
            "message": "Test user created successfully!"
        }
        
    except Exception as e:
        await db.rollback()
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }


@app.get("/api/debug/logs")
async def get_request_logs():
    """Show recent request logs"""
    # This would show actual logs in production
    return {
        "message": "Check your terminal for request logs",
        "tip": "Look for lines starting with 'INFO:' in your console"
    }
    
# API Key Management (Clerk JWT protected)
@app.post("/api/keys")
async def generate_api_key(user = Depends(get_current_user)):
    """Generate a new API key for the authenticated user"""
    user_id = user.get("sub") or "unknown_user"
    api_key = api_key_auth.generate_api_key(user_id)

    return {
        "api_key": api_key,
        "message": "API key generated successfully. Store this key securely - it won't be shown again.",
        "user_id": user_id
    }


@app.get("/api/keys")
async def list_api_keys(user = Depends(get_current_user)):
    """List API keys for the authenticated user"""
    user_id = user.get("sub")

    # In production, query database for user's keys
    # For demo, return mock data
    return {
        "api_keys": [
            {
                "id": "key_123",
                "name": "Production Key",
                "prefix": "unf_live_",
                "created_at": "2025-01-01T00:00:00Z",
                "last_used": None,
                "is_active": True
            }
        ]
    }


# Unified API endpoints (API Key protected)
@app.get("/v1/health")
async def unified_health(api_user: dict = Depends(get_api_user)):
    """Health check for unified API"""
    return {
        "status": "healthy",
        "message": "OneRouter unified API is running",
        "user_id": api_user["user_id"]
    }




class PaymentOrder(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    description: str = Field(None, max_length=255)


@app.post("/v1/payments/orders")
async def create_payment_order(order: PaymentOrder, api_user: dict = Depends(get_api_user)):
    """Create a payment order (unified API)"""
    # Validate amount
    if order.amount > 10000000:  # Max reasonable amount
        return JSONResponse(status_code=400, content={"error": "Amount exceeds maximum limit"})
    
    # This would route to the appropriate payment provider
    return {
        "transaction_id": f"txn_{api_user['user_id']}_123",
        "provider": "razorpay",  # Would be determined by routing logic
        "status": "created",
        "amount": order.amount,
        "currency": order.currency
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
