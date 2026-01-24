"""
Razorpay Payment Service for OneRouter
Handles payment processing for credit purchases.
"""

import logging
import httpx
import hashlib
import hmac

logger = logging.getLogger(__name__)
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional

from uuid import uuid4

from ..config import settings


class RazorpayService:
    """Service for Razorpay payment integration"""

    def __init__(self):
        self.base_url = "https://api.razorpay.com/v1"
        self.key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
        self.key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        self.headers = {
            "Content-Type": "application/json",
        }
        if self.key_id and self.key_secret:
            self.headers["Authorization"] = f"Basic {self._get_basic_auth()}"

    def _get_basic_auth(self) -> str:
        """Generate Basic auth header for Razorpay"""
        import base64
        credentials = f"{self.key_id}:{self.key_secret}"
        return base64.b64encode(credentials.encode()).decode()

    def is_configured(self) -> bool:
        """Check if Razorpay is properly configured"""
        return bool(
            self.key_id and 
            self.key_secret and 
            ("test" in self.key_id.lower() or "live" in self.key_id.lower())
        )

    async def create_order(
        self,
        amount: int,  # Amount in paise (100 = 1 INR)
        currency: str = "INR",
        notes: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a Razorpay order for credit purchase.

        Args:
            amount: Amount in paise (e.g., 10000 for ₹100)
            currency: Currency code (default: INR)
            notes: Optional metadata notes

        Returns:
            Razorpay order response with order_id and checkout_url
        """
        if not self.is_configured():
            # Return mock response for demo mode
            order_id = f"order_{uuid4().hex[:16]}"
            return {
                "id": order_id,
                "entity": "order",
                "amount": amount,
                "currency": currency,
                "status": "created",
                "checkout_url": f"https://checkout.razorpay.com/pl/{order_id}/pay",
                "notes": notes or {}
            }

        payload = {
            "amount": amount,
            "currency": currency,
            "payment_capture": 1,  # Auto-capture payment
            "notes": {
                "service": "onerouter_credits",
                **(notes or {})
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/orders",
                json=payload,
                headers=self.headers,
                timeout=30.0
            )

            if response.status_code != 200:
                raise Exception(f"Razorpay order creation failed: {response.text}")

            return response.json()

    async def verify_payment(self, payment_id: str, order_id: str) -> Dict[str, Any]:
        """
        Verify a Razorpay payment.

        Args:
            payment_id: Razorpay payment ID
            order_id: Razorpay order ID

        Returns:
            Payment details if verified
            
        Raises:
            Exception: If payment_id is not provided or order_id does not match
        """
        
        if not self.is_configured():
            # Return mock verification for demo
            mock_payment_id = payment_id or f"pay_{uuid4().hex[:16]}"
            return {
                "id": mock_payment_id,
                "entity": "payment",
                "order_id": order_id,
                "status": "captured",
                "amount": 10000,  # Default amount
                "currency": "INR"
            }

        if not payment_id:
           # Fallback: look up payments for this order
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/orders/{order_id}/payments",
                    headers=self.headers,
                    timeout=30.0
                )
                if response.status_code != 200:
                    raise Exception(f"Payment lookup failed: {response.text}")
                payments = response.json().get("items", [])
                if not payments:
                    raise ValueError(f"No payments found for order {order_id}")
                payment = next((p for p in payments if p.get("status") == "captured"), payments[0])
                return payment
        

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=self.headers,
                timeout=30.0
            )

            if response.status_code != 200:
                raise Exception(f"Payment verification failed: {response.text}")

            payment = response.json()
            
            # Validate that the payment's order_id matches the expected order_id
            if payment.get("order_id") != order_id:
                raise ValueError(
                    f"Order ID mismatch: expected {order_id}, got {payment.get('order_id')}"
                )

            return payment

    def verify_webhook_signature(
        self,
        payload: str,
        signature: str,
        secret: str
    ) -> bool:
        """
        Verify Razorpay webhook signature.

        Args:
            payload: Raw request body
            signature: Razorpay-Signature header
            secret: Webhook secret

        Returns:
            True if signature is valid
        """
        if not secret:
            return False

        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)

    def verify_payment_link_signature(
        self,
        payment_id: str,
        payment_link_id: str,
        signature: str
    ) -> bool:
        """
        Verify Razorpay payment link callback signature.

        For payment link callbacks, Razorpay provides a signature that can be
        verified using HMAC-SHA256 with the account's key secret.

        Args:
            payment_id: Razorpay payment ID from callback
            payment_link_id: Razorpay payment link ID from callback
            signature: Razorpay-Signature header value

        Returns:
            True if signature is valid, False otherwise
        """
        if not payment_id or not payment_link_id or not signature:
            return False

        if not self.key_secret:
            logger.warning("Razorpay key secret not configured, skipping signature verification")
            return False

        payload = f"{payment_id}|{payment_link_id}"
        expected_signature = hmac.new(
            self.key_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)

    @classmethod
    def get_checkout_options(
        cls,
        order_id: str,
        amount: int,
        currency: str = "INR",
        name: str = "OneRouter Credits",
        description: str = "Purchase API credits",
        user_email: Optional[str] = None,
        user_phone: Optional[str] = None,
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get Razorpay checkout options for frontend integration.

        Args:
            order_id: Razorpay order ID
            amount: Amount in paise
            currency: Currency code
            name: Product name
            description: Product description
            user_email: Customer email
            user_phone: Customer phone
            callback_url: Post-payment redirect URL

        Returns:
            Checkout options for Razorpay.js
        """
        # Use settings directly instead of creating an instance
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
        if not key_id:
            raise ValueError("Razorpay key ID is not configured")
        
        options = {
            "key": key_id,
            "order_id": order_id,
            "name": name,
            "description": description,
            "amount": amount,
            "currency": currency,
            "prefill": {
                "method": "upi"  # Default to UPI for India
            },
            "theme": {
                "color": "#00d4ff"
            },
            "config": {
                "display": {
                    "blocks": {
                        "upi": {
                            "name": "Pay via UPI",
                            "instruments": [
                                {
                                    "method": "upi"
                                }
                            ]
                        },
                        "card": {
                            "name": "Cards",
                            "instruments": [
                                {
                                    "method": "card",
                                    "types": ["debit", "credit"]
                                }
                            ]
                        },
                        "netbanking": {
                            "name": "Net Banking",
                            "instruments": [
                                {
                                    "method": "netbanking"
                                }
                            ]
                        }
                    }
                }
            }
        }

        if user_email:
            options["prefill"]["email"] = user_email
        if user_phone:
            options["prefill"]["contact"] = user_phone
            options["prefill"]["method"] = "card"  # Cards if phone provided
        if callback_url:
            options["callback_url"] = callback_url

        return options


class CreditPricingService:
    """Service for credit pricing plans"""

    # Credit packages in INR
    PRICING_PLANS = [
        {
            "id": "starter",
            "name": "Starter",
            "credits": 1000,
            "price_inr": 100,  # ₹100
            "price_usd": 1.20,
            "per_credit": 0.10,  # ₹0.10 per credit
            "description": "Perfect for testing and small projects"
        },
        {
            "id": "pro",
            "name": "Pro",
            "credits": 10000,
            "price_inr": 800,  # ₹800 (20% off)
            "price_usd": 9.60,
            "per_credit": 0.08,  # ₹0.08 per credit
            "description": "Best for growing applications"
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "credits": 100000,
            "price_inr": 7000,  # ₹7000 (30% off)
            "price_usd": 84.00,
            "per_credit": 0.07,  # ₹0.07 per credit
            "description": "High-volume usage"
        }
    ]

    FREE_TIER = {
        "credits": 1000,
        "description": "Free tier - 1000 credits/month"
    }

    @classmethod
    def get_plans(cls, currency: str = "INR") -> list:
        """Get available credit plans"""
        return cls.PRICING_PLANS

    @classmethod
    def get_plan(cls, plan_id: str) -> Optional[Dict]:
        """Get specific plan details"""
        for plan in cls.PRICING_PLANS:
            if plan["id"] == plan_id:
                return plan
        return None

    @classmethod
    def calculate_amount(cls, credits: int, currency: str = "INR") -> float:
        """Calculate price for custom credit amount"""
        if credits >= 100000:
            return credits * 0.07  # Enterprise rate
        elif credits >= 10000:
            return credits * 0.08  # Pro rate
        elif credits >= 1000:
            return credits * 0.10  # Starter rate
        else:
            return credits * 0.15  # Standard rate

    @classmethod
    def credits_to_paise(cls, price_inr: float) -> int:
        """
        Convert INR to paise (100 paise = 1 INR) with safe decimal precision.
        
        Uses Decimal arithmetic to avoid floating-point precision errors.
        For example, 7.00 reliably becomes 700 paise.
        
        Args:
            price_inr: Price in Indian Rupees (float)
            
        Returns:
            Amount in paise as integer
        """
        # Convert to Decimal for safe financial math
        price_decimal = Decimal(str(price_inr))
        
        # Multiply by 100 paise per rupee
        paise_decimal = price_decimal * Decimal('100')
        
        # Quantize to nearest whole paise using ROUND_HALF_UP
        paise_rounded = paise_decimal.quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        
        # Convert to int
        return int(paise_rounded)
