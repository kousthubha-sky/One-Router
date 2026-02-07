"""
Sandbox API routes - unauthenticated mock endpoints for demo purposes.

Returns realistic mock responses so anyone can try OneRouter
without signing up or configuring providers.
"""

import asyncio
import logging
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory rate limiter per IP
_rate_limit_store: Dict[str, list] = {}
RATE_LIMIT_MAX = 10  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds


def _check_rate_limit(ip: str):
    """Check and enforce rate limit per IP."""
    now = time.time()
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []

    # Clean old entries
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if now - t < RATE_LIMIT_WINDOW]

    if len(_rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Sandbox rate limit exceeded. Max 10 requests per minute."
        )
    _rate_limit_store[ip].append(now)


# ========================================
# REQUEST MODELS
# ========================================

class SandboxPaymentRequest(BaseModel):
    amount: float = Field(default=1000, gt=0, description="Payment amount")
    currency: str = Field(default="INR", pattern=r"^[A-Z]{3}$")
    provider: Optional[str] = Field(default="razorpay")
    method: Optional[str] = None
    receipt: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None


class SandboxSMSRequest(BaseModel):
    to: str = Field(default="+15005550001", description="Recipient phone number")
    body: str = Field(default="Hello from OneRouter sandbox!", min_length=1, max_length=1600)
    from_number: Optional[str] = None
    provider: Optional[str] = Field(default="twilio")


class SandboxEmailRequest(BaseModel):
    to: str = Field(default="test@example.com", description="Recipient email")
    subject: str = Field(default="Test from OneRouter Sandbox", min_length=1)
    html_body: Optional[str] = Field(default="<h1>Hello!</h1><p>This is a test email from OneRouter sandbox.</p>")
    text_body: Optional[str] = None
    from_email: Optional[str] = None
    provider: Optional[str] = Field(default="resend")


# ========================================
# SANDBOX ENDPOINTS
# ========================================

@router.post("/payments")
async def sandbox_create_payment(request: SandboxPaymentRequest, raw_request: Request):
    """
    Sandbox: Create a mock payment order.
    No authentication required. Returns a realistic mock response.
    """
    _check_rate_limit(raw_request.client.host if raw_request.client else "unknown")

    # Simulate realistic latency
    await asyncio.sleep(random.uniform(0.02, 0.05))

    start_time = time.time()
    order_id = f"sandbox_order_{uuid.uuid4().hex[:16]}"
    txn_id = f"sandbox_txn_{uuid.uuid4().hex[:16]}"
    provider = request.provider or "razorpay"

    # Build provider-specific mock response
    now = datetime.now(timezone.utc)
    response_time_ms = int((time.time() - start_time) * 1000) + random.randint(18, 45)

    return {
        "sandbox": True,
        "transaction_id": txn_id,
        "provider": provider,
        "provider_order_id": order_id,
        "amount": request.amount,
        "currency": request.currency,
        "status": "created",
        "receipt": request.receipt or f"rcpt_{uuid.uuid4().hex[:8]}",
        "created_at": int(now.timestamp() * 1000),
        "credits_deducted": False,
        "response_time_ms": response_time_ms,
        "checkout_url": f"https://sandbox.onerouter.dev/pay/{order_id}",
        "_sandbox_note": "This is a sandbox response. No real payment was created. Sign up to use real providers."
    }


@router.post("/sms")
async def sandbox_send_sms(request: SandboxSMSRequest, raw_request: Request):
    """
    Sandbox: Send a mock SMS.
    No authentication required. Returns a realistic mock response.
    """
    _check_rate_limit(raw_request.client.host if raw_request.client else "unknown")

    await asyncio.sleep(random.uniform(0.02, 0.05))

    start_time = time.time()
    message_id = f"sandbox_SM{uuid.uuid4().hex[:32]}"
    provider = request.provider or "twilio"
    response_time_ms = int((time.time() - start_time) * 1000) + random.randint(25, 55)

    return {
        "sandbox": True,
        "message_id": message_id,
        "status": "sent",
        "service": provider,
        "to": request.to,
        "body_length": len(request.body),
        "cost": 0.0079,
        "currency": "USD",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "credits_deducted": False,
        "response_time_ms": response_time_ms,
        "_sandbox_note": "This is a sandbox response. No real SMS was sent. Sign up to use real providers."
    }


@router.post("/email")
async def sandbox_send_email(request: SandboxEmailRequest, raw_request: Request):
    """
    Sandbox: Send a mock email.
    No authentication required. Returns a realistic mock response.
    """
    _check_rate_limit(raw_request.client.host if raw_request.client else "unknown")

    await asyncio.sleep(random.uniform(0.02, 0.05))

    start_time = time.time()
    email_id = f"sandbox_{uuid.uuid4().hex[:24]}"
    provider = request.provider or "resend"
    response_time_ms = int((time.time() - start_time) * 1000) + random.randint(15, 35)

    return {
        "sandbox": True,
        "email_id": email_id,
        "status": "sent",
        "service": provider,
        "to": request.to,
        "subject": request.subject,
        "cost": 0.0001,
        "currency": "USD",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "credits_deducted": False,
        "response_time_ms": response_time_ms,
        "_sandbox_note": "This is a sandbox response. No real email was sent. Sign up to use real providers."
    }


@router.get("/services")
async def sandbox_list_services(raw_request: Request):
    """
    Sandbox: List available services and their status.
    """
    _check_rate_limit(raw_request.client.host if raw_request.client else "unknown")

    return {
        "sandbox": True,
        "services": [
            {
                "name": "razorpay",
                "category": "payments",
                "status": "operational",
                "latency_ms": random.randint(18, 35),
                "features": ["orders", "refunds", "subscriptions", "payment_links"]
            },
            {
                "name": "paypal",
                "category": "payments",
                "status": "operational",
                "latency_ms": random.randint(35, 60),
                "features": ["orders", "refunds", "subscriptions"]
            },
            {
                "name": "twilio",
                "category": "communications",
                "subcategory": "sms",
                "status": "operational",
                "latency_ms": random.randint(25, 45),
                "features": ["send_sms", "delivery_status"]
            },
            {
                "name": "resend",
                "category": "communications",
                "subcategory": "email",
                "status": "operational",
                "latency_ms": random.randint(12, 25),
                "features": ["send_email", "delivery_status"]
            }
        ]
    }
