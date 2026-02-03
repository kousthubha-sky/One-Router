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
    _payment_breaker = CircuitBreaker(fail_max=5, reset_timeout=60, listeners=[])
    _webhook_breaker = CircuitBreaker(fail_max=5, reset_timeout=60, listeners=[])

    def __init__(self, credentials: Dict[str, str]):
        super().__init__(credentials)

    async def _get_base_url(self) -> str:
        """Return Dodo API base URL based on mode"""
        mode = self.credentials.get("DODO_MODE", "test")
        if mode == "live":
            return "https://api.dodopayments.com"
        else:
            return "https://test.dodopayments.com"

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for Dodo API calls"""
        api_key = self.credentials.get("DODO_API_KEY", "")
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def validate_credentials(self) -> bool:
        """Validate Dodo credentials by making a test API call"""
        try:
            base_url = await self._get_base_url()
            headers = await self._get_auth_headers()

            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try to list products as a validation check
                response = await client.get(
                    f"{base_url}/products",
                    headers=headers,
                    params={"page_size": 1}
                )
                return response.status_code in [200, 404]  # 404 = no products yet, but auth worked
        except Exception as e:
            self.logger.error(f"Dodo credential validation failed: {e}")
            return False

    async def create_checkout_session(
        self,
        amount: float,
        currency: str = "USD",
        product_name: str = "OneRouter Credits",
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        return_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a Dodo checkout session.

        This is the recommended integration method - creates a session
        and redirects customer to hosted checkout.

        Args:
            amount: Payment amount in USD
            currency: Currency code (default: USD)
            product_name: Name shown at checkout
            customer_email: Customer email for prefill
            customer_name: Customer name for prefill
            return_url: URL to redirect after payment
            metadata: Additional data to attach

        Returns:
            Dict with checkout_url, session_id, etc.
        """
        try:
            return await self._checkout_breaker.call(
                self._create_checkout_session_impl,
                amount, currency, product_name, customer_email,
                customer_name, return_url, metadata
            )
        except Exception as e:
            self.logger.error(f"Failed to create Dodo checkout session: {e}")
            raise

    async def _create_checkout_session_impl(
        self,
        amount: float,
        currency: str,
        product_name: str,
        customer_email: Optional[str],
        customer_name: Optional[str],
        return_url: Optional[str],
        metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Implementation of checkout session creation"""
        try:
            base_url = await self._get_base_url()
            headers = await self._get_auth_headers()

            # Build checkout session payload
            # Dodo uses product_cart for items
            payload = {
                "payment_link": True,
                "billing": {
                    "city": "Global",
                    "country": "US",
                    "state": "CA",
                    "street": "Online",
                    "zipcode": "00000"
                },
                "product_cart": [
                    {
                        "product_id": "onerouter_credits",  # Virtual product
                        "quantity": 1
                    }
                ]
            }

            # Add customer info if provided
            if customer_email or customer_name:
                payload["customer"] = {}
                if customer_email:
                    payload["customer"]["email"] = customer_email
                if customer_name:
                    payload["customer"]["name"] = customer_name

            # Add return URL
            if return_url:
                payload["return_url"] = return_url

            # Add metadata
            if metadata:
                for key, value in metadata.items():
                    payload[f"metadata_{key}"] = str(value)

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/payments",
                    json=payload,
                    headers=headers
                )

                if response.status_code == 400:
                    error_data = response.json()
                    raise Exception(f"Dodo bad request: {error_data}")
                elif response.status_code == 401:
                    raise Exception("Invalid Dodo API credentials")
                elif response.status_code == 422:
                    error_data = response.json()
                    raise Exception(f"Dodo validation error: {error_data}")

                response.raise_for_status()
                data = response.json()

                # Extract checkout URL and payment ID
                payment_id = data.get("payment_id", "")
                payment_link = data.get("payment_link", "")

                return {
                    "transaction_id": f"dodo_{payment_id}",
                    "provider": "dodo",
                    "provider_order_id": payment_id,
                    "amount": amount,
                    "currency": currency,
                    "status": "created",
                    "checkout_url": payment_link,
                    "provider_data": data
                }

        except httpx.TimeoutException:
            raise Exception("Dodo API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Dodo API network error: {str(e)}")

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
        Create a Dodo payment link.

        This provides a consistent interface with Razorpay/PayPal adapters.

        Args:
            amount: Payment amount
            description: Payment description
            currency: Currency code (default: USD)
            callback_url: URL to redirect after payment
            notes: Additional metadata

        Returns:
            Dict with checkout_url, provider_order_id, etc.
        """
        customer_email = None
        customer_name = None

        if notes:
            customer_email = notes.get("customer_email")
            customer_name = notes.get("customer_name")

        result = await self.create_checkout_session(
            amount=amount,
            currency=currency,
            product_name=description,
            customer_email=customer_email,
            customer_name=customer_name,
            return_url=callback_url,
            metadata=notes
        )

        result["description"] = description
        result["notes"] = notes

        return result

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get payment/order details from Dodo"""
        try:
            base_url = await self._get_base_url()
            headers = await self._get_auth_headers()

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{base_url}/payments/{order_id}",
                    headers=headers
                )

                if response.status_code == 404:
                    raise Exception(f"Payment {order_id} not found")
                elif response.status_code == 401:
                    raise Exception("Invalid Dodo API credentials")

                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            raise Exception(f"Dodo API error: {str(e)}")

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get payment status from Dodo"""
        data = await self.get_order(payment_id)

        # Normalize status
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
        """
        Verify Dodo webhook signature using Standard Webhooks spec.

        Args:
            payload: Raw request body bytes
            webhook_id: webhook-id header
            webhook_signature: webhook-signature header
            webhook_timestamp: webhook-timestamp header
            webhook_secret: Webhook secret from Dodo dashboard

        Returns:
            True if signature is valid
        """
        try:
            # Standard Webhooks signature format: v1,<base64_signature>
            # Message format: "{webhook_id}.{webhook_timestamp}.{payload}"
            message = f"{webhook_id}.{webhook_timestamp}.{payload.decode('utf-8')}"

            # Compute expected signature
            expected_sig = hmac.new(
                webhook_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            # Extract signature from header (may have version prefix)
            if webhook_signature.startswith("v1,"):
                actual_sig = webhook_signature[3:]
            else:
                actual_sig = webhook_signature

            # Constant-time comparison
            return hmac.compare_digest(expected_sig, actual_sig)

        except Exception as e:
            self.logger.error(f"Dodo webhook signature verification failed: {e}")
            return False

    async def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Dodo response to unified format"""
        payment_id = response.get("payment_id", "")
        status = response.get("status", "unknown").lower()

        # Map Dodo status to unified status
        status_map = {
            "succeeded": "success",
            "paid": "success",
            "completed": "success",
            "pending": "pending",
            "processing": "pending",
            "failed": "failed",
            "cancelled": "failed"
        }

        return {
            "transaction_id": f"dodo_{payment_id}" if payment_id else None,
            "provider": "dodo",
            "provider_order_id": payment_id,
            "amount": response.get("total_amount", 0),
            "currency": response.get("currency", "USD"),
            "status": status_map.get(status, status),
            "checkout_url": response.get("payment_link"),
            "provider_data": response
        }
