"""
Credits API Routes
Endpoints for credit balance, purchases, and transaction history.
"""

import json
import hmac
import hashlib
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.credits_service import CreditsService
from ..services.razorpay_service import RazorpayService, CreditPricingService
from ..models import UserCredit, CreditTransaction, OneRouterPayment, TransactionType, PaymentStatus
from ..config import settings


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/credits", tags=["Credits"])


# Pydantic models
class CreditPurchaseRequest(BaseModel):
    """Request to purchase credits"""
    credits: int = Field(..., ge=100, le=100000, description="Number of credits to purchase")
    currency: str = Field(default="INR", description="Currency for payment")
    plan_id: Optional[str] = Field(None, description="Predefined plan ID")


class CreditPurchaseResponse(BaseModel):
    """Response for credit purchase"""
    payment_id: str
    order_id: str
    credits: int
    amount: float
    currency: str
    checkout_url: str


class CreditBalanceResponse(BaseModel):
    """
    Response for credit balance query.
    
    Note: free_tier_estimated_remaining is an approximation and assumes FIFO consumption order.
    """
    balance: int
    total_purchased: int
    total_consumed: int
    free_tier_estimated_remaining: int
    free_tier_estimate_note: str
    is_estimate: bool
    recent_transactions: list


class TransactionHistoryResponse(BaseModel):
    """Response for transaction history"""
    transactions: list
    total: int
    limit: int
    offset: int


class CreditConsumeRequest(BaseModel):
    """Request to simulate credit consumption (for testing)"""
    amount: int = Field(default=1, ge=1, le=100)


