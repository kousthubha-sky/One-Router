"""
Rate limiting utilities for endpoints
"""
import hashlib
from typing import Tuple, Dict, Any, Optional
from fastapi import Request, HTTPException
from ..cache import cache_service


async def extract_rate_limit_key(request: Request) -> Tuple[str, int, bool]:
    """
    Extract rate limit key from request (API key or user ID or IP).
    
    Returns: (rate_limit_key, limit_per_minute, is_authenticated)
    """
    api_key_id = None
    limit_per_minute = 100
    is_authenticated = False
    
    # Check for API key in Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            api_key = auth_header.split(" ", 1)[1]
            api_key_id = hashlib.sha256(api_key.encode()).hexdigest()[:16]
            is_authenticated = True
            limit_per_minute = 100
        except Exception:
            pass
    
    # If no API key, try to get from Clerk token
    if not api_key_id and auth_header.startswith("Bearer "):
        try:
            from ..auth.clerk import clerk_auth
            token = auth_header.split(" ", 1)[1]
            token_payload = await clerk_auth.verify_token(token)
            clerk_user_id = token_payload.get("sub")
            if clerk_user_id:
                api_key_id = clerk_user_id[:16]
                is_authenticated = True
                limit_per_minute = 200
        except Exception:
            pass
    
    # Fallback to IP-based limiting
    if not api_key_id:
        client_ip = request.client.host if request.client else "unknown"
        api_key_id = f"ip_{client_ip}"
        limit_per_minute = 30
    
    return api_key_id, limit_per_minute, is_authenticated


async def check_endpoint_rate_limit(
    request: Request,
    custom_limit: Optional[int] = None
) -> Dict[str, Any]:
    """
    Check rate limit for current request and return headers.
    
    Usage in endpoints:
        rate_limit_info = await check_endpoint_rate_limit(request)
        return Response(..., headers=rate_limit_info['headers'])
    
    Returns: {
        'allowed': bool,
        'remaining': int,
        'reset_at': int,
        'headers': dict
    }
    """
    api_key_id, limit_per_minute, is_authenticated = await extract_rate_limit_key(request)
    
    # Override limit if provided
    if custom_limit:
        limit_per_minute = custom_limit
    
    # Check rate limit
    try:
        is_allowed, remaining, reset_at = await cache_service.check_rate_limit(
            api_key_id=api_key_id,
            limit_per_minute=limit_per_minute
        )
        
        headers = {
            "X-RateLimit-Limit": str(limit_per_minute),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_at),
            "X-RateLimit-Authenticated": "true" if is_authenticated else "false"
        }
        
        if not is_allowed:
            import time
            headers["Retry-After"] = str(max(1, reset_at - int(time.time())))
        
        return {
            "allowed": is_allowed,
            "remaining": remaining,
            "reset_at": reset_at,
            "headers": headers,
            "authenticated": is_authenticated
        }
    except Exception as e:
        # Fail open
        import logging
        logging.exception(f"Rate limit check failed: {e}")
        return {
            "allowed": True,
            "remaining": limit_per_minute,
            "reset_at": int(__import__('time').time()) + 60,
            "headers": {
                "X-RateLimit-Limit": str(limit_per_minute),
                "X-RateLimit-Authenticated": "true" if is_authenticated else "false"
            },
            "authenticated": is_authenticated
        }


async def enforce_rate_limit(request: Request, custom_limit: Optional[int] = None) -> None:
    """
    Enforce rate limit and raise HTTPException if exceeded.
    
    Usage in endpoint:
        await enforce_rate_limit(request, custom_limit=50)
    """
    api_key_id, limit_per_minute, _ = await extract_rate_limit_key(request)
    
    if custom_limit:
        limit_per_minute = custom_limit
    
    try:
        is_allowed, remaining, reset_at = await cache_service.check_rate_limit(
            api_key_id=api_key_id,
            limit_per_minute=limit_per_minute
        )
        
        if not is_allowed:
            import time
            retry_after = max(1, reset_at - int(time.time()))
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
                headers={
                    "X-RateLimit-Limit": str(limit_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_at),
                    "Retry-After": str(retry_after)
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        # Fail open on error
        import logging
        logging.exception(f"Rate limit enforcement error: {e}")
        pass
