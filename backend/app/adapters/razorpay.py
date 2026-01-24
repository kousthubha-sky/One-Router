import logging
import httpx
from typing import Dict, Any, Optional, Literal
from pybreaker import CircuitBreaker
from .base import BaseAdapter
from .razorpay_transformer import RazorpayTransformer, UnifiedPaymentResponse, UnifiedRefundResponse, UnifiedSubscriptionResponse, UnifiedErrorResponse
from decimal import Decimal

logger = logging.getLogger(__name__)

class RazorpayAdapter(BaseAdapter):
    """Razorpay payment service adapter with environment segregation"""
    
    # Circuit breakers for external API calls
    _order_breaker = CircuitBreaker(fail_max=5, reset_timeout=60, listeners=[])
    _verify_breaker = CircuitBreaker(fail_max=5, reset_timeout=60, listeners=[])
    _refund_breaker = CircuitBreaker(fail_max=5, reset_timeout=60, listeners=[])

    def __init__(self, credentials: Dict[str, str], environment: Literal["test", "live"] = "test"):
        super().__init__(credentials)
        self.transformer = RazorpayTransformer()
        self.environment = environment
        
        # Validate that credentials match the environment
        key_id = credentials.get("RAZORPAY_KEY_ID", "")
        if environment == "live" and not key_id.startswith("rzp_live_"):
            logger.warning(f"Live adapter initialized with test key: {key_id[:20]}")
        elif environment == "test" and not key_id.startswith("rzp_test_"):
            logger.warning(f"Test adapter initialized with live key: {key_id[:20]}")

    async def _get_base_url(self) -> str:
        """Return Razorpay API base URL"""
        # Always use production API, credentials determine test/live mode
        return "https://api.razorpay.com/v1"

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get auth headers for Razorpay API calls"""
        import base64
        auth_str = f"{self.credentials['RAZORPAY_KEY_ID']}:{self.credentials['RAZORPAY_KEY_SECRET']}"
        auth_bytes = base64.b64encode(auth_str.encode()).decode()

        return {
            "Authorization": f"Basic {auth_bytes}",
            "Content-Type": "application/json"
        }

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
                success = response.status_code in [200, 400, 422]  # Success or validation errors
                
                if success:
                    logger.info(f"Validated Razorpay {self.environment} credentials")
                else:
                    logger.warning(f"Razorpay {self.environment} credential validation failed: {response.status_code}")
                
                return success

        except Exception as e:
            logger.error(f"Razorpay credential validation failed: {e}")
            return False

    async def create_order(self, amount: float, currency: str = "INR", **kwargs) -> Dict[str, Any]:
        """Create a Razorpay order using configured environment (test/live)"""
        try:
            logger.info(f"Creating Razorpay {self.environment} order: {amount} {currency}")
            return await self._order_breaker.call(self._create_order_impl, amount, currency, **kwargs)
        except Exception as e:
            logger.error(f"Failed to create Razorpay {self.environment} order: {e}")
            raise

    async def _create_order_impl(self, amount: float, currency: str = "INR", **kwargs) -> Dict[str, Any]:
        """Implementation of order creation (protected by circuit breaker)"""
        try:
            # Create unified request object
            from .razorpay_transformer import UnifiedPaymentRequest
            unified_request = UnifiedPaymentRequest(
                amount=Decimal(str(amount)),
                currency=currency,
                receipt=kwargs.get("receipt"),
                notes=kwargs.get("notes")
            )

            # Add payment method parameters if provided
            if kwargs.get("method"):
                unified_request.method = kwargs["method"]
            if kwargs.get("upi_app"):
                unified_request.upi_app = kwargs["upi_app"]
            if kwargs.get("emi_plan"):
                unified_request.emi_plan = kwargs["emi_plan"]
            if kwargs.get("card_network"):
                unified_request.card_network = kwargs["card_network"]
            if kwargs.get("wallet_provider"):
                unified_request.wallet_provider = kwargs["wallet_provider"]
            if kwargs.get("bank_code"):
                unified_request.bank_code = kwargs["bank_code"]

            # Transform to Razorpay format
            payload = self.transformer.transform_create_order_request(unified_request)

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

                # Transform response to unified format
                unified_response = self.transformer.transform_order_response(order_data)
                result = unified_response.dict()
                result["provider_data"] = order_data
                return result

        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Fetch order details from Razorpay"""
        try:
            return await self._order_breaker.call(self._get_order_impl, order_id)
        except Exception as e:
            logger.error(f"Failed to get Razorpay order {order_id}: {e}")
            raise

    async def create_payment_link(self, amount: float, currency: str = "INR", description: str = "", **kwargs) -> Dict[str, Any]:
        """Create a Razorpay payment link with checkout URL"""
        try:
            base_url = await self._get_base_url()
            auth = (
                self.credentials["RAZORPAY_KEY_ID"],
                self.credentials["RAZORPAY_KEY_SECRET"]
            )
            
            # Use provided callback_url or default to frontend
            from ..config import settings
            callback_url = kwargs.get("callback_url") or f"{settings.FRONTEND_URL}/credits/payment-callback"
            
            payload = {
                "amount": int(Decimal(str(amount)) * 100),  # Convert to paise
                "currency": currency,                "description": description,
                "notify": {
                    "sms": True,
                    "email": True
                },
                "reminder_enable": True,
                "notes": kwargs.get("notes", {})
            }
            
            if callback_url:
                payload["callback_url"] = callback_url
                payload["callback_method"] = "get"
            
            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/payment_links",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")
                elif response.status_code == 400:
                    error_data = response.json()
                    error_desc = error_data.get('error', {}).get('description', 'Unknown error')
                    raise Exception(f"Razorpay API error: {error_desc}")
                elif response.status_code == 429:
                    raise Exception("Razorpay rate limit exceeded")
                
                response.raise_for_status()
                link_data = response.json()
                
                # Return unified response with checkout_url
                return {
                    "transaction_id": f"pl_{link_data.get('id', '')}",
                    "provider": "razorpay",
                    "provider_order_id": link_data.get('id', ''),
                    "provider_payment_id": None,
                    "amount": Decimal(str(link_data.get('amount', 0))) / 100,  # Convert from paise
                    "currency": link_data.get('currency', 'INR'),
                    "status": link_data.get('status', 'created'),
                    "checkout_url": link_data.get('short_url', ''),
                    "provider_data": link_data
                }
                
        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")

    async def _get_order_impl(self, order_id: str) -> Dict[str, Any]:
        """Implementation of order fetch (protected by circuit breaker)"""
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

        except httpx.TimeoutException:
            raise Exception(f"Razorpay API request timed out fetching order {order_id}")
        
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API error: {str(e)}")    
    
    async def capture_payment(self, payment_id: str, amount: float, currency: str = "INR"):
        """Capture a payment with robust error handling"""
        try:
            base_url = await self._get_base_url()
            auth = (self.credentials["RAZORPAY_KEY_ID"], self.credentials["RAZORPAY_KEY_SECRET"])
            
            amount_paise = int(Decimal(str(amount)) * 100)  # Convert to paise

            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/payments/{payment_id}/capture",
                    json={
                        "amount": amount_paise,
                        "currency": currency
                    }
                )
                
                # Handle specific error codes
                if response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")
                elif response.status_code == 404:
                    raise Exception(f"Payment not found: {payment_id}")
                elif response.status_code == 400:
                    try:
                        error_data = response.json()
                        error_desc = error_data.get('error', {}).get('description', 'Unknown error')
                        raise Exception(f"Razorpay API error: {error_desc}")
                    except (ValueError, KeyError):
                        raise Exception(f"Razorpay API error (invalid response): {response.text}")
                elif response.status_code == 429:
                    raise Exception("Razorpay rate limit exceeded")
                
                response.raise_for_status()
                
                try:
                    capture_data = response.json()
                except ValueError as je:
                    raise Exception(f"Invalid JSON response from Razorpay: {response.text}")
                
                return capture_data
        
        except httpx.TimeoutException:
            raise Exception(f"Razorpay capture request timed out (payment_id: {payment_id}, amount: {amount} {currency})")
        except httpx.HTTPStatusError as e:
            response_text = ""
            try:
                response_text = e.response.text[:500]
            except Exception:
                pass
            raise Exception(f"Razorpay capture failed (payment_id: {payment_id}): {e.response.status_code} - {response_text}")
        except httpx.RequestError as e:
            raise Exception(f"Razorpay capture network error (payment_id: {payment_id}): {str(e)}")
        except Exception as e:
            # Log with context but re-raise
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"Payment capture error",
                extra={
                    "payment_id_prefix": payment_id[:8] if len(payment_id) > 8 else payment_id,
                    "amount": amount,
                    "currency": currency,
                    "error": str(e)
                },
                exc_info=True
            )
            raise

    async def create_refund(self, payment_id: str, amount: Optional[float] = None):
        """Create a refund (full or partial)"""
        try:
            # Create unified request object
            from .razorpay_transformer import UnifiedRefundRequest
            unified_request = UnifiedRefundRequest(
                payment_id=payment_id,
                amount=amount
            )

            # Transform to Razorpay format
            payload = self.transformer.transform_create_refund_request(unified_request)

            base_url = await self._get_base_url()
            auth = (self.credentials["RAZORPAY_KEY_ID"], self.credentials["RAZORPAY_KEY_SECRET"])

            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/payments/{payment_id}/refund",
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
                refund_data = response.json()

                # Transform response to unified format
                unified_response = self.transformer.transform_refund_response(refund_data)
                result = unified_response.dict()
                result["provider_data"] = refund_data
                return result
        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create Razorpay refund: {str(e)}")

    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """Verify Razorpay webhook signature"""
        import hmac
        import hashlib

        webhook_secret = self.credentials.get("RAZORPAY_WEBHOOK_SECRET")
        if not webhook_secret:
            import logging
            logging.getLogger(__name__).warning("RAZORPAY_WEBHOOK_SECRET not configured, webhook verification will fail")
            return False


        expected_signature = hmac.new(
            webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)



    # Subscription Methods
    async def create_subscription(self, plan_id: str, customer_notify: bool = True, **kwargs):
        """Create subscription using transformer"""
        try:
            # Create unified request object
            from .razorpay_transformer import UnifiedSubscriptionRequest
            unified_request = UnifiedSubscriptionRequest(
                plan_id=plan_id,
                customer_notify=customer_notify,
                total_count=kwargs.get("total_count", 12),
                quantity=kwargs.get("quantity", 1),
                trial_days=kwargs.get("trial_days"),
                start_date=kwargs.get("start_date")
            )

            # Transform to Razorpay format
            payload = self.transformer.transform_create_subscription_request(unified_request)

            # Add any additional kwargs
            payload.update(kwargs)
            
            base_url = await self._get_base_url()
            auth = (self.credentials["RAZORPAY_KEY_ID"], self.credentials["RAZORPAY_KEY_SECRET"])

            async with httpx.AsyncClient(auth=auth, timeout=30.0) as client:
                response = await client.post(
                    f"{base_url}/subscriptions",
                    json=payload
                )

                if response.status_code == 401:
                    raise Exception("Invalid Razorpay credentials")
                elif response.status_code == 400:
                    error_data = response.json()
                    error_desc = error_data.get('error', {}).get('description', 'Unknown error')
                    raise Exception(f"Razorpay subscription error: {error_desc}")

                response.raise_for_status()
                subscription_data = response.json()

                # Transform response to unified format
                unified_response = self.transformer.transform_subscription_response(subscription_data)
                result = unified_response.dict()
                result["provider_data"] = subscription_data
                return result
        except httpx.TimeoutException:
            raise Exception("Razorpay API request timed out")
        except httpx.HTTPError as e:
            raise Exception(f"Razorpay API network error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create Razorpay subscription: {str(e)}")
    async def get_subscription(self, subscription_id: str):
        """Get subscription details"""
        return await self.call_api(f"/v1/subscriptions/{subscription_id}", method="GET")

    async def cancel_subscription(self, subscription_id: str, cancel_at_cycle_end: bool = False):
        """Cancel subscription"""
        payload = {"cancel_at_cycle_end": cancel_at_cycle_end}
        return await self.call_api(f"/v1/subscriptions/{subscription_id}/cancel", method="POST", payload=payload)

    async def pause_subscription(self, subscription_id: str, pause_at: str = "now"):
        """Pause subscription"""
        payload = {"pause_at": pause_at}
        return await self.call_api(f"/v1/subscriptions/{subscription_id}/pause", method="POST", payload=payload)

    async def resume_subscription(self, subscription_id: str, resume_at: str = "now"):
        """Resume subscription"""
        payload = {"resume_at": resume_at}
        return await self.call_api(f"/v1/subscriptions/{subscription_id}/resume", method="POST", payload=payload)

    async def change_plan(self, subscription_id: str, new_plan_id: str, prorate: bool = True):
        """Change subscription plan"""
        payload = {
            "plan_id": new_plan_id,
            "prorate": prorate
        }
        return await self.call_api(f"/v1/subscriptions/{subscription_id}", method="PATCH", payload=payload)

    async def create_split_payment(self, amount: float, currency: str, splits: list, description: Optional[str] = None, metadata: Optional[dict] = None):
        """Create split payment for marketplace vendors"""
        # Razorpay doesn't have native split payment API - this is a mock implementation
        # In production, you would need to integrate with Razorpay's payment links with vendors
        split_amounts = sum(s.get("amount", 0) for s in splits)

        if split_amounts > amount:
            raise Exception("Total split amounts exceed payment amount")

        # Create payment order
        order = await self.create_order(amount=amount, currency=currency, receipt=f"split_{int(amount)}")

        # Return split payment details
        return {
            "payment_order_id": order.get("id"),
            "amount": amount,
            "currency": currency,
            "splits": splits,
            "description": description,
            "metadata": metadata,
            "status": "created",
            "payment_link": order.get("short_url")
        }