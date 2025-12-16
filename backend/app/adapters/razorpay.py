import httpx
from typing import Dict, Any, Optional
from .base import BaseAdapter

class RazorpayAdapter(BaseAdapter):
    """Razorpay payment service adapter"""

    def __init__(self, credentials: Dict[str, str]):
        super().__init__(credentials)

    async def _get_base_url(self) -> str:
        """Return Razorpay API base URL"""
        # Always use production API, credentials determine test/live mode
        return "https://api.razorpay.com/v1"

    async def validate_credentials(self) -> bool:
        """Validate Razorpay credentials by creating a test order"""
        try:
            # Get the base URL
            base_url = await self._get_base_url()

            auth = (
                self.credentials["RAZORPAY_KEY_ID"],
                self.credentials["RAZORPAY_KEY_SECRET"]
            )

            # Try to create a minimal test order to validate credentials
            test_payload = {
                "amount": 100,  # 1 INR in paise (minimum amount)
                "currency": "INR",
                "payment_capture": 1
            }

            async with httpx.AsyncClient(auth=auth, timeout=10.0) as client:
                response = await client.post(f"{base_url}/orders", json=test_payload)

                # If we get a successful response (even if it's an error about amount),
                # it means credentials are valid
                return response.status_code in [200, 400, 422]  # Success or validation errors

        except Exception as e:
            print(f"Razorpay credential validation failed: {e}")
            return False

    async def create_order(self, amount: float, currency: str = "INR", **kwargs) -> Dict[str, Any]:
        """Create a Razorpay order"""
        try:
            # Extract optional parameters
            receipt = kwargs.get("receipt")
            notes = kwargs.get("notes")

            # Convert amount to paise (Razorpay expects smallest currency unit)
            amount_paise = round(amount * 100)

            payload = {
                "amount": amount_paise,
                "currency": currency,
                "payment_capture": 1  # Auto-capture payments
            }

            if receipt:
                payload["receipt"] = receipt

            if notes:
                payload["notes"] = notes

            # Get the base URL
            base_url = await self._get_base_url()

            # Make API request with Basic Auth
            auth = (
                self.credentials["RAZORPAY_KEY_ID"],
                self.credentials["RAZORPAY_KEY_SECRET"]
            )

            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/orders",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                # Handle specific error codes
                if response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")
                elif response.status_code == 400:
                    error_data = response.json()
                    error_desc = error_data.get('error', {}).get('description', 'Unknown error')
                    raise Exception(f"Razorpay API error: {error_desc}")
                elif response.status_code == 429:
                    raise Exception("Razorpay rate limit exceeded")

                response.raise_for_status()
                order_data = response.json()

                # Return normalized response
                return {
                    "transaction_id": f"unf_{order_data['id']}",
                    "provider": "razorpay",
                    "provider_order_id": order_data['id'],
                    "amount": amount,
                    "currency": currency,
                    "status": "created",
                    "receipt": order_data.get('receipt'),
                    "created_at": order_data.get('created_at'),
                    "provider_data": order_data
                }

        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create Razorpay order: {str(e)}")

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Fetch order details from Razorpay"""
        try:
            # Get the base URL
            base_url = await self._get_base_url()

            auth = (
                self.credentials["RAZORPAY_KEY_ID"],
                self.credentials["RAZORPAY_KEY_SECRET"]
            )

            async with httpx.AsyncClient(auth=auth, timeout=10.0) as client:
                response = await client.get(f"{base_url}/orders/{order_id}")

                if response.status_code == 404:
                    raise Exception(f"Order {order_id} not found")
                elif response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")

                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to fetch Razorpay order: {str(e)}")

    async def capture_payment(self, payment_id: str, amount: float, currency: str = "INR"):
        """Capture a payment"""
        base_url = await self._get_base_url()
        auth = (self.credentials["RAZORPAY_KEY_ID"], self.credentials["RAZORPAY_KEY_SECRET"])

        async with httpx.AsyncClient(auth=auth) as client:
            response = await client.post(
                f"{base_url}/payments/{payment_id}/capture",
                json={
                    "amount": int(amount * 100),  # Convert to paise
                    "currency": currency
                }
            )
            response.raise_for_status()
            return response.json()

    async def create_refund(self, payment_id: str, amount: float = None):
        """Create a refund (full or partial)"""
        try:
            base_url = await self._get_base_url()
            auth = (self.credentials["RAZORPAY_KEY_ID"], self.credentials["RAZORPAY_KEY_SECRET"])

            payload = {"payment_id": payment_id}
            if amount:
                payload["amount"] = int(amount * 100)  # Partial refund in paise

            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/refunds",
                    json=payload
                )
                
                if response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")
                elif response.status_code == 400:
                    error_data = response.json()
                    error_desc = error_data.get('error', {}).get('description', 'Unknown error')
                    raise Exception(f"Razorpay refund error: {error_desc}")
                elif response.status_code == 404:
                    raise Exception(f"Payment {payment_id} not found")
                
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create Razorpay refund: {str(e)}")

    async def create_payment_link(
        self,
        amount: float,
        description: str,
        customer_email: str = None,
        customer_phone: str = None
    ):
        """Create a payment link"""
        try:
            base_url = await self._get_base_url()
            auth = (self.credentials["RAZORPAY_KEY_ID"], self.credentials["RAZORPAY_KEY_SECRET"])

            payload = {
                "amount": int(amount * 100),
                "currency": "INR",
                "description": description
            }
            
            # Only add customer object if we have data
            if customer_email or customer_phone:
                payload["customer"] = {}
                if customer_email:
                    payload["customer"]["email"] = customer_email
                if customer_phone:
                    payload["customer"]["contact"] = customer_phone

            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/payment_links",
                    json=payload
                )
                
                if response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")
                elif response.status_code == 400:
                    error_data = response.json()
                    error_desc = error_data.get('error', {}).get('description', 'Unknown error')
                    raise Exception(f"Razorpay payment link error: {error_desc}")
                
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create Razorpay payment link: {str(e)}")

    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """Verify Razorpay webhook signature"""
        import hmac
        import hashlib

        webhook_secret = self.credentials.get("RAZORPAY_WEBHOOK_SECRET")
        if not webhook_secret:
            return False

        expected_signature = hmac.new(
            webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    async def normalize_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Convert unified request to Razorpay format"""
        # Convert amount to paise
        if "amount" in request:
            request["amount"] = int(float(request["amount"]) * 100)

        # Add Razorpay-specific defaults
        request.setdefault("payment_capture", 1)
        request.setdefault("currency", "INR")

        return request

    async def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Razorpay response to unified format"""
        return {
            "transaction_id": f"unf_{response['id']}",
            "provider": "razorpay",
            "provider_order_id": response['id'],
            "amount": response['amount'] / 100,  # Convert from paise
            "currency": response['currency'],
            "status": response['status'],
            "created_at": response['created_at'],
            "receipt": response.get('receipt'),
            "provider_data": response
        }