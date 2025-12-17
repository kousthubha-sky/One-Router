from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from .config import settings
from .database import get_db, engine
from .auth.dependencies import get_current_user, get_api_user, api_key_auth
from .models import User
from .routes.onboarding import router as onboarding_router
from .routes.unified_api import router as unified_api_router
from .routes.services import router as services_router
from .cache import init_redis, close_redis, cache_service
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Initialize database tables
async def init_db():
    """Initialize database tables"""
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            from . import models
            await conn.run_sync(User.metadata.create_all)
        print("Database tables initialized successfully")

        # Test database connection health
        from .database import check_connection_health
        db_healthy = await check_connection_health()
        if not db_healthy:
            print("WARNING: Database connection health check failed")

    except Exception as e:
        print(f"Database initialization error: {e}")

# Create FastAPI app
app = FastAPI(
    title="OneRouter API",
    description="Unified API Gateway for Payment Services",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Build CORS allow_origins list based on environment
cors_allow_origins = [settings.FRONTEND_URL]
is_dev = settings.DEBUG or settings.ENVIRONMENT == "development"

if is_dev:
    # Include localhost origins only in development
    cors_allow_origins.extend(["http://localhost:3000", "http://localhost:3001"])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_credentials=is_dev,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security headers (skip for OPTIONS requests)
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)

    # Skip security headers for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return response

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and Redis on startup"""
    await init_db()
    await init_redis()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await close_redis()

# Include routers
app.include_router(onboarding_router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(services_router, prefix="/api", tags=["services"])
app.include_router(unified_api_router, prefix="/v1", tags=["unified-api"])

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to OneRouter API",
        "status": "running"
    }

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check including database and Redis status"""
    health_status = {
        "status": "healthy",
        "message": "API is running",
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        # Test database connection
        # Test database connection
        result = await db.execute(text("SELECT 1 as test"))
        db_test = result.scalar() == 1
        db_test = result.scalar() == 1
        health_status["database"] = "connected" if db_test else "error"
        print(f"Database test result: {db_test}")
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
        print(f"Database health check failed: {e}")

    # Test Redis connection
    try:
        redis_status = await cache_service.ping()
        health_status["redis"] = "connected" if redis_status else "disconnected"
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        print(f"Redis health check failed: {e}")

    return health_status

@app.get("/api/debug/redis")
async def debug_redis(user = Depends(get_current_user)):
    """Debug Redis connection and keys"""
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Not found")
    try:
        redis_connected = await cache_service.ping()
        
        if not redis_connected:
            return {
                "status": "error",
                "message": "Redis is not connected",
                "connected": False
            }
        
        # Test write/read
        test_key = f"test:{uuid.uuid4().hex[:8]}"
        redis = await cache_service._get_redis()
        
        await redis.set(test_key, "test_value", ex=60)
        test_value = await redis.get(test_key)
        await redis.delete(test_key)
        
        # Get info
        info = await redis.info()
        
        return {
            "status": "success",
            "connected": True,
            "test_write_read": test_value == "test_value",
            "redis_version": info.get("redis_version"),
            "used_memory_human": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "total_commands_processed": info.get("total_commands_processed")
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }

# Example endpoint
@app.get("/api/example")
async def example():
    return {
        "data": "This is example data from the backend",
        "timestamp": datetime.utcnow().isoformat()
    }

# Protected endpoint example
@app.get("/api/user/profile")
async def get_user_profile(user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user's profile (protected route)"""
    clerk_id = user.get("clerk_user_id")
    if not clerk_id:
        raise HTTPException(status_code=400, detail="Invalid user token")

    # User should already exist from the get_current_user dependency
    return {
        "id": user.get("id"),
        "clerk_user_id": user.get("clerk_user_id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "created_at": user.get("created_at")
    }

# API Key Management (Clerk JWT protected)
@app.post("/api/keys")
async def generate_api_key(
    key_name: str = "My API Key",
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Generate a new API key for the authenticated user"""
    from app.services.credential_manager import CredentialManager

    # Verify user has a valid ID
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in authentication token")
    
    cred_manager = CredentialManager()
    user_id = str(user_id)

    result = await cred_manager.generate_api_key(
        db=db,
        user_id=user_id,
        key_name=key_name
    )

    return {
        "api_key": result["api_key"],
        "key_id": result["key_id"],
        "key_name": result["key_name"],
        "message": "API key generated successfully. Store this key securely - it cannot be retrieved again.",
        "warning": "This API key will only be shown once. Make sure to copy it now."
    }

@app.get("/api/keys")
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """List API keys for the authenticated user"""
    from app.services.credential_manager import CredentialManager

    # Verify user has a valid ID
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in authentication token")
    
    cred_manager = CredentialManager()
    user_id = str(user_id)

    api_keys = await cred_manager.get_user_api_keys(db, user_id)

    return {
        "api_keys": api_keys,
        "count": len(api_keys)
    }

@app.get("/api/keys/{key_id}/usage")
async def get_api_key_usage(
    key_id: str,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get usage statistics for a specific API key"""
    from app.services.credential_manager import CredentialManager
    from uuid import UUID

    # Verify user has a valid ID
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in authentication token")
    
    cred_manager = CredentialManager()
    user_id = str(user_id)

    # Verify the API key belongs to the user
    try:
        key_uuid = UUID(key_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid key ID format")

    # Check if the key belongs to the user
    api_keys = await cred_manager.get_user_api_keys(db, user_id)
    key_info = next((k for k in api_keys if k["id"] == key_id), None)

    if not key_info:
        raise HTTPException(status_code=404, detail="API key not found")

    usage_stats = await cred_manager.get_api_key_usage(db, key_id, days)

    return {
        "key_id": key_id,
        "key_name": key_info["key_name"],
        "usage": usage_stats
    }

# Debug endpoints
@app.get("/api/debug/db")
async def debug_database(db: AsyncSession = Depends(get_db)):
    """Debug database connection and data"""
    try:
        # Get table list
        tables_result = await db.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        table_list = [row[0] for row in tables_result.fetchall()]

        # Get user count
        user_count_result = await db.execute("SELECT COUNT(*) FROM users")
        user_count = user_count_result.scalar()

        # Get all users (for debugging)
        users_result = await db.execute("""
            SELECT id, clerk_user_id, email, name, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        """)
        users = []
        for row in users_result.fetchall():
            users.append({
                "id": str(row[0]),
                "clerk_user_id": row[1],
                "email": row[2],
                "name": row[3],
                "created_at": row[4].isoformat() if row[4] else None
            })

        return {
            "status": "success",
            "database_url": settings.DATABASE_URL.replace(settings.DATABASE_URL.split('@')[0].split('//')[1], '***:***'),
            "tables": table_list,
            "user_count": user_count,
            "users": users
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }

