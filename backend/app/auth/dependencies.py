import hashlib
import secrets
from datetime import datetime, timezone 
from fastapi import HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from uuid import uuid4

from ..database import get_db
from ..models import ApiKey, User
from .clerk import clerk_auth

# API Key Authentication (for SDK users)
class APIKeyAuth:
    def __init__(self):
        # In production, API keys are stored in database
        # In-memory store is only used as cache (Redis preferred)
        self.api_keys = {}

    def hash_api_key(self, api_key: str) -> str:
        """Hash API key for storage/lookup"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def generate_api_key(self, user_id: str) -> str:
        """Generate a new API key for a user"""
        # Generate a secure random key
        key = f"unf_live_{secrets.token_urlsafe(32)}"
        key_hash = self.hash_api_key(key)

        # Store in our "database"
        self.api_keys[key_hash] = {
            "user_id": user_id,
            "is_active": True,
            "rate_limit_per_min": 100,
            "rate_limit_per_day": 10000,
        }

        return key

    async def validate_api_key(self, api_key: str) -> dict:
        """Validate API key and return user info"""
        key_hash = self.hash_api_key(api_key)

        if key_hash not in self.api_keys:
            raise HTTPException(status_code=401, detail="Invalid API key")

        key_data = self.api_keys[key_hash]
        if not key_data["is_active"]:
            raise HTTPException(status_code=401, detail="API key is inactive")

        return key_data

# Global API key auth instance
api_key_auth = APIKeyAuth()

# Dependency for API key protected routes
async def get_api_user(
    authorization: Optional[str] = Header(None),
    x_platform_key: Optional[str] = Header(None, alias="X-Platform-Key"),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Simplified API authentication - extract user from API key

    Accepts API key in either:
    - Authorization: Bearer <key>
    - X-Platform-Key: <key>
    """

    # Extract API key
    api_key = None
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization.split(" ", 1)[1]
    elif x_platform_key:
        api_key = x_platform_key

    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide in Authorization header or X-Platform-Key header."
        )

    # Hash and lookup
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    result = await db.execute(
        select(ApiKey, User)
        .join(User, ApiKey.user_id == User.id)
        .where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_active == True
        )
    )
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    api_key_obj, user = row

    # Check expiration
    if api_key_obj.expires_at and api_key_obj.expires_at < datetime.now(timezone.utc): # type: ignore
        raise HTTPException(
            status_code=401,
            detail="API key has expired"
        )

    # Update last used timestamp (use naive UTC datetime to match TIMESTAMP WITHOUT TIME ZONE column)
    api_key_obj.last_used_at = datetime.utcnow()  # type: ignore
    db.add(api_key_obj)
    await db.commit()
    # Return simplified auth data
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "api_key": api_key_obj,
        "environment": api_key_obj.environment
    }

# Dependency for protected routes
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current authenticated user and ensure they exist in database"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = auth_header.split(" ")[1]
    # Verify token with Clerk
    token_payload = await clerk_auth.verify_token(token)    # Extract user info from token
    clerk_user_id = token_payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    # Check if user exists in database, create if not
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    db_user = result.scalar_one_or_none()

    if not db_user:
        # Fetch full user profile from Clerk API
        try:
            profile = await clerk_auth.get_user_profile(clerk_user_id)
            email = profile.get("email") or f"{clerk_user_id}@clerk.local"
            name = profile.get("name") or f"User {clerk_user_id[-8:]}"
        except Exception as e:
            print(f"⚠️  Failed to fetch profile from Clerk API: {e}")
            email = f"{clerk_user_id}@clerk.local"
            name = f"User {clerk_user_id[-8:]}"

        # Set timestamps explicitly (naive UTC datetime for PostgreSQL)
        now = datetime.now(timezone.utc)  # type: ignore

        new_user = User(
            id=uuid4(),
            clerk_user_id=clerk_user_id,
            email=email,
            name=name,
            created_at=now,
            updated_at=now
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        db_user = new_user
        print(f" Created new user: {db_user.id}")
    return {
        "id": str(db_user.id),
        "clerk_user_id": db_user.clerk_user_id,
        "email": db_user.email,
        "name": db_user.name,
        "created_at": db_user.created_at
    }

# Dependency for flexible auth (API key OR Clerk token)
async def get_api_or_current_user(
    authorization: Optional[str] = Header(None),
    x_platform_key: Optional[str] = Header(None, alias="X-Platform-Key"),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Flexible authentication that accepts either:
    1. API key (Bearer token for SDK users)
    2. Clerk token (Bearer token for frontend users)
    
    Tries API key first, falls back to Clerk token.
    """
    # Extract API key/token from headers
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif x_platform_key:
        token = x_platform_key
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid"
        )
    
    # First, try API key authentication
    try:
        key_hash = hashlib.sha256(token.encode()).hexdigest()
        result = await db.execute(
            select(ApiKey, User)
            .join(User, ApiKey.user_id == User.id)
            .where(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True
            )
        )
        row = result.one_or_none()
        
        if row:
            api_key_obj, user = row
            
            # Check expiration
            if api_key_obj.expires_at and api_key_obj.expires_at < datetime.now(timezone.utc): # type: ignore
                raise HTTPException(
                    status_code=401,
                    detail="API key has expired"
                )
            
            # Update last used (use naive UTC datetime to match TIMESTAMP WITHOUT TIME ZONE column)
            api_key_obj.last_used_at = datetime.utcnow()  # type: ignore
            db.add(api_key_obj)
            await db.commit()
            
            return {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "api_key": api_key_obj,
                "environment": api_key_obj.environment,
                "auth_type": "api_key"
            }
    except HTTPException:
        pass  # Invalid/expired key -> try Clerk
    except Exception:
        raise  # Unexpected failure should surface
    # Fall back to Clerk token authentication
    try:
        token_payload = await clerk_auth.verify_token(token)
        clerk_user_id = token_payload.get("sub")
        
        if not clerk_user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if user exists in database, create if not
        result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            try:
                profile = await clerk_auth.get_user_profile(clerk_user_id)
                email = profile.get("email") or f"{clerk_user_id}@clerk.local"
                name = profile.get("name") or f"User {clerk_user_id[-8:]}"
            except Exception:
                email = f"{clerk_user_id}@clerk.local"
                name = f"User {clerk_user_id[-8:]}"
            
            now = datetime.now(timezone.utc)  # type: ignore
            new_user = User(
                id=uuid4(),
                clerk_user_id=clerk_user_id,
                email=email,
                name=name,
                created_at=now,
                updated_at=now
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            db_user = new_user
        
        return {
            "id": str(db_user.id),
            "clerk_user_id": db_user.clerk_user_id,
            "email": db_user.email,
            "name": db_user.name,
            "created_at": db_user.created_at,
            "auth_type": "clerk"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
