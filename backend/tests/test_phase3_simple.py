"""
Simple test for Phase 3: Dynamic Service Detection & Pass-Through API

Tests the core functionality implemented in Phase 3.
"""

import pytest
from app.services.env_parser import EnvParserService


def test_env_parser_subscription_detection():
    """Test that .env parser correctly detects subscription plans"""
    parser = EnvParserService()

    # Sample .env with Razorpay subscriptions
    env_content = """
    RAZORPAY_KEY_ID=rzp_test_123
    RAZORPAY_KEY_SECRET=secret_123
    RAZORPAY_SUBSCRIPTION_PLAN_BASIC=plan_monthly_99
    RAZORPAY_SUBSCRIPTION_PLAN_PRO=plan_monthly_499
    """

    env_vars = parser.parse_env_content(env_content)
    detections = parser.detect_services(env_vars)

    assert len(detections) == 1
    detection = detections[0]

    assert detection.service_name == "razorpay"
    assert detection.features["subscriptions"] == True
    assert len(detection.feature_metadata["subscription_plans"]) == 2

    # Check plan details
    plans = {plan["env_key"]: plan for plan in detection.feature_metadata["subscription_plans"]}
    assert plans["RAZORPAY_SUBSCRIPTION_PLAN_BASIC"]["plan_id"] == "plan_monthly_99"
    assert plans["RAZORPAY_SUBSCRIPTION_PLAN_BASIC"]["name"] == "Basic"


def test_env_parser_mixed_services():
    """Test detection with both Razorpay and PayPal"""
    parser = EnvParserService()

    env_content = """
    RAZORPAY_KEY_ID=rzp_test_123
    RAZORPAY_KEY_SECRET=secret_123
    RAZORPAY_SUBSCRIPTION_PLAN_BASIC=plan_monthly_99

    PAYPAL_CLIENT_ID=test_client
    PAYPAL_CLIENT_SECRET=test_secret
    PAYPAL_SUBSCRIPTION_PLAN_BASIC=P-123456
    """

    env_vars = parser.parse_env_content(env_content)
    detections = parser.detect_services(env_vars)

    assert len(detections) == 2

    # Check Razorpay
    razorpay = next(d for d in detections if d.service_name == "razorpay")
    assert razorpay.features["subscriptions"] == True
    assert len(razorpay.feature_metadata["subscription_plans"]) == 1

    # Check PayPal
    paypal = next(d for d in detections if d.service_name == "paypal")
    assert paypal.features["subscriptions"] == True
    assert len(paypal.feature_metadata["subscription_plans"]) == 1


def test_env_parser_no_subscriptions():
    """Test that services without subscription plans don't enable subscriptions"""
    parser = EnvParserService()

    env_content = """
    RAZORPAY_KEY_ID=rzp_test_123
    RAZORPAY_KEY_SECRET=secret_123
    RAZORPAY_WEBHOOK_SECRET=webhook_123
    """

    env_vars = parser.parse_env_content(env_content)
    detections = parser.detect_services(env_vars)

    assert len(detections) == 1
    detection = detections[0]
    assert detection.service_name == "razorpay"
    assert detection.features["subscriptions"] == False  # No subscription plans detected


def test_adapter_generic_call():
    """Test that adapters have the call_api method"""
    from app.adapters.razorpay import RazorpayAdapter

    adapter = RazorpayAdapter({
        "RAZORPAY_KEY_ID": "test_key",
        "RAZORPAY_KEY_SECRET": "test_secret"
    })

    # Just check that the method exists
    assert hasattr(adapter, 'call_api')
    assert callable(getattr(adapter, 'call_api'))


def test_provider_detection():
    """Test helper functions for provider detection"""
    from app.routes.unified_api import _detect_provider_from_id

    # Test subscription ID detection
    assert _detect_provider_from_id("sub_123456789") == "razorpay"
    assert _detect_provider_from_id("I-123456789") == "paypal"
    assert _detect_provider_from_id("unknown_format") == "razorpay"  # Default fallback