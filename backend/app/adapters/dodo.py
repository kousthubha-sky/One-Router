"""
Dodo Payments Adapter

Merchant of Record payment provider for global USD transactions.
Handles checkout sessions, payment links, and webhook verification.

API Docs: https://docs.dodopayments.com
"""

import httpx
import hmac
import hashlib
import json
import logging
from uuid import uuid4
from typing import Dict, Any, Optional
from pybreaker import CircuitBreaker
from .base import BaseAdapter


class DodoAdapter(BaseAdapter):
    """Dodo Payments adapter for USD credit purchases"""

    logger = logging.getLogger(__name__)

    # Circuit breakers for external API calls
    _checkout_breaker = CircuitBreaker(fail_max=5, reset_timeout=60, listeners=[])

    def __init__(self, credentials: Dict[str, str]):
        super().__init__(credentials)

    async def _get_base_url(self) -> str:
        """Return Dodo API base URL based on mode"""
        mode = self.credentials.get("DODO_MODE", "test")
        if mode == "live":
            return "https://live.dodopayments.com"
        return "https://test.dodopayments.com"

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for Dodo API calls"""
        api_key = self.credentials.get("DODO_API_KEY", "")
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def validate_credentials(self) -> bool:
        """Validate Dodo API credentials by making a test request"""
        try:
            base_url = await self._get_base_url()
            headers = await self._get_auth_headers()

            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try to list payments to validate credentials
                response = await client.get(
                    f"{base_url}/payments",
                    headers=headers,
                    params={"limit": 1}
                )
                return response.status_code in [200, 401]  # 401 means invalid, anything else is an error
        except Exception as e:
            self.logger.error(f"Dodo credential validation failed: {e}")
            return False

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get payment/order details from Dodo"""
        return await self.get_payment_status(order_id)

    async def create_payment_link(
        self,
        amount: float,
        description: str,
        currency: str = "USD",
        callback_url: Optional[str] = None,
        notes: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a Dodo payment link using the pre-configured product.

        Args:
            amount: Payment amount in dollars (e.g., 10.00 for $10)
            description: Payment description
            currency: Currency code (default: USD)
            callback_url: URL to redirect after payment
            notes: Additional metadata

        Returns:
            Dict with checkout_url, provider_order_id, etc.
        """
        base_url = await self._get_base_url()
        headers = await self._get_auth_headers()
        product_id = self.credentials.get("DODO_PRODUCT_ID", "")

        if not product_id:
            raise Exception("DODO_PRODUCT_ID not configured")

        # Amount in cents for Dodo API (pay-what-you-want products)
        amount_cents = int(round(amount * 100))

        # Get customer info from notes
        customer_email = notes.get("customer_email") if notes else None
        customer_name = notes.get("customer_name") if notes else None

        # Build payment payload
        payload = {
            "payment_link": True,
            "product_cart": [
                {
                    "product_id": product_id,
                    "quantity": 1,
                    "amount": amount_cents
                }
            ],
            "customer": {
                "email": customer_email or "customer@example.com",
                "name": customer_name or (customer_email.split("@")[0] if customer_email else "Customer")
            },
            "billing": {
                "city": "NA",
                "country": "US",
                "state": "NA",
                "street": "NA",
                "zipcode": "00000"
            }
        }

        # Add return URL
        if callback_url:
            payload["return_url"] = callback_url

        # Add metadata (exclude customer fields)
        if notes:
            excluded_keys = {"customer_email", "customer_name"}
            metadata = {k: str(v) for k, v in notes.items() if k not in excluded_keys}
            if metadata:
                payload["metadata"] = metadata

        self.logger.info(f"Creating Dodo checkout: {base_url}/checkouts")
        self.logger.info(f"Dodo payload: {json.dumps(payload, indent=2)}")
        self.logger.info(f"Dodo product_id: {product_id}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/checkouts",
                json=payload,
                headers=headers
            )

            self.logger.info(f"Dodo response status: {response.status_code}")
            self.logger.info(f"Dodo response body: {response.text[:500]}")

            if response.status_code in [400, 401, 422]:
                error_text = response.text
                self.logger.error(f"Dodo API error {response.status_code}: {error_text}")
                raise Exception(f"Dodo API error: {error_text}")

            response.raise_for_status()
            data = response.json()

            self.logger.info(f"Dodo checkout created: {data}")

            session_id = data.get("session_id", "")
            checkout_url = data.get("checkout_url", "")

            if not checkout_url:
                raise Exception(f"No checkout_url in Dodo response: {data}")

            return {
                "transaction_id": f"dodo_{session_id}",
                "provider": "dodo",
                "provider_order_id": session_id,
                "amount": amount,
                "currency": currency,
                "status": "created",
                "checkout_url": checkout_url,
                "provider_data": data
            }

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get payment status from Dodo checkout session"""
        base_url = await self._get_base_url()
        headers = await self._get_auth_headers()

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{base_url}/checkouts/{payment_id}",
                headers=headers
            )

            if response.status_code == 404:
                raise Exception(f"Checkout session {payment_id} not found")

            response.raise_for_status()
            data = response.json()

        raw_status = data.get("status", "unknown").lower()
        status_map = {
            "succeeded": "success",
            "paid": "success",
            "completed": "success",
            "pending": "pending",
            "processing": "pending",
            "failed": "failed",
            "cancelled": "failed",
            "expired": "failed"
        }

        return {
            "payment_id": payment_id,
            "status": status_map.get(raw_status, raw_status),
            "raw_status": raw_status,
            "amount": data.get("total_amount"),
            "currency": data.get("currency", "USD"),
            "provider_data": data
        }

    def verify_webhook_signature(
        self,
        payload: bytes,
        webhook_id: str,
        webhook_signature: str,
        webhook_timestamp: str,
        webhook_secret: str
    ) -> bool:
        """Verify Dodo webhook signature using Standard Webhooks spec."""
        try:
            message = f"{webhook_id}.{webhook_timestamp}.{payload.decode('utf-8')}"
            expected_sig = hmac.new(
                webhook_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            if webhook_signature.startswith("v1,"):
                actual_sig = webhook_signature[3:]
            else:
                actual_sig = webhook_signature

            return hmac.compare_digest(expected_sig, actual_sig)
        except Exception as e:
            self.logger.error(f"Dodo webhook signature verification failed: {e}")
            return False

    async def create_subscription_checkout(
        self,
        plan_id: str,
        plan_name: str,
        amount: float,
        credits: int,
        user_id: str,
        user_email: str,
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a Dodo checkout session for subscription.

        Args:
            plan_id: OneRouter subscription plan ID
            plan_name: Display name for the plan
            amount: Payment amount in dollars
            credits: Credits to award per month
            user_id: OneRouter user ID
            user_email: Customer email
            callback_url: Redirect URL after payment

        Returns:
            Dict with subscription_id and checkout_url
        """
        base_url = await self._get_base_url()
        headers = await self._get_auth_headers()
        product_id = self.credentials.get("DODO_SUBSCRIPTION_PRODUCT_ID", "")

        if not product_id:
            raise Exception("DODO_SUBSCRIPTION_PRODUCT_ID not configured")

        amount_cents = int(round(amount * 100))

        payload = {
            "payment_link": True,
            "product_cart": [
                {
                    "product_id": product_id,
                    "quantity": 1,
                    "amount": amount_cents
                }
            ],
            "customer": {
                "email": user_email or "customer@example.com",
                "name": user_email.split("@")[0] if user_email else "Customer"
            },
            "billing": {
                "city": "NA",
                "country": "US",
                "state": "NA",
                "street": "NA",
                "zipcode": "00000"
            },
            "metadata": {
                "onerouter_user_id": user_id,
                "type": "subscription",
                "plan_id": plan_id,
                "plan_name": plan_name,
                "credits": str(credits),
                "interval": "monthly"
            }
        }

        if callback_url:
            payload["return_url"] = callback_url

        self.logger.info(f"Creating Dodo subscription checkout: {base_url}/checkouts")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/checkouts",
                json=payload,
                headers=headers
            )

            if response.status_code in [400, 401, 422]:
                error_text = response.text
                self.logger.error(f"Dodo subscription error {response.status_code}: {error_text}")
                raise Exception(f"Dodo subscription error: {error_text}")

            response.raise_for_status()
            data = response.json()

            session_id = data.get("session_id", "")
            checkout_url = data.get("checkout_url", "")

            return {
                "subscription_id": f"sub_{user_id[:8]}_{session_id[:8]}" if session_id else f"sub_{user_id[:8]}_{uuid4().hex[:8]}",
                "provider": "dodo",
                "provider_order_id": session_id,
                "checkout_url": checkout_url,
                "amount": amount,
                "currency": "USD",
                "provider_data": data
            }

    async def cancel_subscription(
        self,
        subscription_id: str,
        cancel_at_period_end: bool = True
    ) -> Dict[str, Any]:
        """
        Cancel a Dodo subscription.

        Args:
            subscription_id: Dodo subscription ID
            cancel_at_period_end: Cancel at period end or immediately

        Returns:
            Dict with cancellation details
        """
        base_url = await self._get_base_url()
        headers = await self._get_auth_headers()

        self.logger.info(f"Cancelling Dodo subscription: {subscription_id}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/subscriptions/{subscription_id}/cancel",
                json={"cancel_at_period_end": cancel_at_period_end},
                headers=headers
            )

            if response.status_code in [400, 404]:
                self.logger.warning(f"Dodo cancellation warning: {response.text}")
                return {"status": "warning", "message": response.text}

            response.raise_for_status()
            return {"status": "cancelled", "subscription_id": subscription_id}

    async def get_subscription_status(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get Dodo subscription status.

        Args:
            subscription_id: Dodo subscription ID

        Returns:
            Dict with subscription details
        """
        base_url = await self._get_base_url()
        headers = await self._get_auth_headers()

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{base_url}/subscriptions/{subscription_id}",
                headers=headers
            )

            if response.status_code == 404:
                raise Exception(f"Subscription {subscription_id} not found")

            response.raise_for_status()
            return response.json()
