# backend/app/services/csrf_manager.py
"""
CSRF Token Management Service

Provides CSRF token generation, validation, and management for protecting
state-changing operations against Cross-Site Request Forgery attacks.
"""

import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from app.cache import RedisManager


class CSRFTokenManager:
    """Manages CSRF token generation and validation with Redis backend"""
    
    TOKEN_LENGTH = 32  # 32 bytes = 256 bits of entropy
    TOKEN_EXPIRY = 24 * 60 * 60  # 24 hours
    REDIS_PREFIX = "csrf_token:"
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure CSRF token"""
        return secrets.token_urlsafe(CSRFTokenManager.TOKEN_LENGTH)
    
    @staticmethod
    async def create_token(session_id: str) -> str:
        """
        Create and store a new CSRF token for a session
        
        Args:
            session_id: Session or user identifier
            
        Returns:
            The generated CSRF token
        """
        redis_client = await RedisManager.get_redis()
        token = CSRFTokenManager.generate_token()
        key = f"{CSRFTokenManager.REDIS_PREFIX}{session_id}"
        
        # Store token in Redis with expiry
        await redis_client.setex(
            key,
            CSRFTokenManager.TOKEN_EXPIRY,
            token
        )
        
        return token
    
    @staticmethod
    async def validate_token(session_id: str, token: str) -> bool:
        """
        Validate a CSRF token against stored value
        
        Args:
            session_id: Session or user identifier
            token: Token to validate
            
        Returns:
            True if token is valid, False otherwise
        """
        if not token or not session_id:
            return False
        
        redis_client = await RedisManager.get_redis()
        key = f"{CSRFTokenManager.REDIS_PREFIX}{session_id}"
        stored_token = await redis_client.get(key)
        
        if not stored_token:
            return False
        
        # Constant-time comparison to prevent timing attacks
        return secrets.compare_digest(stored_token, token)
    
    @staticmethod
    async def revoke_token(session_id: str) -> None:
        """
        Revoke a CSRF token (e.g., after logout)
        
        Args:
            session_id: Session or user identifier
        """
        redis_client = await RedisManager.get_redis()
        key = f"{CSRFTokenManager.REDIS_PREFIX}{session_id}"
        await redis_client.delete(key)
