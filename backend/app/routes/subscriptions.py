"""
Subscriptions API Routes
Endpoints for subscription plans and management.
"""

import logging
from uuid import uuid4
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth.dependencies import get_current_user, get_api_user, get_api_or_current_user
from ..services.razorpay_service import CreditPricingService
from ..services.credits_service import CreditsService
from ..models import UserCredit, CreditTransaction, OneRouterPayment, TransactionType, PaymentStatus, User, Subscription, SubscriptionStatus
from ..config import settings


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/subscriptions", tags=["Subscriptions"])


class SubscriptionPurchaseRequest(BaseModel):
    """Request to start a subscription"""
    plan_id: str = Field(..., description="Subscription plan ID (sub_pro, sub_team, sub_enterprise)")
    provider: str = Field(..., description="Payment provider: razorpay or dodo")
    currency: str = Field(default="USD", description="Currency for payment")


class SubscriptionPurchaseResponse(BaseModel):
    """Response for subscription purchase"""
    subscription_id: str
    checkout_url: str
    plan_id: str
    plan_name: str
    credits_per_month: int
    price: float
    currency: str
    provider: str


class SubscriptionCancelRequest(BaseModel):
    """Request to cancel a subscription"""
    cancel_at_period_end: bool = Field(default=True, description="Cancel at period end or immediately")


@router.get("/plans")
async def get_subscription_plans(currency: str = "USD"):
    """
    Get available subscription plans.
    """
    plans = CreditPricingService.get_subscription_plans()

    formatted_plans = []
    for plan in plans:
        formatted_plan = {
            "id": plan["id"],
            "name": plan["name"],
            "description": plan["description"],
            "features": plan["features"],
            "interval": plan["interval"],
            "credits_per_month": plan["credits"]
        }
        if currency.upper() == "INR":
            formatted_plan["price"] = plan["price_inr"]
            formatted_plan["currency"] = "INR"
        else:
            formatted_plan["price"] = plan["price_usd"]
            formatted_plan["currency"] = "USD"
        formatted_plans.append(formatted_plan)

    return {
        "plans": formatted_plans,
        "currency": currency.upper()
    }


