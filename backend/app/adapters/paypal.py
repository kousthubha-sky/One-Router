import httpx
import json
import logging
import time
from typing import Dict, Any, Optional
from .base import BaseAdapter

class PayPalAdapter(BaseAdapter):
    """PayPal payment service adapter"""

    logger = logging.getLogger(__name__)

    def __init__(self, credentials: Dict[str, str]):
        super().__init__(credentials)
        self.access_token = None
        self.token_expires = None

    async def _get_base_url(self) -> str:
        """Return PayPal API base URL"""
        mode = self.credentials.get("PAYPAL_MODE", "sandbox")
        if mode == "live":
            return "https://api.paypal.com/v1"
        else:
            return "https://api-m.sandbox.paypal.com/v1"

    async def _get_access_token(self) -> str:
        """Get OAuth access token from PayPal"""
        # Check if token is still valid (with 5 min buffer)
        if self.access_token and self.token_expires and time.time() < (self.token_expires - 300):
            return self.access_token

        base_url = await self._get_base_url()
        token_url = base_url.replace("/v1", "/v1/oauth2/token")

        # Basic auth with client credentials
        auth = (
            self.credentials["PAYPAL_CLIENT_ID"],
            self.credentials["PAYPAL_CLIENT_SECRET"]
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                token_url,
                data={"grant_type": "client_credentials"},
                auth=auth,
                headers={"Accept": "application/json"}
            )

            if response.status_code != 200:
                error_msg = f"PayPal auth failed: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('error_description', response.text)}"
                except json.JSONDecodeError:
                    error_msg += f" - {response.text or 'No response text'}"
                raise Exception(error_msg)
            data = response.json()
            self.access_token = data["access_token"]
            self.token_expires = time.time() + data["expires_in"]

            return self.access_token

    async def validate_credentials(self) -> bool:
        """Validate PayPal credentials by getting access token"""
        try:
            await self._get_access_token()
            return True
        except Exception as e:
            self.logger.error("PayPal credential validation failed")
            return False

    async def create_order(self, amount: float, currency: str = "INR", **kwargs) -> Dict[str, Any]:
        """Create a PayPal order"""
        try:
            # Extract optional parameters
            return_url = kwargs.get("return_url")
            cancel_url = kwargs.get("cancel_url")

            base_url = await self._get_base_url()
            access_token = await self._get_access_token()

            # PayPal order structure (v2 API)
            # Try the exact format from PayPal documentation
            order_data = {
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": "USD",
                        "value": "10.00"
                    }
                }],
                "application_context": {
                    "return_url": "https://example.com/return",
                    "cancel_url": "https://example.com/cancel"
                }
            }

            self.logger.debug("Order payload created")

            # Add application context if URLs provided
            if return_url or cancel_url:
                order_data["application_context"] = {
                    "return_url": return_url or "https://example.com/success",
                    "cancel_url": cancel_url or "https://example.com/cancel",
                    "user_action": "PAY_NOW"
                }

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            # Try v1 API format
            v1_payment_data = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "transactions": [{
                    "amount": {
                        "total": f"{amount:.2f}",
                        "currency": currency
                    },
                    "description": "Test payment"
                }],
                "redirect_urls": {
                    "return_url": return_url or "https://example.com/return",
                    "cancel_url": cancel_url or "https://example.com/cancel"
                }
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/payments/payment",
                    json=v1_payment_data,
                    headers=headers
                )

                # Handle specific error codes
                if response.status_code == 400:
                    error_data = response.json()
                    self.logger.debug("PayPal 400 error occurred")
                    raise Exception(f"PayPal bad request: {error_data}")
                elif response.status_code == 401:
                    raise Exception("Invalid PayPal credentials")
                elif response.status_code == 422:
                    error_data = response.json()
                    error_desc = error_data.get("details", [{}])[0].get("description", "Validation error")
                    raise Exception(f"PayPal validation error: {error_desc}")
                elif response.status_code == 429:
                    raise Exception("PayPal rate limit exceeded")

                response.raise_for_status()
                order_response = response.json()

                # Extract checkout URL from links (v1 API uses 'approval_url')
                checkout_url = None
                for link in order_response.get("links", []):
                    if link.get("rel") in ["approve", "approval_url"]:
                        checkout_url = link["href"]
                        break

                # Safely extract id
                id_val = order_response.get('id')
                if id_val:
                    transaction_id = f"unf_{id_val}"
                    provider_order_id = id_val
                else:
                    transaction_id = None
                    provider_order_id = None

                # Return normalized response (matching Razorpay format)
                return {
                    "transaction_id": transaction_id,
                    "provider": "paypal",
                    "provider_order_id": provider_order_id,
                    "amount": amount,
                    "currency": currency,
                    "status": "created",
                    "checkout_url": checkout_url,
                    "provider_data": order_response
                }

        except httpx.TimeoutException:
            raise Exception("PayPal API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"PayPal API network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create PayPal order: {str(e)}")

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Fetch order details from PayPal"""
        try:
            base_url = await self._get_base_url()
            access_token = await self._get_access_token()

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try v2 API first (orders), then v1 API (payments) if not found
                response = await client.get(
                    f"{base_url}/checkout/orders/{order_id}",
                    headers=headers
                )

                # If v2 API returns 404, try v1 API
                if response.status_code == 404:
                    response = await client.get(
                        f"{base_url}/payments/payment/{order_id}",
                        headers=headers
                    )

                if response.status_code == 404:
                    raise Exception(f"Order {order_id} not found")
                elif response.status_code == 401:
                    raise Exception("Invalid PayPal credentials")

                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            raise Exception(f"PayPal API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to fetch PayPal order: {str(e)}")

    async def normalize_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Convert unified request to PayPal format"""
    async def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Convert PayPal response to unified format"""
        # Extract amount from purchase_units
        purchase_unit = response.get("purchase_units", [{}])[0]
        amount_data = purchase_unit.get("amount", {})

        # Extract checkout URL
        checkout_url = None
        for link in response.get("links", []):
            if link.get("rel") == "approve":
                checkout_url = link["href"]
                break

        # Handle both v1 and v2 API response formats
        status = response.get('status') or response.get('state', 'unknown')
        if isinstance(status, str):
            status = status.lower()

        # Safely extract id
        id_val = response.get('id')
        if id_val:
            transaction_id = f"unf_{id_val}"
            provider_order_id = id_val
        else:
            transaction_id = None
            provider_order_id = None

        return {
            "transaction_id": transaction_id,
            "provider": "paypal",
            "provider_order_id": provider_order_id,
            "amount": float(amount_data.get("value", 0)) if amount_data else 0,
            "currency": amount_data.get("currency_code", "USD") if amount_data else "USD",
            "status": status,
            "checkout_url": checkout_url,
            "provider_data": response
        }