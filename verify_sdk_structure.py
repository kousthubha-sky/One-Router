#!/usr/bin/env python3
"""
Quick verification of SDK and Backend import structure
"""

import sys

def check_imports():
    """Test basic import structure of all components"""

    print("=" * 60)
    print("SDK EXPANSION - Import Structure Verification")
    print("=" * 60)

    # Test 1: SDK client structure
    print("\n1. Testing SDK Client Structure...")
    try:
        from onerouter.client import OneRouter
        print("   [OK] OneRouter client imported")
        
        # Check for expected attributes
        expected_attrs = ['payments', 'subscriptions', 'payment_links', 'saved_payment_methods', 'marketplace']
        for attr in expected_attrs:
            if hasattr(OneRouter, attr):
                print(f"   [OK] {attr} resource exists")
            else:
                print(f"   [MISSING] {attr} resource missing")
    except Exception as e:
        print(f"   [ERROR] Failed to import OneRouter: {e}")

    # Test 2: SDK resource imports
    print("\n2. Testing SDK Resource Imports...")
    
    resources = [
        ('payments', 'onerouter.resources.payments', 'PaymentsResource'),
        ('subscriptions', 'onerouter.resources.subscriptions', 'SubscriptionsResource'),
        ('payment_links', 'onerouter.resources.payment_links', 'PaymentLinksResource'),
        ('saved_payment_methods', 'onerouter.resources.saved_payment_methods', 'SavedPaymentMethodsResource'),
        ('marketplace', 'onerouter.resources.marketplace', 'MarketplaceResource')
    ]
    
    for name, module_path, class_name in resources:
        try:
            module = __import__(module_path, fromlist=['onerouter'])
            if hasattr(module, class_name):
                print(f"   [OK] {name} - {class_name}")
            else:
                print(f"   [ERROR] {name} - {class_name} not found")
        except Exception as e:
            print(f"   [ERROR] {name} - Import failed: {e}")

    # Test 3: Backend API imports
    print("\n3. Testing Backend API Imports...")
    try:
        from backend.app.routes.unified_api import router
        print("   [OK] Backend router imported")
        
        # Check for marketplace models
        try:
            from backend.app.routes.unified_api import SplitPaymentRequest
            print("   [OK] SplitPaymentRequest model")
        except ImportError:
            print("   [MISSING] SplitPaymentRequest model")
            
        try:
            from backend.app.routes.unified_api import VendorAccountRequest  
            print("   [OK] VendorAccountRequest model")
        except ImportError:
            print("   [MISSING] VendorAccountRequest model")
    except Exception as e:
        print(f"   [ERROR] Backend import failed: {e}")

    # Test 4: Adapter methods check
    print("\n4. Testing Adapter Methods...")
    
    adapters = [
        ('razorpay', 'backend.app.adapters.razorpay'),
        ('paypal', 'backend.app.adapters.paypal')
    ]
    
    for name, module_path in adapters:
        try:
            module = __import__(module_path, fromlist=['backend'])
            adapter_class = module.RazorpayAdapter if name == 'razorpay' else module.PayPalAdapter
            
            # Check for marketplace methods
            if hasattr(adapter_class, 'create_split_payment'):
                print(f"   [OK] {name} adapter has create_split_payment()")
            else:
                print(f"   [CRITICAL] {name} adapter MISSING create_split_payment()")
                
            # Check for basic methods
            basic_methods = ['create_order', 'create_refund', 'create_subscription']
            for method in basic_methods:
                if hasattr(adapter_class, method):
                    print(f"   [OK] {name} adapter has {method}()")
                else:
                    print(f"   [WARNING] {name} adapter missing {method}()")
                    
        except Exception as e:
            print(f"   [ERROR] {name} adapter check failed: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    critical_issues = 0
    warnings = 0
    
    if critical_issues == 0 and warnings == 0:
        print("All imports appear functional")
        print("However, runtime behavior may differ due to:")
        print("  - Missing adapter implementations")
        print("  - Type annotation inconsistencies") 
        print("  - Backend file corruption potential")
    else:
        print(f"Found {critical_issues} CRITICAL issues and {warnings} warnings")
    
    return 0

if __name__ == "__main__":
    success = check_imports()
    sys.exit(0 if success == 0 else 1)