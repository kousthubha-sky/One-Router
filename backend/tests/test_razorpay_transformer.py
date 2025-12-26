"""
Tests for Razorpay transformer
"""

import pytest
from decimal import Decimal
from app.adapters.razorpay_transformer import (
    RazorpayTransformer,
    UnifiedPaymentRequest,
    UnifiedRefundRequest,
    UnifiedSubscriptionRequest,
    UnifiedPaymentResponse,
    UnifiedRefundResponse,
    UnifiedSubscriptionResponse,
    UnifiedErrorResponse
)


class TestRazorpayTransformer:

    def test_amount_conversions(self):
        """Test amount conversion between Decimal and paise"""
        # Test to paise
        assert RazorpayTransformer.amount_to_paise(Decimal("10.50")) == 1050
        assert RazorpayTransformer.amount_to_paise(Decimal("0.01")) == 1
        assert RazorpayTransformer.amount_to_paise(Decimal("100")) == 10000

        # Test from paise
        assert RazorpayTransformer.paise_to_amount(1050) == Decimal("10.50")
        assert RazorpayTransformer.paise_to_amount(1) == Decimal("0.01")
        assert RazorpayTransformer.paise_to_amount(10000) == Decimal("100")

    def test_transform_create_order_request(self):
        """Test order request transformation"""
        unified = UnifiedPaymentRequest(
            amount=Decimal("10.50"),
            currency="INR",
            receipt="receipt#123",
            notes={"key": "value"}
        )

        result = RazorpayTransformer.transform_create_order_request(unified)

        expected = {
            "amount": 1050,
            "currency": "INR",
            "receipt": "receipt#123",
            "notes": {"key": "value"},
            "payment_capture": 1
        }

        assert result == expected

    def test_transform_create_refund_request_full(self):
        """Test full refund request transformation"""
        unified = UnifiedRefundRequest(
            payment_id="pay_123",
            amount=None  # Full refund
        )

        result = RazorpayTransformer.transform_create_refund_request(unified)

        expected = {
            "speed": "normal"
        }

        assert result == expected

    def test_transform_create_refund_request_partial(self):
        """Test partial refund request transformation"""
        unified = UnifiedRefundRequest(
            payment_id="pay_123",
            amount=5.25,
            notes={"reason": "customer request"}
        )

        result = RazorpayTransformer.transform_create_refund_request(unified)

        expected = {
            "speed": "normal",
            "amount": 525,
            "notes": {"reason": "customer request"}
        }

        assert result == expected

    def test_transform_create_subscription_request(self):
        """Test subscription request transformation"""
        unified = UnifiedSubscriptionRequest(
            plan_id="plan_monthly",
            customer_notify=True,
            total_count=12,
            quantity=2
        )

        result = RazorpayTransformer.transform_create_subscription_request(unified)

        expected = {
            "plan_id": "plan_monthly",
            "customer_notify": True,
            "total_count": 12,
            "quantity": 2
        }

        assert result == expected

    def test_transform_order_response(self):
        """Test order response transformation"""
        razorpay_response = {
            "id": "order_RB58MiP5SPFYyM",
            "amount": 1050,
            "currency": "INR",
            "status": "created",
            "receipt": "receipt#123",
            "created_at": 1640995200
        }

        result = RazorpayTransformer.transform_order_response(razorpay_response)

        assert isinstance(result, UnifiedPaymentResponse)
        assert result.transaction_id == "unf_order_RB58MiP5SPFYyM"
        assert result.provider == "razorpay"
        assert result.amount == Decimal("10.50")
        assert result.currency == "INR"
        assert result.status == "created"
        assert result.receipt == "receipt#123"
        assert result.created_at == 1640995200

    def test_transform_refund_response(self):
        """Test refund response transformation"""
        razorpay_response = {
            "id": "rfnd_123",
            "payment_id": "pay_123",
            "amount": 525,
            "currency": "INR",
            "status": "processed",
            "created_at": 1640995200
        }

        result = RazorpayTransformer.transform_refund_response(razorpay_response)

        assert isinstance(result, UnifiedRefundResponse)
        assert result.refund_id == "rfnd_123"
        assert result.payment_id == "pay_123"
        assert result.amount == Decimal("5.25")
        assert result.currency == "INR"
        assert result.status == "completed"
        assert result.created_at == 1640995200

    def test_transform_subscription_response(self):
        """Test subscription response transformation"""
        razorpay_response = {
            "id": "sub_123",
            "plan_id": "plan_monthly",
            "status": "active",
            "total_count": 12,
            "quantity": 2,
            "current_start": 1640995200,
            "current_end": 1643673600,
            "remaining_count": 10,
            "created_at": 1640995200
        }

        result = RazorpayTransformer.transform_subscription_response(razorpay_response)

        assert isinstance(result, UnifiedSubscriptionResponse)
        assert result.subscription_id == "sub_123"
        assert result.plan_id == "plan_monthly"
        assert result.status == "active"
        assert result.total_count == 12
        assert result.quantity == 2
        assert result.current_start == 1640995200
        assert result.current_end == 1643673600
        assert result.remaining_count == 10
        assert result.created_at == 1640995200

    def test_status_mapping(self):
        """Test status mapping for different entity types"""
        # Order status mapping
        assert RazorpayTransformer.ORDER_STATUS_MAP["created"] == "created"
        assert RazorpayTransformer.ORDER_STATUS_MAP["attempted"] == "pending"
        assert RazorpayTransformer.ORDER_STATUS_MAP["paid"] == "completed"

        # Refund status mapping
        assert RazorpayTransformer.REFUND_STATUS_MAP["pending"] == "pending"
        assert RazorpayTransformer.REFUND_STATUS_MAP["processed"] == "completed"
        assert RazorpayTransformer.REFUND_STATUS_MAP["failed"] == "failed"

        # Subscription status mapping
        assert RazorpayTransformer.SUBSCRIPTION_STATUS_MAP["active"] == "active"
        assert RazorpayTransformer.SUBSCRIPTION_STATUS_MAP["cancelled"] == "cancelled"
        assert RazorpayTransformer.SUBSCRIPTION_STATUS_MAP["completed"] == "completed"

    def test_transform_error_response(self):
        """Test error response transformation"""
        # Standard Razorpay error format
        error_response = {
            "error": {
                "code": "BAD_REQUEST_ERROR",
                "description": "The amount must be atleast INR 1.00"
            }
        }

        result = RazorpayTransformer.transform_error_response(error_response)

        assert isinstance(result, UnifiedErrorResponse)
        assert result.error_code == "BAD_REQUEST_ERROR"
        assert result.message == "The amount must be atleast INR 1.00"
        assert result.provider_error == error_response

    def test_transform_error_response_fallback(self):
        """Test error response transformation with malformed error"""
        # Malformed error response
        error_response = {"some": "data"}

        result = RazorpayTransformer.transform_error_response(error_response)

        assert isinstance(result, UnifiedErrorResponse)
        assert result.error_code == "UNKNOWN_ERROR"
        assert result.message == "Unknown error occurred"

    def test_invalid_response_handling(self):
        """Test handling of invalid/malformed responses"""
        # Missing required field
        with pytest.raises(ValueError):
            RazorpayTransformer.transform_order_response({"amount": 1000})  # Missing id

        with pytest.raises(ValueError):
            RazorpayTransformer.transform_refund_response({"id": "rfnd_123"})  # Missing payment_id

        with pytest.raises(ValueError):
            RazorpayTransformer.transform_subscription_response({"id": "sub_123"})  # Missing plan_id