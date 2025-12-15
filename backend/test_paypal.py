#!/usr/bin/env python3
"""
Tests for PayPal Adapter
"""

import asyncio
import sys
import os
from dotenv import load_dotenv
sys.path.append('.')

# Load environment variables
load_dotenv()

from app.adapters.paypal import PayPalAdapter

def test_paypal_adapter():
    """Test the PayPalAdapter"""
    print("Testing PayPal Adapter...")

    # Get credentials from environment
    credentials = {
        'PAYPAL_CLIENT_ID': os.getenv('PAYPAL_CLIENT_ID'),
        'PAYPAL_CLIENT_SECRET': os.getenv('PAYPAL_CLIENT_SECRET'),
        'PAYPAL_MODE': os.getenv('PAYPAL_MODE', 'sandbox')
    }

    if not credentials['PAYPAL_CLIENT_ID'] or not credentials['PAYPAL_CLIENT_SECRET']:
        print("PayPal credentials not found in environment")
        return False

    print(f"  Using mode: {credentials['PAYPAL_MODE']}")

    async def run_tests():
        adapter = PayPalAdapter(credentials)

        # Test 1: Base URL
        print("1. Testing base URL...")
        base_url = await adapter._get_base_url()
        expected_url = "https://api-m.sandbox.paypal.com/v1" if credentials['PAYPAL_MODE'] == 'sandbox' else "https://api.paypal.com/v1"
        assert base_url == expected_url, f"Expected {expected_url}, got {base_url}"
        print("   Base URL correct")

        # Test 2: Credential validation
        print("2. Testing credential validation...")
        is_valid = await adapter.validate_credentials()
        assert is_valid, "Credential validation failed"
        print("   Credentials are valid")

        # Test 3: Create order
        print("3. Creating test order...")
        order = await adapter.create_order(
            amount=1.00,  # ₹1
            currency="INR"
        )

        assert order['provider'] == 'paypal', "Provider should be paypal"
        assert order['amount'] == 1.00, "Amount should be 1.00"
        assert order['currency'] == "INR", "Currency should be INR"
        assert 'transaction_id' in order, "Should have transaction_id"
        assert 'checkout_url' in order, "Should have checkout_url"
        assert order['status'] == 'created', "Status should be created"

        print(f"   Order created: {order['transaction_id']}")
        print(f"   Checkout URL: {order['checkout_url'][:50]}...")

        # Test 4: Get order
        print("4. Fetching order details...")
        fetched_order = await adapter.get_order(order['provider_order_id'])

        assert fetched_order['id'] == order['provider_order_id'], "Order ID should match"
        # Note: v1 API might have different status field, just check it exists
        assert 'state' in fetched_order or 'status' in fetched_order, "Order should have status/state field"
        print("   Order details fetched successfully")

        # Test 5: Response normalization
        print("5. Testing response normalization...")
        normalized = await adapter.normalize_response(fetched_order)

        assert normalized['provider'] == 'paypal', "Normalized provider should be paypal"
        assert normalized['transaction_id'].startswith('unf_'), "Transaction ID should start with unf_"
        assert normalized['status'] == 'created', "Status should be normalized"
        print("   Response normalization works")

        return True

    try:
        success = asyncio.run(run_tests())
        print("PayPal Adapter tests PASSED!")
        return True
    except Exception as e:
        print(f"PayPal Adapter tests FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_paypal_tests():
    """Run PayPal adapter tests"""
    print("Running PayPal Adapter Tests\n")

    success = test_paypal_adapter()

    if success:
        print("\nAll PayPal tests passed! PayPal integration is ready.")
    else:
        print("\nPayPal tests failed. Check credentials and network.")

    return success

if __name__ == "__main__":
    success = run_paypal_tests()
    sys.exit(0 if success else 1)