@router.post("/purchase", response_model=SubscriptionPurchaseResponse)
async def purchase_subscription(
    request: SubscriptionPurchaseRequest,
    user=Depends(get_api_or_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start a subscription purchase flow.
    """
    user_id = str(user.get("id"))
    user_email = user.get("email", "")

    plan = CreditPricingService.get_subscription_plan(request.plan_id)
    if not plan:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subscription plan: {request.plan_id}"
        )

    if request.currency.upper() == "INR":
        price = plan["price_inr"]
    else:
        price = plan["price_usd"]

    logger.info(
        f"Subscription purchase initiated: user={user_id}, plan={plan['name']}, provider={request.provider}, price={price}"
    )

    checkout_url = None
    subscription_id = None
    provider_order_id = None
    provider_name = request.provider.lower()

    # Razorpay: Dogfood via OneRouter SDK
    if provider_name == "razorpay":
        try:
            from onerouter import OneRouter

            async with OneRouter(
                api_key=settings.ONEROUTER_API_KEY,
                base_url=settings.ONEROUTER_API_BASE_URL
            ) as client:
                payment_data = {
                    "amount": round(price, 2),
                    "description": f"OneRouter {plan['name']} Subscription - {plan['credits']} credits/month",
                    "customer_email": user_email if user_email else None,
                    "callback_url": f"{settings.FRONTEND_URL}/credits/subscription-callback/razorpay",
                    "notes": {
                        "onerouter_user_id": user_id,
                        "type": "subscription_purchase",
                        "plan_id": request.plan_id,
                        "plan_name": plan["name"],
                        "credits_per_month": str(plan["credits"]),
                        "interval": plan["interval"],
                        "is_recurring": "true"
                    }
                }

                if user.get("environment") == "live":
                    payment_data["environment"] = "live"
                else:
                    payment_data["environment"] = "test"

                payment_link = await client.payment_links.create(**payment_data)

                subscription_id = f"sub_{user_id[:8]}_{uuid4().hex[:8]}"
                checkout_url = payment_link.get("short_url") or payment_link.get("checkout_url")

                # Log the FULL response so we can see every key returned by the SDK
                logger.info(f"Razorpay payment_link FULL response: {dict(payment_link)}")

                # Try every known key name the SDK/API might use for the payment link ID
                provider_order_id = (
                    payment_link.get("id")
                    or payment_link.get("payment_link_id")
                    or payment_link.get("razorpay_payment_link_id")
                    or payment_link.get("link_id")
                    or payment_link.get("order_id")
                    or payment_link.get("transaction_id")
                    or payment_link.get("reference_id")
                    # Last resort: extract from short_url (https://rzp.io/i/XXXXX -> plink_XXXXX won't work
                    # but the short_url itself is unique and can be used as a fallback key)
                )

                # If still None, try to find any key whose value starts with 'plink_'
                if not provider_order_id:
                    for k, v in payment_link.items():
                        if isinstance(v, str) and v.startswith("plink_"):
                            provider_order_id = v
                            logger.info(f"Found plink_ value under key '{k}': {v}")
                            break

                logger.info(
                    f"Razorpay subscription created: subscription_id={subscription_id}, "
                    f"payment_link_id={provider_order_id}, checkout_url={checkout_url}"
                )

                if not provider_order_id:
                    raise Exception(
                        "Could not extract payment link ID from Razorpay SDK response. "
                        f"Available keys: {list(payment_link.keys())}. "
                        "Cannot store subscription without provider_order_id."
                    )

                if not checkout_url:
                    raise Exception("No checkout URL returned from Razorpay")

        except ImportError:
            logger.warning("OneRouter SDK not installed, using direct Razorpay API")
            # Fallback to direct Razorpay API
            import httpx
            razorpay_key = settings.RAZORPAY_KEY_ID
            razorpay_secret = settings.RAZORPAY_KEY_SECRET
            
            if not razorpay_key or not razorpay_secret:
                raise HTTPException(
                    status_code=503,
                    detail="Razorpay credentials not configured"
                )

            auth = (razorpay_key, razorpay_secret)
            callback_url = f"{settings.FRONTEND_URL}/credits/subscription-callback/razorpay"
            
            payload = {
                "type": "link",
                "amount": int(price * 100),
                "currency": "INR",
                "description": f"OneRouter {plan['name']} Subscription",
                "callback_url": callback_url,
                "customer_email": user_email if user_email else None,
                "notes": {
                    "onerouter_user_id": user_id,
                    "plan_id": request.plan_id,
                    "credits": str(plan["credits"])
                }
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.razorpay.com/v1/payment_links",
                    json=payload,
                    auth=auth,
                    timeout=30.0
                )

                if response.status_code != 200:
                    raise Exception(f"Razorpay API error: {response.text}")

                data = response.json()
                subscription_id = f"sub_{user_id[:8]}_{uuid4().hex[:8]}"
                checkout_url = data.get("short_url")

                # Log full response so we can see every key
                logger.info(f"Razorpay direct API FULL response: {data}")

                # Try all known key names for the payment link ID
                provider_order_id = (
                    data.get("id")
                    or data.get("payment_link_id")
                    or data.get("razorpay_payment_link_id")
                    or data.get("link_id")
                )
                # Scan for any plink_ value if still not found
                if not provider_order_id:
                    for k, v in data.items():
                        if isinstance(v, str) and v.startswith("plink_"):
                            provider_order_id = v
                            logger.info(f"Found plink_ value under key '{k}': {v}")
                            break

                logger.info(
                    f"Razorpay subscription created (direct API): "
                    f"subscription_id={subscription_id}, "
                    f"payment_link_id={provider_order_id}, "
                    f"checkout_url={checkout_url}"
                )

        except Exception as e:
            logger.error(f"Razorpay subscription error: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Razorpay payment error: {str(e)}"
            )

    # Dodo Payments: Direct integration
    elif provider_name == "dodo":
        try:
            from ..adapters.dodo import DodoAdapter

            # Determine which subscription product ID to use based on plan
            product_id_map = {
                "sub_pro": settings.DODO_SUBSCRIPTION_ID1,
                "sub_team": settings.DODO_SUBSCRIPTION_ID2,
                "sub_enterprise": settings.DODO_SUBSCRIPTION_ID3
            }
            
            subscription_product_id = product_id_map.get(request.plan_id, settings.DODO_PRODUCT_ID)
            
            logger.info(f"Using Dodo product ID for {request.plan_id}: {subscription_product_id[:10]}...")
            
            if not subscription_product_id:
                raise Exception(f"No Dodo product ID configured for plan {request.plan_id}")

            dodo = DodoAdapter({
                "DODO_API_KEY": settings.DODO_API_KEY,
                "DODO_MODE": settings.DODO_MODE,
                "DODO_PRODUCT_ID": subscription_product_id
            })

            checkout_data = await dodo.create_payment_link(
                amount=price,
                description=f"OneRouter {plan['name']} Subscription - {plan['credits']} credits/month",
                callback_url=f"{settings.FRONTEND_URL}/credits/subscription-callback/dodo",
                notes={
                    "customer_email": user_email,
                    "customer_name": user_email.split("@")[0] if user_email else "Customer",
                    "plan_id": request.plan_id,
                    "plan_name": plan["name"],
                    "credits": str(plan["credits"]),
                    "type": "subscription",
                    "onerouter_user_id": user_id
                }
            )

            subscription_id = checkout_data.get("provider_order_id") or f"sub_{user_id[:8]}_{uuid4().hex[:8]}"
            provider_order_id = checkout_data.get("provider_order_id")  # Dodo order ID
            checkout_url = checkout_data.get("checkout_url")

            if not checkout_url:
                raise Exception("No checkout URL returned from Dodo")

            logger.info(f"Dodo subscription created: subscription_id={subscription_id}")

        except ImportError:
            logger.error("Dodo adapter not available")
            raise HTTPException(
                status_code=503,
                detail="Dodo payment provider not available"
            )
        except Exception as e:
            logger.error(f"Dodo subscription error: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Dodo payment error: {str(e)}"
            )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported payment provider: {request.provider}"
        )

    if not checkout_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to create subscription checkout"
        )

    logger.info(f"About to create subscription: provider={provider_name}, provider_order_id={provider_order_id}, subscription_id={subscription_id}")

    subscription = Subscription(
        user_id=user_id,
        plan_id=request.plan_id,
        plan_name=plan["name"],
        provider=provider_name,
        provider_subscription_id=subscription_id,
        provider_order_id=provider_order_id,
        credits_per_month=plan["credits"],
        price=price,
        currency=request.currency.upper(),
        status="pending",
        current_period_start=None,
        current_period_end=None
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)

    logger.info(f"Subscription created in DB: id={subscription.id}, provider_order_id={subscription.provider_order_id}, provider={provider_name}")

    return SubscriptionPurchaseResponse(
        subscription_id=str(subscription.id),
        checkout_url=checkout_url,
        plan_id=request.plan_id,
        plan_name=plan["name"],
        credits_per_month=plan["credits"],
        price=price,
        currency=request.currency.upper(),
        provider=provider_name
    )


@router.get("/my-subscriptions")
async def get_my_subscriptions(
    user=Depends(get_api_or_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's active subscriptions"""
    user_id = str(user.get("id"))

    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
    )
    subscriptions = result.scalars().all()

    return {
        "subscriptions": [
            {
                "id": str(sub.id),
                "plan_id": sub.plan_id,
                "plan_name": sub.plan_name,
                "provider": sub.provider,
                "credits_per_month": sub.credits_per_month,
                "price": float(sub.price) if sub.price else 0,
                "currency": sub.currency,
                "status": sub.status,
                "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
                "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
                "created_at": sub.created_at.isoformat(),
                "cancelled_at": sub.cancelled_at.isoformat() if sub.cancelled_at else None
            }
            for sub in subscriptions
        ]
    }


@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    request: SubscriptionCancelRequest,
    user=Depends(get_api_or_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a subscription.
    """
    user_id = str(user.get("id"))

    result = await db.execute(
        select(Subscription)
        .where(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id
        )
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    if subscription.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Subscription is already cancelled"
        )

    if request.cancel_at_period_end:
        subscription.status = "cancelled"
        subscription.cancel_at_period_end = 1
        subscription.cancelled_at = datetime.utcnow()
    else:
        subscription.status = "cancelled"
        subscription.cancelled_at = datetime.utcnow()
        subscription.ended_at = datetime.utcnow()

    await db.commit()

    return {
        "success": True,
        "message": "Subscription cancelled",
        "cancel_at_period_end": request.cancel_at_period_end
    }