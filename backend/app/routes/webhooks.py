# backend/app/routes/webhooks.py
"""
Webhook forwarding system
Receives webhooks from payment gateways → forwards to developer's webhook URL
"""

from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
import httpx
import hashlib
import hmac
import json
import os
import logging
from typing import Optional
from ..database import get_db
from ..models import WebhookEvent, User, ServiceCredential
from ..services.request_router import RequestRouter
from ..auth.dependencies import get_current_user

router = APIRouter()
request_router = RequestRouter()
logger = logging.getLogger(__name__)


async def forward_webhook_to_developer(
    user_webhook_url: str,
    event_data: dict,
    original_signature: str,
    service_name: str
):
    """Forward webhook to developer's URL in background"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                user_webhook_url,
                json={
                    "service": service_name,
                    "event": event_data,
                    "original_signature": original_signature,
                    "forwarded_by": "onerouter"
                },
                headers={
                    "Content-Type": "application/json",
                    "X-OneRouter-Signature": original_signature,
                    "X-OneRouter-Service": service_name
                }
            )
            print(f"✓ Forwarded webhook to {user_webhook_url}: {response.status_code}")
            return response.status_code
    except Exception as e:
        print(f"✗ Failed to forward webhook: {e}")
        return None


@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Receive Razorpay webhook → verify signature → forward to developer
    
    Flow:
    1. Razorpay sends webhook to: https://api.onerouter.com/webhooks/razorpay
    2. We verify the signature with user's webhook secret
    3. We forward the event to developer's webhook URL
    4. We log the event in our database
    """
    
    # Get raw body and signature
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")
    
    # Parse webhook event
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # Extract user identifier from webhook payload
    # Razorpay sends notes in payload - we can add user_id there during order creation
    user_id = None
    
    # Try to get user_id from event payload
    if event.get("payload"):
        entity = event["payload"].get("payment", {}).get("entity") or \
                 event["payload"].get("order", {}).get("entity") or \
                 event["payload"].get("subscription", {}).get("entity")
        
        if entity and entity.get("notes"):
            user_id = entity["notes"].get("onerouter_user_id")
    
    if not user_id:
        # Fallback: try to match by order_id/payment_id in our transaction logs
        # This requires querying transaction_logs table
        raise HTTPException(
            status_code=400, 
            detail="Cannot identify user. Add 'onerouter_user_id' in notes when creating orders."
        )
    
    # Get user's Razorpay credentials to verify signature
    result = await db.execute(
        select(ServiceCredential).where(
            ServiceCredential.user_id == user_id,
            ServiceCredential.provider_name == "razorpay",
            ServiceCredential.is_active == True
        )
    )
    credential = result.scalar_one_or_none()
    
    if not credential:
        raise HTTPException(status_code=400, detail="Invalid webhook request")
    
    # Verify webhook signature
    from ..services.credential_manager import CredentialManager
    cred_manager = CredentialManager()
    creds = cred_manager.decrypt_credentials(str(credential.encrypted_credential))
    
    webhook_secret = creds.get("RAZORPAY_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(status_code=400, detail="Invalid webhook request")
    
    # Verify signature
    expected_signature = hmac.new(
        webhook_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook request")
    
    # Log webhook event
    webhook_event = WebhookEvent(
        user_id=user_id,
        service_name="razorpay",
        event_type=event.get("event"),
        payload=event,
        signature=signature,
        processed=False
    )
    db.add(webhook_event)
    await db.commit()

    # Get user's webhook URL from their settings
    # For now, we'll assume it's stored in user's metadata or config
    # You'll need to add a webhook_url field to User table or ServiceCredential
    
    # Example: Forward to user's webhook URL
    user_webhook_url = credential.features_config.get("webhook_url")
    
    if user_webhook_url:
        background_tasks.add_task(
            forward_webhook_to_developer,
            user_webhook_url,
            event,
            signature,
            "razorpay"
        )
    
    # Mark as processed
    webhook_event.processed = True
    await db.commit()
    
    return {"status": "received", "event_id": str(webhook_event.id)}


@router.post("/webhooks/paypal")
async def paypal_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Receive PayPal webhook → verify signature → forward to developer
    
    PayPal webhook verification is more complex - requires calling PayPal API
    """
    
    body = await request.body()
    headers = dict(request.headers)
    
    # PayPal signature headers
    transmission_id = headers.get("paypal-transmission-id")
    transmission_time = headers.get("paypal-transmission-time")
    cert_url = headers.get("paypal-cert-url")
    auth_algo = headers.get("paypal-auth-algo")
    transmission_sig = headers.get("paypal-transmission-sig")
    
    if not all([transmission_id, transmission_time, cert_url, transmission_sig]):
        raise HTTPException(status_code=400, detail="Missing PayPal webhook headers")
    
    # Parse event
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # Extract user_id from event
    # PayPal events include custom_id which we set during order creation
    user_id = event.get("resource", {}).get("custom_id")
    
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot identify user. Add 'custom_id' when creating PayPal orders."
        )
    
    # Get user's PayPal credentials
    result = await db.execute(
        select(ServiceCredential).where(
            ServiceCredential.user_id == user_id,
            ServiceCredential.provider_name == "paypal",
            ServiceCredential.is_active == True
        )
    )
    credential = result.scalar_one_or_none()
    
    if not credential:
        raise HTTPException(status_code=404, detail="User credentials not found")
    
    # Verify webhook using PayPal API
    from ..services.credential_manager import CredentialManager
    cred_manager = CredentialManager()
    creds = cred_manager.decrypt_credentials(str(credential.encrypted_credential))
    
    # Get webhook_id from credential config
    webhook_id = credential.features_config.get("paypal_webhook_id")
    
    if not webhook_id:
        raise HTTPException(status_code=400, detail="PayPal webhook ID not configured")
    
    # Call PayPal verify endpoint
    from ..adapters.paypal import PayPalAdapter
    adapter = PayPalAdapter(creds)
    
    # Verify webhook signature
    verify_flag = os.getenv("PAYPAL_WEBHOOK_VERIFY", "true").lower() == "true"
    environment = os.getenv("ENVIRONMENT", "development")
    # Only skip verification in non-production environments
    skip_verification = environment != "production"
    if not verify_flag:
        logger.warning("PAYPAL_WEBHOOK_VERIFY is disabled - this should not be used in production")
    
    if not skip_verification:
        raw_body_str = body.decode('utf-8')
        is_verified = await adapter.verify_webhook_signature(
            transmission_id=transmission_id or "",
            transmission_time=transmission_time or "",
            transmission_sig=transmission_sig or "",
            auth_algo=auth_algo or "",
            cert_url=cert_url or "",
            webhook_id=webhook_id,
            webhook_event=raw_body_str
        )
        if not is_verified:
            logger.warning(f"PayPal webhook signature verification failed for user {user_id}")
            raise HTTPException(status_code=401, detail="Webhook signature verification failed")
    else:
        logger.info(f"PayPal webhook verification skipped (verify_flag={verify_flag}, environment={environment})")    
    # Log webhook event
    webhook_event = WebhookEvent(
        user_id=user_id,
        service_name="paypal",
        event_type=event.get("event_type"),
        payload=event,
        signature=transmission_sig,
        processed=False
    )
    db.add(webhook_event)
    await db.commit()

    # Forward to user's webhook URL
    user_webhook_url = credential.features_config.get("webhook_url")

    if user_webhook_url:
        background_tasks.add_task(
            forward_webhook_to_developer,
            user_webhook_url,
            event,
            transmission_sig or "",
            "paypal"
        )

    # Mark as processed (update the object, not the column directly)
    await db.execute(
        "UPDATE webhook_events SET processed = true WHERE id = :id",
        {"id": webhook_event.id}
    )
    await db.commit()
    
    return {"status": "received", "event_id": str(webhook_event.id)}


# Add webhook configuration endpoint for users
@router.post("/api/webhooks/configure")
async def configure_webhook(
    service_name: str,
    webhook_url: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Allow users to configure their webhook URL
    
    POST /api/webhooks/configure
    {
        "service_name": "razorpay",
        "webhook_url": "https://myapp.com/webhooks/payments"
    }
    """
    
    # Update service credential with webhook URL
    result = await db.execute(
        select(ServiceCredential).where(
            ServiceCredential.user_id == user["id"],
            ServiceCredential.provider_name == service_name,
            ServiceCredential.is_active == True
        )
    )
    credential = result.scalar_one_or_none()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Service not configured")

    # Update features_config with webhook_url
    if not credential.features_config:
        credential.features_config = {}

    credential.features_config["webhook_url"] = webhook_url
    flag_modified(credential, "features_config")

    await db.commit()
    
    return {
        "status": "configured",
        "service": service_name,
        "webhook_url": webhook_url,
        "onerouter_webhook_url": f"https://api.onerouter.com/webhooks/{service_name}"
    }