@router.get("/balance", response_model=CreditBalanceResponse)
async def get_credit_balance(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's credit balance and recent transactions.
    """
    user_id = str(user.get("id"))
    balance_info = await CreditsService.get_balance(user_id, db)

    return CreditBalanceResponse(**balance_info)


@router.get("/transactions")
async def get_transaction_history(
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's credit transaction history.
    """
    user_id = str(user.get("id"))
    history = await CreditsService.get_history(user_id, db, limit, offset)

    return TransactionHistoryResponse(**history)


@router.post("/purchase", response_model=CreditPurchaseResponse)
async def purchase_credits(
    request: CreditPurchaseRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate credit purchase. Returns Razorpay checkout URL.
    """
    user_id = str(user.get("id"))
    user_email = user.get("email", "")
    user_phone = user.get("phone", "")

    # Calculate credits and price
    if request.plan_id:
        plan = CreditPricingService.get_plan(request.plan_id)
        if not plan:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid plan ID: {request.plan_id}"
            )
        credits_to_buy = plan["credits"]
        price_inr = plan["price_inr"]
    else:
        credits_to_buy = request.credits
        price_inr = CreditPricingService.calculate_amount(credits_to_buy, request.currency)

    # Create Razorpay order
    razorpay = RazorpayService()
    amount_paise = CreditPricingService.credits_to_paise(price_inr)

    try:
        order = await razorpay.create_order(
            amount=amount_paise,
            currency=request.currency,
            notes={
                "user_id": user_id,
                "credits": str(credits_to_buy),
                "type": "credit_purchase"
            }
        )
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as e:
        # Log the exception for debugging
        logger.error(
            f"Razorpay order creation failed for user {user_id}: {type(e).__name__}: {str(e)}"
        )
        
        # Only return demo order in development mode
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            logger.warning(
                f"Falling back to demo order for user {user_id} due to: {str(e)}"
            )
            order_id = f"demo_order_{user_id[:8]}"
            order = {
                "id": order_id,
                "amount": amount_paise,
                "currency": request.currency,
                "checkout_url": f"https://checkout.razorpay.com/demo/{order_id}"
            }
        else:
            # In production, don't hide the error
            raise HTTPException(
                status_code=503,
                detail="Payment service temporarily unavailable. Please try again later."
            )

    # Store pending payment
    payment = OneRouterPayment(
        user_id=user_id,
        amount=price_inr,
        currency=request.currency,
        credits_purchased=credits_to_buy,
        provider="razorpay",
        provider_order_id=order["id"],
        checkout_url=order.get("checkout_url"),
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return CreditPurchaseResponse(
        payment_id=str(payment.id),
        order_id=order["id"],
        credits=credits_to_buy,
        amount=price_inr,
        currency=request.currency,
        checkout_url=order.get("checkout_url", "")
    )


@router.get("/plans")
async def get_credit_plans():
    """
    Get available credit purchase plans.
    """
    plans = CreditPricingService.get_plans()
    return {
        "free_tier": CreditPricingService.FREE_TIER,
        "plans": plans
    }


@router.post("/consume")
async def consume_credit(
    request: CreditConsumeRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Consume credits from balance (for testing/demonstration).
    """
    user_id = str(user.get("id"))

    success = await CreditsService.consume_credit(
        user_id=user_id,
        amount=request.amount,
        db=db,
        description=f"Test consumption: {request.amount} credits"
    )

    if not success:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits. Please purchase more credits."
        )

    # Get updated balance
    balance_info = await CreditsService.get_balance(user_id, db)

    return {
        "success": True,
        "consumed": request.amount,
        "remaining_balance": balance_info["balance"]
    }


@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Razorpay webhook for payment success/failure.
    Verifies webhook signature before processing.
    """
    # Get raw body for signature verification
    body = await request.body()
    payload_str = body.decode("utf-8") if body else ""

    # Get headers
    razorpay_signature = request.headers.get("x-razorpay-signature", "")
    razorpay_event = request.headers.get("x-razorpay-event", "")

    # Verify webhook signature
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret:
        logger.error("Razorpay webhook secret not configured")
        raise HTTPException(
            status_code=401,
            detail="Webhook configuration error"
        )

    if not razorpay_signature:
        logger.error(
            f"Missing Razorpay signature. Event: {razorpay_event}"
        )
        raise HTTPException(
            status_code=400,
            detail="Missing signature"
        )

    # Compute HMAC-SHA256 signature
    computed_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # Verify signature using constant-time comparison
    if not hmac.compare_digest(computed_signature, razorpay_signature):
        logger.error(
            f"Razorpay signature verification failed. "
            f"Event: {razorpay_event}"
        )
        raise HTTPException(
            status_code=400,
            detail="Signature verification failed"
        )

    # Parse payload
    try:
        payload = json.loads(payload_str) if payload_str else {}
    except json.JSONDecodeError as e:
        logger.error(
            f"Failed to parse Razorpay webhook payload. "
            f"Event: {razorpay_event}, "
            f"Error: {type(e).__name__}: {str(e)}, "
            f"Payload: {payload_str[:200]}"  # Log first 200 chars to avoid huge logs
        )
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload: malformed JSON"
        )

    # Handle different events
    if razorpay_event == "payment.captured" or razorpay_event == "payment.success":
        # Payment successful
        payment_id = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
        order_id = payload.get("payload", {}).get("order", {}).get("entity", {}).get("id")

        if payment_id and order_id:
            # Find and update payment record
            result = await db.execute(
                select(OneRouterPayment)
                .where(OneRouterPayment.provider_order_id == order_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                # Idempotency check - skip if already processed
                if payment.status in (PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED):
                    return {"status": "already_processed"}

                # Update payment status
                payment.status = PaymentStatus.SUCCESS
                payment.provider_payment_id = payment_id

                # Add credits to user
                try:
                    await CreditsService.add_credits(
                        user_id=payment.user_id,
                        amount=payment.credits_purchased,
                        transaction_type=TransactionType.PURCHASE,
                        payment_id=str(payment.id),
                        description=f"Purchased {payment.credits_purchased} credits",
                        db=db
                    )
                    await db.commit()
                except Exception as e:
                    await db.rollback()
                    logger.error(
                        f"Failed to add credits for payment {payment.id}: {type(e).__name__}: {str(e)}"
                    )
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to process payment credits. Please contact support."
                    )

    elif razorpay_event == "payment.failed":
        # Payment failed
        error_code = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("error_code", "UNKNOWN")
        order_id = payload.get("payload", {}).get("order", {}).get("entity", {}).get("id")

        if order_id:
            result = await db.execute(
                select(OneRouterPayment)
                .where(OneRouterPayment.provider_order_id == order_id)
            )
            payment = result.scalar_one_or_none()

            if payment:
                payment.status = PaymentStatus.FAILED
                payment.error_message = error_code
                await db.commit()

    return {"status": "received"}


@router.get("/verify-payment/{payment_id}")
async def verify_payment(
    payment_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify payment status and get details.
    """
    user_id = str(user.get("id"))

    result = await db.execute(
        select(OneRouterPayment)
        .where(
            OneRouterPayment.id == payment_id,
            OneRouterPayment.user_id == user_id
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    # If pending, verify with Razorpay using order ID
    if payment.status == PaymentStatus.PENDING and payment.provider_order_id:
        razorpay = RazorpayService()
        try:
            # Verify payment using order ID (preferred method)
            verification = await razorpay.verify_payment(
                payment.provider_payment_id or "",
                payment.provider_order_id
            )
            if verification.get("status") == "captured":
                payment.status = PaymentStatus.SUCCESS
                # Update provider_payment_id if available from verification
                if payment.provider_payment_id is None and verification.get("payment_id"):
                    payment.provider_payment_id = verification.get("payment_id")
                await db.commit()
                logger.info(
                    f"Payment {payment.id} verified and marked as SUCCESS. "
                    f"Order: {payment.provider_order_id}"
                )
        except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as e:
            logger.warning(
                f"Failed to verify payment {payment.id} with order {payment.provider_order_id}: {str(e)}"
            )
            # Keep pending if verification fails

    return {
        "payment_id": str(payment.id),
        "amount": float(payment.amount),
        "currency": payment.currency,
        "credits": payment.credits_purchased,
        "status": payment.status.value,
        "created_at": payment.created_at.isoformat(),
        "provider_payment_id": payment.provider_payment_id
    }
