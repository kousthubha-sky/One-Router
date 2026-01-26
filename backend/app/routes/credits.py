"""
Credits API Routes
Endpoints for credit balance, purchases, and transaction history.
"""

import json
import hmac
import hashlib
import jwt
import logging
import httpx
from uuid import uuid4
from datetime import datetime, timedelta
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth.dependencies import get_current_user, get_api_user, get_api_or_current_user
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
    user=Depends(get_api_or_current_user),
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
    user=Depends(get_api_or_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's credit transaction history.
    """
    user_id = str(user.get("id"))
    history = await CreditsService.get_transaction_history(user_id, db, limit, offset)

    return TransactionHistoryResponse(**history)


@router.post("/purchase", response_model=CreditPurchaseResponse)
async def purchase_credits(
    request: CreditPurchaseRequest,
    user=Depends(get_api_or_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate credit purchase using OneRouter SDK (dogfooding).

    Instead of directly calling Razorpay, this endpoint uses OneRouter's own
    SDK to process payments - eating our own dogfood.
    """
    from onerouter import OneRouter, APIError, AuthenticationError
    from sqlalchemy import select
    from ..models import User

    user_id = str(user.get("id"))
    user_email = user.get("email", "")

    # Get user's preferred environment for payment processing
    # Check API key environment first, then user preferences, default to "test"
    user_environment = user.get("environment")  # From API key auth
    if not user_environment:
        # Get from user preferences in database
        result = await db.execute(select(User.preferences).where(User.id == user_id))
        preferences = result.scalar_one_or_none()
        if preferences:
            user_environment = preferences.get("current_environment", "test")
        else:
            user_environment = "test"

    logger.debug(
        "Purchase credits initiated (via SDK dogfooding)",
        extra={"user_id_prefix": user_id[:8], "auth_type": user.get("auth_type", "unknown"), "environment": user_environment}
    )

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

    # Use OneRouter SDK to create payment link (dogfooding)
    link = None
    try:
        async with OneRouter(
            api_key=settings.ONEROUTER_API_KEY,
            base_url=settings.ONEROUTER_API_BASE_URL
        ) as client:
            link = await client.payment_links.create(
                amount=price_inr,
                description=f"Purchase {credits_to_buy} OneRouter credits",
                customer_email=user_email if user_email else None,
                callback_url=f"{settings.FRONTEND_URL}/credits/payment-callback",
                notes={
                    "onerouter_user_id": user_id,
                    "credits": str(credits_to_buy),
                    "type": "credit_purchase"
                },
                environment=user_environment  # Pass user's preferred environment
            )

            logger.info(
                "Payment link created via SDK dogfooding",
                extra={"credits_purchased": credits_to_buy, "amount_inr": price_inr}
            )

    except AuthenticationError as e:
        logger.error(
            "SDK authentication failed - check ONEROUTER_API_KEY",
            extra={"error": str(e), "user_id_prefix": user_id[:8]},
            exc_info=True
        )
        raise HTTPException(
            status_code=503,
            detail="Payment service configuration error. Please contact support."
        )
    except APIError as e:
        logger.error(
            "SDK API error during payment link creation",
            extra={"error": str(e), "user_id_prefix": user_id[:8]},
            exc_info=True
        )

        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            logger.warning(
                f"Falling back to demo order for user {user_id} due to SDK error: {str(e)}"
            )
            link = {
                "provider_order_id": f"demo_link_{user_id[:8]}",
                "checkout_url": f"https://demo.onerouter.com/pay/demo_link_{user_id[:8]}"
            }
        else:
            raise HTTPException(
                status_code=503,
                detail="Payment service temporarily unavailable. Please try again later."
            )
    except Exception as e:
        logger.error(
            "Unexpected error during SDK payment link creation",
            extra={"error_type": type(e).__name__, "user_id_prefix": user_id[:8]},
            exc_info=True
        )

        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            logger.warning(
                f"Falling back to demo order for user {user_id} due to: {str(e)}"
            )
            link = {
                "provider_order_id": f"demo_link_{user_id[:8]}",
                "checkout_url": f"https://demo.onerouter.com/pay/demo_link_{user_id[:8]}"
            }
        else:
            raise HTTPException(
                status_code=503,
                detail="Payment service temporarily unavailable. Please try again later."
            )

    # Store pending payment
    # Note: Adapter returns "provider_order_id" and "checkout_url" keys
    order_id = link.get("provider_order_id") or link.get("id") or link.get("transaction_id", "")
    checkout_url = link.get("checkout_url") or link.get("short_url", "")

    payment = OneRouterPayment(
        user_id=user_id,
        amount=price_inr,
        currency=request.currency,
        credits_purchased=credits_to_buy,
        provider="onerouter",  # Changed from "razorpay" - we're dogfooding
        provider_order_id=order_id,
        checkout_url=checkout_url,
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return CreditPurchaseResponse(
        payment_id=str(payment.id),
        order_id=order_id,
        credits=credits_to_buy,
        amount=price_inr,
        currency=request.currency,
        checkout_url=checkout_url
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
    user=Depends(get_api_or_current_user),
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
                    # Revert payment status since credits weren't added
                    payment.status = PaymentStatus.PENDING
                    await db.commit()
                    logger.error(
                        f"Failed to add credits for payment {payment.id}: {type(e).__name__}: {str(e)}",
                        exc_info=True
                    )
                    # Return 200 to prevent Razorpay retries, handle via reconciliation
                    return {"status": "error", "message": "Credit addition failed, requires manual reconciliation"}                
    
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
    user=Depends(get_api_or_current_user),
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


@router.post("/simulate-payment/{payment_id}")
async def simulate_payment_success(
    payment_id: str,
    user=Depends(get_api_or_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Simulate a successful payment for testing/development purposes only.
    In production, this endpoint should be disabled.
    """
    from ..config import settings
    
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=403,
            detail="This endpoint is not available in production"
        )
    
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
    
    if payment.status in (PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED):
        return {
            "status": "already_processed",
            "message": f"Payment already has status: {payment.status.value}"
        }
    
    # Simulate successful payment
    payment.status = PaymentStatus.SUCCESS
    payment.provider_payment_id = f"simulated_pay_{uuid4().hex[:12]}"
    
    # Add credits to user
    try:
        await CreditsService.add_credits(
            user_id=payment.user_id,
            amount=payment.credits_purchased,
            transaction_type=TransactionType.PURCHASE,
            payment_id=str(payment.id),
            description=f"Purchased {payment.credits_purchased} credits (simulated)",
            db=db
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to add credits for simulated payment {payment.id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to add credits. Please try again."
        )
    
    logger.info(
        f"Simulated payment success for {payment.id}: "
        f"added {payment.credits_purchased} credits to user {payment.user_id}"
    )
    
    return {
        "status": "success",
        "payment_id": str(payment.id),
        "credits_added": payment.credits_purchased,
        "message": "Payment simulated successfully. Credits have been added to your account."
    }


# ==================== Helper Functions ====================

def _create_payment_result_token(result: Dict[str, Any]) -> str:
    """
    Create a signed JWT token for payment result.
    Prevents URL tampering by verifying server-side.
    """
    payload = {
        "status": result.get("status", "error"),
        "message": result.get("message", ""),
        "credits": result.get("credits_added") or result.get("credits", 0),
        "balance": result.get("new_balance", 0),
        "payment_id": result.get("payment_id", ""),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def _verify_payment_result_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode payment result token.
    Returns the payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return {
            "status": payload.get("status"),
            "message": payload.get("message", ""),
            "credits": payload.get("credits", 0),
            "balance": payload.get("balance", 0),
            "payment_id": payload.get("payment_id", "")
        }
    except jwt.PyJWTError:
        return None


async def _process_payment_callback(
    razorpay_payment_id: Optional[str],
    razorpay_payment_link_id: Optional[str],
    razorpay_payment_link_status: Optional[str],
    razorpay_signature: Optional[str],
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Shared helper to process Razorpay payment callbacks.
    Implements signature verification, transaction safety with row locks,
    and comprehensive error handling.
    
    Returns response dict with 'status', 'message', and optional 'credits_added', 'new_balance'.
    """
    try:
        # Input validation
        if not razorpay_payment_link_status:
            return {
                "status": "failed",
                "message": "Payment status is required"
            }
        
        if razorpay_payment_link_status != "paid":
            return {
                "status": "failed",
                "message": f"Payment not completed. Status: {razorpay_payment_link_status}"
            }
        
        if not razorpay_payment_id:
            return {
                "status": "failed",
                "message": "No payment ID provided"
            }
        
        if not razorpay_payment_link_id:
            return {
                "status": "failed",
                "message": "No payment link ID provided"
            }
        
        # Signature verification
        if razorpay_signature:
            try:
                razorpay = RazorpayService()
                is_valid = razorpay.verify_payment_link_signature(
                    razorpay_payment_id,
                    razorpay_payment_link_id,
                    razorpay_signature
                )
                if not is_valid:
                    logger.warning(
                        f"Invalid signature for payment {razorpay_payment_id}, "
                        f"link {razorpay_payment_link_id}"
                    )
                    return {
                        "status": "failed",
                        "message": "Invalid payment signature"
                    }
                logger.debug(f"Signature verified for payment {razorpay_payment_id}")
            except Exception as e:
                logger.error(f"Signature verification error: {str(e)}")
                return {
                    "status": "failed",
                    "message": "Signature verification failed"
                }
        
        # Find payment with row-level lock to prevent concurrent processing
        # Using SELECT ... FOR UPDATE to lock the row
        # Using exact equality check to prevent SQL injection and ensure correct matches
        result = await db.execute(
            select(OneRouterPayment)
            .where(
                OneRouterPayment.provider_order_id == razorpay_payment_link_id
            )
            .with_for_update()  # Row-level lock
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            logger.warning(
                f"Payment not found for link {razorpay_payment_link_id}, "
                f"payment_id {razorpay_payment_id}"
            )
            return {
                "status": "failed",
                "message": "Payment record not found"
            }
        
        # Check if already processed (idempotency check)
        if payment.status == PaymentStatus.SUCCESS:
            logger.info(
                f"Payment {payment.id} already processed (idempotent). "
                f"Credits: {payment.credits_purchased}"
            )
            return {
                "status": "already_processed",
                "message": "Payment already processed",
                "credits": payment.credits_purchased
            }
        
        if payment.status in (PaymentStatus.FAILED, PaymentStatus.REFUNDED):
            logger.warning(
                f"Cannot process payment {payment.id} with status {payment.status.value}"
            )
            return {
                "status": "failed",
                "message": f"Payment has status: {payment.status.value}"
            }
        
        # Ensure payment is still PENDING before processing
        if payment.status != PaymentStatus.PENDING:
            logger.warning(
                f"Payment {payment.id} is not PENDING (status: {payment.status.value})"
            )
            return {
                "status": "failed",
                "message": f"Invalid payment status: {payment.status.value}"
            }
        
        # Update payment status in transaction
        try:
            payment.status = PaymentStatus.SUCCESS
            payment.provider_payment_id = razorpay_payment_id
            
            # Add credits to user
            await CreditsService.add_credits(
                user_id=payment.user_id,
                amount=payment.credits_purchased,
                transaction_type=TransactionType.PURCHASE,
                payment_id=str(payment.id),
                description=f"Purchased {payment.credits_purchased} credits via Razorpay",
                db=db
            )
            
            # Commit the transaction (releases row lock)
            await db.commit()
            
            logger.info(
                f"Payment {payment.id} processed successfully. "
                f"Added {payment.credits_purchased} credits to user {payment.user_id}"
            )
            
            # Get updated balance after successful commit
            balance_info = await CreditsService.get_balance(payment.user_id, db)
            
            return {
                "status": "success",
                "message": "Payment successful! Credits have been added to your account.",
                "credits_added": payment.credits_purchased,
                "new_balance": balance_info.get("balance", 0)
            }
        
        except Exception as e:
            await db.rollback()
            logger.error(
                f"Error processing payment {payment.id}: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            return {
                "status": "error",
                "message": "Failed to process payment. Please contact support.",
                "error_code": type(e).__name__
            }
    
    except Exception as e:
        logger.error(
            f"Unexpected error in payment callback: {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        return {
            "status": "error",
            "message": "An unexpected error occurred. Please contact support.",
            "error_code": type(e).__name__
        }


@router.get("/payment-callback")
@router.post("/payment-callback")
async def razorpay_payment_callback(
    request: Request,
    razorpay_payment_id: Optional[str] = None,
    razorpay_payment_link_id: Optional[str] = None,
    razorpay_payment_link_status: Optional[str] = None,
    razorpay_signature: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Callback URL that Razorpay redirects to after payment (/v1 prefix).
    Handles both GET and POST requests.
    Adds credits to user's account when payment is confirmed.
    """
    logger.info(f"Payment callback received - payment_id: {razorpay_payment_id}, status: {razorpay_payment_link_status}")
    
    return await _process_payment_callback(
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_status,
        razorpay_signature,
        db
    )



# Separate router for callback without /v1 prefix (for Razorpay redirects)
callback_router = APIRouter(prefix="", tags=["Payment Callback"])

@callback_router.get("/credits/payment-callback")
@callback_router.post("/credits/payment-callback")
async def razorpay_payment_callback_public(
    request: Request,
    razorpay_payment_id: Optional[str] = None,
    razorpay_payment_link_id: Optional[str] = None,
    razorpay_payment_link_status: Optional[str] = None,
    razorpay_signature: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
    ):
    """
    Public callback URL for Razorpay payment redirects (no /v1 prefix).
    Redirects to frontend with signed payment result token to prevent tampering.
    """
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
    
    result = await _process_payment_callback(
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_status,
        razorpay_signature,
        db
    )
    
    token = _create_payment_result_token(result)
    redirect_url = f"{frontend_url}/credits/payment-result?token={token}"
    
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.get("/payment-result/verify")
async def verify_payment_result(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify payment result token and return actual payment status.
    Frontend should call this endpoint to validate the token from the redirect URL.
    """
    result = _verify_payment_result_token(token)
    if not result:
        return {
            "status": "error",
            "message": "Invalid or expired payment result token"
        }
    
    if result["status"] == "success" and result.get("payment_id"):
        try:
            result_stmt = await db.execute(
                select(OneRouterPayment)
                .where(OneRouterPayment.id == result["payment_id"])
            )
            payment = result_stmt.scalar_one_or_none()
            if payment:
                balance_stmt = await db.execute(
                    select(UserCredit.balance)
                    .where(UserCredit.user_id == payment.user_id)
                )
                current_balance = balance_stmt.scalar_one_or_none()
                if current_balance is not None:
                    result["balance"] = int(current_balance)
        except Exception:
            pass
    
    return result
