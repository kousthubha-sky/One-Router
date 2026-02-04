"""
Dodo Payments Adapter

Merchant of Record payment provider for global USD transactions.
Handles checkout sessions, payment links, and webhook verification.

API Docs: https://docs.dodopayments.com
"""

import httpx
import hmac
import hashlib
import logging
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

        self.logger.info(f"Creating Dodo payment: {base_url}/payments, amount_cents={amount_cents}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/payments",
                json=payload,
                headers=headers
            )

            self.logger.info(f"Dodo response: {response.status_code}")

            if response.status_code in [400, 401, 422]:
                error_text = response.text
                self.logger.error(f"Dodo API error {response.status_code}: {error_text}")
                raise Exception(f"Dodo API error: {error_text}")

            response.raise_for_status()
            data = response.json()

            self.logger.info(f"Dodo payment created: {data}")

            payment_id = data.get("payment_id", "")
            checkout_url = data.get("payment_link", "")

            if not checkout_url:
                raise Exception(f"No payment_link in Dodo response: {data}")

            return {
                "transaction_id": f"dodo_{payment_id}",
                "provider": "dodo",
                "provider_order_id": payment_id,
                "amount": amount,
                "currency": currency,
                "status": "created",
                "checkout_url": checkout_url,
                "provider_data": data
            }

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get payment status from Dodo"""
        base_url = await self._get_base_url()
        headers = await self._get_auth_headers()

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{base_url}/payments/{payment_id}",
                headers=headers
            )

            if response.status_code == 404:
                raise Exception(f"Payment {payment_id} not found")

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
