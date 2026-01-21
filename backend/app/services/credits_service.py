"""
OneRouter Credits Service
Handles credit balance management, purchases, and consumption tracking.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

from ..models import UserCredit, CreditTransaction, OneRouterPayment, TransactionType, PaymentStatus, User


# Free tier credit allocation
FREE_TIER_CREDITS = 1000


class CreditsService:
    """Service for managing user credits"""

    @staticmethod
    async def get_or_create_user_credits(user_id: str, db: AsyncSession) -> UserCredit:
        """Get user credits, creating if doesn't exist with free tier balance"""
        result = await db.execute(
            select(UserCredit).where(UserCredit.user_id == user_id)
        )
        credits = result.scalar_one_or_none()

        if not credits:
            # Create new user credit with free tier
            credits = UserCredit(
                user_id=user_id,
                balance=FREE_TIER_CREDITS,
                total_purchased=0,
                total_consumed=0
            )
            db.add(credits)

            # Record initial bonus
            transaction = CreditTransaction(
                user_id=user_id,
                amount=FREE_TIER_CREDITS,
                transaction_type=TransactionType.BONUS,
                description=f"Free tier bonus - {FREE_TIER_CREDITS} credits/month"
            )
            db.add(transaction)
            await db.commit()
            await db.refresh(credits)

        return credits

    @staticmethod
    async def get_balance(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """
        Get user's current credit balance and stats.
        
        Note: free_tier_estimated_remaining is an approximation based on total_consumed
        and does not account for the order in which credits were consumed (FIFO assumption).
        Use the balance field for the actual remaining credits.
        """
        credits = await CreditsService.get_or_create_user_credits(user_id, db)

        # Get recent transactions
        result = await db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(10)
        )
        transactions = result.scalars().all()

        # Calculate estimated free tier remaining (approximation)
        free_tier_estimated = max(0, FREE_TIER_CREDITS - credits.total_consumed)

        return {
            "balance": credits.balance,
            "total_purchased": credits.total_purchased,
            "total_consumed": credits.total_consumed,
            "free_tier_estimated_remaining": free_tier_estimated,
            "free_tier_estimate_note": "Approximation based on total consumed; assumes FIFO consumption order",
            "is_estimate": True,
            "recent_transactions": [
                {
                    "id": str(t.id),
                    "amount": t.amount,
                    "type": t.transaction_type.value,
                    "description": t.description,
                    "created_at": t.created_at.isoformat()
                }
                for t in transactions
            ]
        }

    @staticmethod
    async def add_credits(
        user_id: str,
        amount: int,
        transaction_type: TransactionType,
        payment_id: Optional[str] = None,
        description: Optional[str] = None,
        db: AsyncSession = None
    ) -> UserCredit:
        """
        Add credits to user balance.
        
        Args:
            user_id: The user ID to add credits to
            amount: Number of credits to add (must be positive)
            transaction_type: Type of transaction (e.g., PURCHASE, BONUS)
            payment_id: Optional payment ID associated with the transaction
            description: Optional description of the transaction
            db: Database session (required, cannot be None)
            
        Raises:
            TypeError: If db is None
            ValueError: If amount is not positive
        """
        # Validate db parameter
        if db is None:
            raise TypeError("Database session (db) is required and cannot be None")
        
        # Validate amount
        if not isinstance(amount, int) or amount <= 0:
            raise ValueError(f"Amount must be a positive integer, got: {amount}")
        
        credits = await CreditsService.get_or_create_user_credits(user_id, db)

        # Update balance
        credits.balance += amount
        
        # Only update total_purchased for legitimate purchase transactions
        if transaction_type == TransactionType.PURCHASE:
            credits.total_purchased += amount

        # Record transaction
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,
            transaction_type=transaction_type,
            payment_id=payment_id,
            description=description
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(credits)

        return credits

    @staticmethod
    async def consume_credit(
        user_id: str,
        amount: int = 1,
        db: AsyncSession = None,
        description: str = "API call"
    ) -> bool:
        """
        Consume credits from balance.
        
        Args:
            user_id: The user ID to consume credits from
            amount: Number of credits to consume (must be positive)
            db: Database session (required, cannot be None)
            description: Optional description of the consumption
            
        Returns:
            True if consumption was successful, False if insufficient balance
            
        Raises:
            TypeError: If db is None
            ValueError: If amount is not positive
        """
        # Validate db parameter
        if db is None:
            raise TypeError("Database session (db) is required and cannot be None")
        
        # Validate amount
        if not isinstance(amount, int) or amount <= 0:
            raise ValueError(f"Amount must be a positive integer, got: {amount}")
        
        credits = await CreditsService.get_or_create_user_credits(user_id, db)

        # Check balance before consuming
        if credits.balance < amount:
            return False

        # Update balance
        credits.balance -= amount
        credits.total_consumed += amount

        # Record transaction
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,  # Negative for consumption
            transaction_type=TransactionType.CONSUMPTION,
            description=description
        )
        db.add(transaction)
        await db.commit()

        return True

    @staticmethod
    async def get_transaction_history(
        user_id: str,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get user's credit transaction history"""
        # Get total count
        count_result = await db.execute(
            select(func.count(CreditTransaction.id))
            .where(CreditTransaction.user_id == user_id)
        )
        total = count_result.scalar() or 0

        # Get transactions
        result = await db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(CreditTransaction.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        transactions = result.scalars().all()

        return {
            "transactions": [
                {
                    "id": str(t.id),
                    "amount": t.amount,
                    "type": t.transaction_type.value,
                    "payment_id": t.payment_id,
                    "description": t.description,
                    "metadata": t.metadata,
                    "created_at": t.created_at.isoformat()
                }
                for t in transactions
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    @staticmethod
    async def has_sufficient_credits(user_id: str, required: int, db: AsyncSession) -> bool:
        """Check if user has enough credits"""
        credits = await CreditsService.get_or_create_user_credits(user_id, db)
        return credits.balance >= required
