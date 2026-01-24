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
        from sqlalchemy.dialects.postgresql import insert
        
        # Use upsert to handle race conditions
        stmt = insert(UserCredit).values(
            user_id=user_id,
            balance=FREE_TIER_CREDITS,
            total_purchased=0,
            total_consumed=0
        ).on_conflict_do_nothing(index_elements=['user_id'])
        
        await db.execute(stmt)
        
        # Now fetch the record (either existing or just created)
        result = await db.execute(
            select(UserCredit).where(UserCredit.user_id == user_id)
        )
        credits = result.scalar_one_or_none()

        # Check if we need to record the bonus (new user case)
        # This check should be more robust in production
        if credits and credits.balance == FREE_TIER_CREDITS and credits.total_consumed == 0:
            # Check if bonus already recorded
            bonus_check = await db.execute(
                select(CreditTransaction).where(
                    CreditTransaction.user_id == user_id,
                    CreditTransaction.transaction_type == TransactionType.BONUS
                ).limit(1)
            )
            if not bonus_check.scalar_one_or_none():
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
        await CreditsService.get_or_create_user_credits(user_id, db)
        result = await db.execute(
            select(UserCredit)
            .where(UserCredit.user_id == user_id)
            .with_for_update()
        )
        credits = result.scalar_one()

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
    ) -> Dict[str, Any]:
        """
        Atomically consume credits from balance.
        
        Uses SELECT FOR UPDATE to prevent race conditions between concurrent requests.
        
        Args:
            user_id: The user ID to consume credits from
            amount: Number of credits to consume (must be positive)
            db: Database session (required)
            description: Optional description of the consumption
            
        Returns:
            Dict with success status and updated balance info

        Note:
            Returns {"success": False, "error": "INSUFFICIENT_CREDITS", ...} if balance is insufficient.

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
        
        # Use get_or_create_user_credits to ensure row exists and BONUS is recorded
        await CreditsService.get_or_create_user_credits(user_id, db)
        
        # Use SELECT FOR UPDATE to lock the row and prevent race conditions
        result = await db.execute(
            select(UserCredit)
            .where(UserCredit.user_id == user_id)
            .with_for_update()  # Lock the row for atomic update
        )
        credits = result.scalar_one_or_none()

        # Check balance
        if credits.balance < amount:
            return {
                "success": False,
                "error": "INSUFFICIENT_CREDITS",
                "current_balance": credits.balance,
                "required": amount
            }

        # Atomically update balance
        credits.balance -= amount
        credits.total_consumed += amount

        # Record transaction
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,
            transaction_type=TransactionType.CONSUMPTION,
            description=description
        )
        db.add(transaction)
        await db.commit()

        return {
            "success": True,
            "consumed": amount,
            "balance": credits.balance,
            "total_consumed": credits.total_consumed
        }

    @staticmethod
    async def get_balance_info(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Get user's current balance info without consuming credits."""
        credits = await CreditsService.get_or_create_user_credits(user_id, db)
        return {
            "balance": credits.balance,
            "total_purchased": credits.total_purchased,
            "total_consumed": credits.total_consumed
        }

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
                    "extra_data": t.extra_data,
                    "created_at": t.created_at.isoformat()
                }
                for t in transactions
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    @staticmethod
    async def consume_for_usage(
        user_id: str,
        service_type: str,
        amount: float = 0,
        count: int = 1,
        db: AsyncSession = None
    ) -> Dict[str, Any]:
        """
        Consume credits based on usage (payments, SMS, email).
        
        Uses FeeCalculator to determine credit cost based on actual usage.
        
        Args:
            user_id: The user ID
            service_type: 'payment', 'sms', or 'email'
            amount: For payments, the transaction amount
            count: For SMS/email, the number of messages
            db: Database session
            
        Returns:
            Dict with success status, fee details, and updated balance
        """
        from .fee_calculator import FeeCalculator
        
        if db is None:
            raise TypeError("Database session (db) is required")
        
        # Calculate fee based on service type
        if service_type == "payment":
            fee = FeeCalculator.payment(amount)
        elif service_type == "sms":
            fee = FeeCalculator.sms(count)
        elif service_type == "email":
            fee = FeeCalculator.email(count)
        else:
            raise ValueError(f"Unknown service type: {service_type}")
        
        # Convert fee to credits (1 credit = ₹0.01)
        credits_to_consume = int(fee.fee_paise)  # fee_paise already in paise
        
        # Use existing consume_credit method
        result = await CreditsService.consume_credit(
            user_id=user_id,
            amount=credits_to_consume,
            db=db,
            description=f"{service_type} usage: ₹{fee.fee_rupees}"
        )
        
        # Add fee details to result
        result["fee_details"] = {
            "service_type": fee.service_type,
            "fee_rupees": fee.fee_rupees,
            "fee_paise": fee.fee_paise,
            "credits_consumed": credits_to_consume,
            "breakdown": fee.breakdown
        }
        
        return result

    @staticmethod
    async def has_sufficient_credits(user_id: str, required: int, db: AsyncSession) -> bool:
        """Check if user has enough credits"""
        credits = await CreditsService.get_or_create_user_credits(user_id, db)
        return credits.balance >= required
