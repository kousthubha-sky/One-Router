"""
Credit Middleware for OneRouter
Check and deduct credits before API calls.
"""

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.credits_service import CreditsService


class CreditMiddleware:
    """Middleware class for credit checking and consumption"""
    
    @staticmethod
    async def check_and_consume(
        user_id: str,
        db: AsyncSession,
        description: str = "API call"
    ) -> dict:
        """
        Atomically check balance and consume 1 credit.
        
        Uses SELECT FOR UPDATE to prevent race conditions.
        
        Args:
            user_id: The user ID
            db: Database session
            description: Description for the transaction
            
        Returns:
            Dict with success status and updated balance
            
        Raises:
            HTTPException: (402) If insufficient credits
        """
        result = await CreditsService.consume_credit(user_id, 1, db, description)
        
        if not result["success"]:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "INSUFFICIENT_CREDITS",
                    "message": result.get("error", "Not enough credits"),
                    "current_balance": result.get("current_balance", 0),
                    "required": result.get("required", 1),
                    "suggestion": "Purchase more credits at /credits"
                }
            )
        
        return result
    
    @staticmethod
    async def get_balance(user_id: str, db: AsyncSession) -> dict:
        """Get user's current balance info without consuming credits."""
        return await CreditsService.get_balance_info(user_id, db)


def get_user_id(user) -> str:
    """
    Safely extract user ID from various user object types.
    
    Supports:
    - dict with "id" key
    - Pydantic model with "id" attribute
    - Object with "id" attribute
    
    Args:
        user: User object (dict, Pydantic model, or object)
        
    Returns:
        User ID as string
    """
    if isinstance(user, dict):
        user_id = user.get("id")
        if user_id is None:
            raise ValueError("User dict missing 'id' key or 'id' is None")
        return str(user_id)
    elif hasattr(user, "id"):
        user_id = user.id
        if user_id is None:
            raise ValueError("User object has None 'id' attribute")
        return str(user_id)
    else:
        raise ValueError(f"Cannot extract user ID from {type(user)}")
