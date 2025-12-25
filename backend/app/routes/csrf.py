"""CSRF Protection Routes"""

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel

from app.services.csrf_manager import CSRFTokenManager
from app.exceptions import OneRouterException, ErrorCode

router = APIRouter(prefix="/api", tags=["security"])


class CSRFTokenResponse(BaseModel):
    """Response containing a CSRF token"""
    csrf_token: str


@router.get("/csrf-token")
async def get_csrf_token(request: Request) -> CSRFTokenResponse:
    """
    Get a CSRF token for the current session
    
    This endpoint generates a new CSRF token tied to the user's session.
    The token must be included in the X-CSRF-Token header for all
    state-changing operations (POST, PUT, DELETE).
    
    **Security Notes:**
    - Tokens expire after 24 hours
    - A new token can be requested at any time
    - Tokens are session-specific (tied to the user's authentication)
    
    Returns:
        CSRFTokenResponse with csrf_token field
    """
    # Get session ID from user context or create one
    # If user is authenticated, use user_id, otherwise use session cookie
    session_id = None
    
    # Try to get from Clerk auth
    if hasattr(request.state, 'user_id') and request.state.user_id:
        session_id = request.state.user_id
    
    # Fallback to session cookie
    if not session_id:
        session_id = request.cookies.get('session_id')
    
    # Generate a session ID if we don't have one
    if not session_id:
        import secrets
        session_id = secrets.token_urlsafe(32)
    
    # Generate and store token
    token = await CSRFTokenManager.create_token(session_id)
    
    return CSRFTokenResponse(csrf_token=token)


@router.post("/csrf-validate")
async def validate_csrf_token(request: Request, token: str) -> dict:
    """
    Validate a CSRF token
    
    This is primarily used for testing and debugging.
    In normal operation, CSRF validation happens automatically
    on protected endpoints.
    
    Args:
        token: The CSRF token to validate
        
    Returns:
        Dictionary with validation result
    """
    session_id = None
    
    if hasattr(request.state, 'user_id') and request.state.user_id:
        session_id = request.state.user_id
    
    if not session_id:
        session_id = request.cookies.get('session_id')
    
    if not session_id:
        raise OneRouterException(
            error_code=ErrorCode.INVALID_REQUEST_FORMAT,
            message="No session found for CSRF validation",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    is_valid = await CSRFTokenManager.validate_token(session_id, token)
    
    return {
        "valid": is_valid,
        "session_id": session_id if is_valid else None
    }
